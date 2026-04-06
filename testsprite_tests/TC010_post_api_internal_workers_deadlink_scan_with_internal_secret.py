import requests

BASE_URL = "http://localhost:3000"
INTERNAL_DEADLINK_SCAN_PATH = "/api/internal/workers/deadlink-scan"
VALID_INTERNAL_SECRET = "super-secret-key"
INVALID_INTERNAL_SECRET = "invalid-secret-token"

def test_post_api_internal_workers_deadlink_scan_with_internal_secret():
    headers_valid = {
        "x-internal-secret": VALID_INTERNAL_SECRET
    }
    headers_missing = {}
    headers_invalid = {
        "x-internal-secret": INVALID_INTERNAL_SECRET
    }

    # Test with valid internal secret - expect 200 and correct message
    try:
        response = requests.post(
            f"{BASE_URL}{INTERNAL_DEADLINK_SCAN_PATH}",
            headers=headers_valid,
            timeout=30
        )
    except Exception as e:
        assert False, f"Request with valid secret failed: {e}"
    assert response.status_code == 200, f"Expected 200 but got {response.status_code} with valid secret"
    json_resp = None
    try:
        json_resp = response.json()
    except Exception:
        assert False, "Response is not valid JSON with valid secret"
    assert "message" in json_resp, "Response JSON missing 'message' key with valid secret"
    assert json_resp["message"] == "Dead link scan job enqueued", f"Unexpected message: {json_resp['message']}"

    # Test missing internal secret - expect 401 Unauthorized
    try:
        response = requests.post(
            f"{BASE_URL}{INTERNAL_DEADLINK_SCAN_PATH}",
            headers=headers_missing,
            timeout=30
        )
    except Exception as e:
        assert False, f"Request with missing secret failed: {e}"
    assert response.status_code == 401, f"Expected 401 but got {response.status_code} with missing secret"

    # Test invalid internal secret - expect 401 Unauthorized
    try:
        response = requests.post(
            f"{BASE_URL}{INTERNAL_DEADLINK_SCAN_PATH}",
            headers=headers_invalid,
            timeout=30
        )
    except Exception as e:
        assert False, f"Request with invalid secret failed: {e}"
    assert response.status_code == 401, f"Expected 401 but got {response.status_code} with invalid secret"


test_post_api_internal_workers_deadlink_scan_with_internal_secret()