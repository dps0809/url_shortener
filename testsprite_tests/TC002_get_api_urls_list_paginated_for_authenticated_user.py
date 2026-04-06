import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwic2Vzc2lvbklkIjoiNzMzYmY0YTUtNmQ0OC00OGY0LTg2NWUtNjY4NzNlODg5YmZhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzU0MTU5NjksImV4cCI6MTc3NjAyMDc2OX0.Rcsxoe18UGGeY1FI8hgnz2HWUoD5o72D_V86bMEuMeo"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_get_api_urls_list_paginated_authenticated_user():
    """
    Test retrieving paginated list of URLs for an authenticated user.
    Verify response contains array of URLs with id, short_code, long_url, and click_count.
    Test with and without pagination parameters.
    """

    # First create at least two URLs to have data for pagination tests
    urls_to_create = [
        {"long_url": "https://example.com/page1"},
        {"long_url": "https://example.com/page2"},
        {"long_url": "https://example.com/page3"},
    ]

    created_url_ids = []

    try:
        for data in urls_to_create:
            resp_create = requests.post(
                f"{BASE_URL}/api/urls",
                headers=HEADERS,
                json=data,
                timeout=TIMEOUT
            )
            assert resp_create.status_code == 201, f"Failed to create URL: {resp_create.text}"
            resp_json = resp_create.json()
            # The PRD states create returns short_url and expires_at, but the test validations require link id.
            # Since later we need ids to delete, fetch the created URL id by getting all URLs for user then match by short_url
            # But to avoid double calls, assume we can get id from list API after creation
            # We will fetch all then filter by short_url to get id for deletion
            created_url_ids.append(resp_json.get("short_url"))

        # Fetch all URLs (default pagination page=1,limit=10)
        resp_list = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, timeout=TIMEOUT)
        assert resp_list.status_code == 200, f"List URLs failed: {resp_list.text}"
        urls = resp_list.json()
        assert isinstance(urls, list), "Response is not a list"
        for url_obj in urls:
            assert isinstance(url_obj, dict), "URL item is not a dict"
            for key in ["id", "short_code", "long_url", "click_count"]:
                assert key in url_obj, f"Key {key} missing in URL item"
            assert isinstance(url_obj["id"], (str, int)), "id is not string or int"
            assert isinstance(url_obj["short_code"], str), "short_code not string"
            assert isinstance(url_obj["long_url"], str), "long_url not string"
            assert isinstance(url_obj["click_count"], int), "click_count not int"

        # Test with pagination parameters page=1, limit=2
        params = {"page": 1, "limit": 2}
        resp_paginated = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp_paginated.status_code == 200, f"Paginated GET failed: {resp_paginated.text}"
        urls_paginated = resp_paginated.json()
        assert isinstance(urls_paginated, list), "Paginated response not list"
        # The returned list size should be <= limit
        assert len(urls_paginated) <= 2, "Paginated result size exceeds limit"
        for url_obj in urls_paginated:
            for key in ["id", "short_code", "long_url", "click_count"]:
                assert key in url_obj, f"Key {key} missing in paginated URL item"

    finally:
        # Cleanup: Delete the URLs created by this test if possible
        # Because created_url_ids actually saved short_url not id, retrieve ids from listing by short_code then delete
        try:
            resp_all = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, timeout=TIMEOUT)
            if resp_all.status_code == 200:
                all_urls = resp_all.json()
                for short_url in created_url_ids:
                    # Extract short_code from short_url (format unknown, assume last path segment)
                    # If short_url is like http://service/<short_code>, get short_code part
                    # Using URL parsing:
                    from urllib.parse import urlparse
                    parsed = urlparse(short_url)
                    short_code = parsed.path.lstrip("/")
                    # Find matching url object
                    match = next((u for u in all_urls if u.get("short_code") == short_code), None)
                    if match and "id" in match:
                        del_resp = requests.delete(f"{BASE_URL}/api/urls/{match['id']}", headers=HEADERS, timeout=TIMEOUT)
                        # Accept 200 or 404 (in case already deleted)
                        if del_resp.status_code not in (200, 404):
                            print(f"Warning: Failed to delete URL id={match['id']}: {del_resp.status_code} {del_resp.text}")
        except Exception:
            pass


test_get_api_urls_list_paginated_authenticated_user()