import requests


BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}
TIMEOUT = 30


def test_get_api_urls_list_paginated_for_authenticated_user():
    """
    Test retrieving paginated list of URLs for an authenticated user.
    Verify response contains array of URLs with id, short_code, long_url, and click_count.
    Test with and without pagination parameters.
    """
    # First test without pagination parameters (default)
    url = f"{BASE_URL}/api/urls"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code} on default pagination"
        data = response.json()
        assert isinstance(data, list), "Response data should be a list"
        for item in data:
            assert isinstance(item.get("id"), (int, str)), "Each item should have an 'id' field (int or str)"
            assert isinstance(item.get("short_code"), str), "Each item should have a 'short_code' field of type str"
            assert isinstance(item.get("long_url"), str), "Each item should have a 'long_url' field of type str"
            assert isinstance(item.get("click_count"), int), "Each item should have a 'click_count' field of type int"

        # Test with pagination parameters
        params = {"page": 1, "limit": 2}
        response_paginated = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert response_paginated.status_code == 200, f"Expected 200 but got {response_paginated.status_code} with pagination params"
        data_paginated = response_paginated.json()
        assert isinstance(data_paginated, list), "Paginated response data should be a list"
        assert len(data_paginated) <= 2, "Paginated response data length should be less or equal to limit param"

        for item in data_paginated:
            assert isinstance(item.get("id"), (int, str)), "Each paginated item should have an 'id' field (int or str)"
            assert isinstance(item.get("short_code"), str), "Each paginated item should have a 'short_code' field of type str"
            assert isinstance(item.get("long_url"), str), "Each paginated item should have a 'long_url' field of type str"
            assert isinstance(item.get("click_count"), int), "Each paginated item should have a 'click_count' field of type int"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_get_api_urls_list_paginated_for_authenticated_user()