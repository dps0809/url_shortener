import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"


def test_patch_api_urls_id_disable():
    headers_auth = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # Create a new URL to get a valid id to disable after
    create_payload = {
        "long_url": f"https://example.com/test-disable-{uuid.uuid4()}"
    }

    url_id = None
    try:
        # Create URL (POST /api/urls)
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            headers=headers_auth,
            json=create_payload,
            timeout=30,
        )
        assert create_resp.status_code == 201, f"Failed to create url, status {create_resp.status_code}"
        created_data = create_resp.json()
        # As per PRD, response should have short_url and expires_at
        assert "short_url" in created_data
        assert "expires_at" in created_data
        # Get short_code from short_url
        short_url = created_data["short_url"]
        short_code = short_url.rstrip('/').rsplit('/', 1)[-1]

        # Fetch URL list to find the url id (GET /api/urls)
        list_resp = requests.get(
            f"{BASE_URL}/api/urls?page=1&limit=50",
            headers=headers_auth,
            timeout=30,
        )
        assert list_resp.status_code == 200
        urls = list_resp.json()
        matched_url = next((u for u in urls if u["short_code"] == short_code), None)
        assert matched_url is not None, "Created URL not found in list"
        url_id = matched_url["id"]

        # --- Test disabling the URL by ID with valid authorization ---
        disable_resp = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/disable",
            headers=headers_auth,
            timeout=30,
        )
        assert disable_resp.status_code == 200, f"Disable failed with status {disable_resp.status_code}"
        disable_resp_json = disable_resp.json()
        assert disable_resp_json.get("message") == "URL disabled"

        # Verify status is disabled by fetching status endpoint
        status_resp = requests.get(
            f"{BASE_URL}/api/urls/{url_id}/status",
            headers=headers_auth,
            timeout=30,
        )
        assert status_resp.status_code == 200
        status_json = status_resp.json()
        assert status_json["status"] == "disabled"

        # --- Test disabling a non-existent URL returns 404 ---
        fake_id = 99999999  # Numeric id unlikely to exist
        disable_fake_resp = requests.patch(
            f"{BASE_URL}/api/urls/{fake_id}/disable",
            headers=headers_auth,
            timeout=30,
        )
        assert disable_fake_resp.status_code == 404

        # --- Test unauthorized requests return 401 ---
        disable_unauth_resp = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/disable",
            timeout=30,
        )
        assert disable_unauth_resp.status_code == 401

    finally:
        if url_id:
            # Clean up by deleting the created URL
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/urls/{url_id}",
                    headers=headers_auth,
                    timeout=30,
                )
                # Accept 200 or 404 in case already deleted
                assert del_resp.status_code in (200, 404)
            except Exception:
                pass


test_patch_api_urls_id_disable()
