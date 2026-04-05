import requests

BASE_URL = "http://localhost:3000"
VALID_INTERNAL_SECRET = "secret-key-used-in-tests"  # The valid secret used for success test


def test_post_api_internal_workers_deadlink_scan_with_internal_secret():
    import json

    headers_valid = {
        "x-internal-secret": VALID_INTERNAL_SECRET
    }
    url = f"{BASE_URL}/api/internal/workers/deadlink-scan"

    # Test valid secret - expect 200 and job enqueued message
    try:
        resp = requests.post(url, headers=headers_valid, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
    try:
        body = resp.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "message" in body, "Response JSON missing 'message'"
    assert body["message"] == "Dead link scan job enqueued", f"Unexpected message: {body['message']}"

    # Test missing internal secret - expect 401 Unauthorized
    headers_missing_secret = {}
    try:
        resp_missing = requests.post(url, headers=headers_missing_secret, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert resp_missing.status_code == 401, f"Expected 401 Unauthorized for missing secret, got {resp_missing.status_code}"

    # Test invalid internal secret - expect 401 Unauthorized
    headers_invalid_secret = {
        "x-internal-secret": "invalid-secret"  # invalid secret
    }
    try:
        resp_invalid = requests.post(url, headers=headers_invalid_secret, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert resp_invalid.status_code == 401, f"Expected 401 Unauthorized for invalid secret, got {resp_invalid.status_code}"


test_post_api_internal_workers_deadlink_scan_with_internal_secret()
