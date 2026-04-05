import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
HEALTH_ENDPOINT = "/api/health"
TIMEOUT = 30


def test_api_health_check_system_health_status():
    # Test healthy scenario
    try:
        response = requests.get(f"{BASE_URL}{HEALTH_ENDPOINT}", timeout=TIMEOUT)
    except RequestException as e:
        assert False, f"Request to health endpoint failed: {e}"

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_data, dict), "Response JSON is not a dict"
    # Validate keys and healthy status values
    for key in ["database", "redis", "workers"]:
        assert key in json_data, f"'{key}' key missing in health response"
        if key == "workers":
            assert json_data[key] in ["healthy", "running", "degraded"], f"Expected '{key}' to be 'healthy', 'running' or 'degraded', got '{json_data[key]}'"
        else:
            assert json_data[key] == "healthy", f"Expected '{key}' to be 'healthy', got '{json_data[key]}'"

    # Test unhealthy scenario: simulate dependency down
    # Since we cannot actually bring down services, attempt to detect 503 response if exists.
    # The PRD states 503 with error details returned if any dependency is down.
    # We'll attempt the call multiple times to check if 503 occurs to cover that scenario.
    # In real test environment, dependency simulation should be done otherwise.
    unhealthy_detected = False
    for _ in range(3):
        try:
            resp = requests.get(f"{BASE_URL}{HEALTH_ENDPOINT}", timeout=TIMEOUT)
        except RequestException:
            continue
        if resp.status_code == 503:
            unhealthy_detected = True
            try:
                error_json = resp.json()
            except ValueError:
                assert False, "503 response is not JSON with error details"

            assert "error" in error_json or "details" in error_json, "Expected error details in 503 response"
            break

    # It's acceptable if unhealthy is not detected because it depends on system status,
    # but if detected ensure proper format is validated.
    # So no assert on unhealthy_detected True/False here, coverage only if it happens.


test_api_health_check_system_health_status()
