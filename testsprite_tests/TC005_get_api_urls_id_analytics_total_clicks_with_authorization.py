import requests

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def test_get_api_urls_id_analytics_total_clicks_with_authorization():
    url_create = f"{BASE_URL}/api/urls"
    url_analytics_template = f"{BASE_URL}/api/urls/{{url_id}}/analytics"
    timeout = 30

    # Step 1: Create a new URL to get a valid URL ID
    payload_create = {
        "long_url": "https://example.com/test-get-total-clicks"
    }
    created_url_id = None

    try:
        resp_create = requests.post(url_create, json=payload_create, headers=HEADERS, timeout=timeout)
        assert resp_create.status_code == 201, f"Expected 201 on URL creation, got {resp_create.status_code}"
        resp_create_json = resp_create.json()
        assert "short_url" in resp_create_json, "Response missing 'short_url'"
        # Extract id from a subsequent GET call to get the url_id, or from response if available
        # Since response schema in PRD shows short_url and expires_at only,
        # We need to list URLs to find the id or fetch url by short_code
        # We'll call GET /api/urls to find the created URL's id by matching long_url

        # List URLs to find the created url id
        params_list = {"page": 1, "limit": 20}
        resp_list = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, params=params_list, timeout=timeout)
        assert resp_list.status_code == 200, f"Expected 200 on listing URLs, got {resp_list.status_code}"
        urls = resp_list.json()
        # The list contains array with id, short_code, long_url, click_count
        created_url_id = None
        for url_entry in urls:
            if url_entry.get("long_url") == payload_create["long_url"]:
                created_url_id = url_entry.get("id")
                break
        assert created_url_id is not None, "Created URL ID not found in user's URL list"

        # Step 2: Request analytics total clicks with valid authorization
        analytics_url = url_analytics_template.format(url_id=created_url_id)
        resp_analytics = requests.get(analytics_url, headers=HEADERS, timeout=timeout)
        assert resp_analytics.status_code == 200, f"Expected 200 on analytics request, got {resp_analytics.status_code}"
        analytics_json = resp_analytics.json()
        assert "total_clicks" in analytics_json, "Response missing 'total_clicks'"
        assert isinstance(analytics_json["total_clicks"], int), "'total_clicks' should be an integer"

        # Step 3: Test unauthorized access returns 401
        resp_unauth = requests.get(analytics_url, timeout=timeout)
        assert resp_unauth.status_code == 401, f"Expected 401 on unauthorized request, got {resp_unauth.status_code}"

    finally:
        # Cleanup: Delete the created URL to clean database
        if created_url_id is not None:
            requests.delete(f"{BASE_URL}/api/urls/{created_url_id}", headers=HEADERS, timeout=timeout)


test_get_api_urls_id_analytics_total_clicks_with_authorization()