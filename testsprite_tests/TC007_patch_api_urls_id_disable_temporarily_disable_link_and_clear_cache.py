import requests

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"}
TIMEOUT = 30

def test_patch_api_urls_id_disable():
    # Helper to create a URL resource for testing
    created_url = None
    try:
        # Create a new URL
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            headers=HEADERS,
            json={"long_url": "https://example.com/test-disable"},
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Setup failed to create URL: {create_resp.text}"
        created_url = create_resp.json()
        url_id = created_url.get("urlId") or created_url.get("id")
        # Some responses might use different keys, fallback to 'id' if needed
        if not url_id:
            # Try to get urlId inside nested structures or keys
            url_id = created_url.get("id")
        assert url_id, "URL ID not found in creation response"

        # 1. PATCH disable with valid authorization - expect 200 {message: 'URL disabled'}
        patch_resp = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/disable",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert patch_resp.status_code == 200, f"Patch disable failed: {patch_resp.text}"
        json_data = patch_resp.json()
        assert "message" in json_data and json_data["message"].lower() == "url disabled"

        # 1a. Verify URL status is 'disabled' by GET /api/urls/:id/status
        status_resp = requests.get(
            f"{BASE_URL}/api/urls/{url_id}/status",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert status_resp.status_code == 200, f"Status check failed: {status_resp.text}"
        status_json = status_resp.json()
        assert "status" in status_json and status_json["status"].lower() == "disabled"

        # 2. PATCH disable for non-existent URL - expect 404
        fake_id = "00000000-0000-0000-0000-000000000000"
        disable_fake_resp = requests.patch(
            f"{BASE_URL}/api/urls/{fake_id}/disable",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert disable_fake_resp.status_code == 404, f"Expected 404 for non-existent disable, got {disable_fake_resp.status_code}"

        # 3. PATCH disable without Authorization header - expect 401
        disable_no_auth = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/disable",
            timeout=TIMEOUT,
        )
        assert disable_no_auth.status_code == 401, f"Expected 401 Unauthorized, got {disable_no_auth.status_code}"

    finally:
        # Cleanup: delete the created URL
        if created_url and url_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/urls/{url_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass  # best effort cleanup


test_patch_api_urls_id_disable()