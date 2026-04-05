import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS_AUTH = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_tc005_get_url_analytics_total_clicks_with_authorization():
    url_id = None
    # Create a new URL to test analytics on
    try:
        create_payload = {
            "long_url": "https://example.com/test_tc005"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            json=create_payload,
            headers=HEADERS_AUTH,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"URL creation failed: {create_resp.text}"
        created_url = create_resp.json()
        assert "short_url" in created_url, "Response missing short_url"

        # Get url_id from the list endpoint
        list_resp = requests.get(
            f"{BASE_URL}/api/urls",
            headers=HEADERS_AUTH,
            timeout=TIMEOUT,
            params={"page": 1, "limit": 20},
        )
        assert list_resp.status_code == 200, "Fetching URL list failed"
        urls = list_resp.json()
        for u in urls:
            if u.get("long_url") == create_payload["long_url"]:
                url_id = u.get("id")
                break
        assert url_id is not None, "Could not find created URL ID"

        # Test authorized access: GET /api/urls/:id/analytics
        analytics_url = f"{BASE_URL}/api/urls/{url_id}/analytics"
        analytics_resp = requests.get(
            analytics_url, headers=HEADERS_AUTH, timeout=TIMEOUT
        )
        assert analytics_resp.status_code == 200, f"Authorized analytics GET failed: {analytics_resp.text}"
        data = analytics_resp.json()
        assert isinstance(data, dict), "Analytics response not a JSON object"
        assert "total_clicks" in data, "Response missing total_clicks"
        assert isinstance(
            data["total_clicks"], int
        ), "total_clicks should be an integer"

        # Test unauthorized access returns 401
        unauth_resp = requests.get(analytics_url, timeout=TIMEOUT)
        assert unauth_resp.status_code == 401, f"Unauthorized request did not return 401, got {unauth_resp.status_code}"

    finally:
        if url_id:
            # Cleanup: delete the created URL
            del_resp = requests.delete(
                f"{BASE_URL}/api/urls/{url_id}",
                headers=HEADERS_AUTH,
                timeout=TIMEOUT,
            )
            assert del_resp.status_code == 200, f"Failed to delete test URL: {del_resp.text}"

test_tc005_get_url_analytics_total_clicks_with_authorization()