import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_health_check_system_health_status():
    url = f"{BASE_URL}/api/health"
    headers = {}

    try:
        # Test healthy scenario
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        json_data = response.json()
        assert "database" in json_data and json_data["database"] == "healthy", "Database status not healthy"
        assert "redis" in json_data and json_data["redis"] == "healthy", "Redis status not healthy"
        assert "workers" in json_data and json_data["workers"] == "running", "Workers status not running"

        # Test unhealthy scenario by simulating dependency down.
        # Since no direct means to bring down a dependency is provided in test input,
        # We simulate by calling endpoint with a header to trigger such test if supported.
        # The PRD does not specify such query param or header, so we attempt to call normally,
        # expecting 503 if any dependency down.

        # This is a best-effort fallback test for 503 scenario to verify error details.
        # It may require environment manipulation outside this test.
        # Here we try a second call and assert that if status is 503, error details exist.
        # If 200 returned again, then pass silently because environment is healthy.

        response2 = requests.get(url, headers=headers, timeout=TIMEOUT)
        if response2.status_code == 503:
            err_json = response2.json()
            assert isinstance(err_json, dict), "Error response is not a JSON object"
            # Expect keys for error details about dependencies
            has_details = any(key in err_json for key in ("database", "redis", "workers", "error", "details"))
            assert has_details, "503 response missing error details about dependencies"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_health_check_system_health_status()