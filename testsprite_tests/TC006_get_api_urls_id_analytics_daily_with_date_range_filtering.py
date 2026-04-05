import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_get_api_urls_id_analytics_daily_with_date_range_filtering():
    # Step 1: Create a new URL resource to test analytics on
    create_url = f"{BASE_URL}/api/urls"
    create_payload = {
        "long_url": "https://example.com/test-get-api-urls-id-analytics-daily"
    }
    url_id = None
    try:
        create_resp = requests.post(create_url, headers=HEADERS, json=create_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"URL creation failed with status {create_resp.status_code} and body {create_resp.text}"

        # As per PRD, create response doesn't include url ID, so list URLs to find it
        list_url = f"{BASE_URL}/api/urls?page=1&limit=10"
        list_resp = requests.get(list_url, headers=HEADERS, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Failed to get URLs list: {list_resp.text}"
        urls_list = list_resp.json()
        for item in urls_list:
            if 'long_url' in item and item['long_url'] == create_payload["long_url"]:
                url_id = item.get('id') or item.get('urlId') or item.get('url_id')
                break
        assert url_id is not None, "Failed to retrieve URL ID after creation"

        analytics_base = f"{BASE_URL}/api/urls/{url_id}/analytics/daily"

        # Happy path: GET without query params (optional)
        resp = requests.get(analytics_base, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code} with body {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response is not a list"
        for entry in data:
            assert 'date' in entry and 'clicks' in entry, f"Entry missing 'date' or 'clicks': {entry}"
            # Validate date format ISO
            try:
                datetime.strptime(entry['date'], "%Y-%m-%d")
            except Exception:
                assert False, f"Date format invalid: {entry['date']}"
            assert isinstance(entry['clicks'], int), f"Clicks not int: {entry['clicks']}"

        # Happy path: GET with valid startDate and endDate
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = (datetime.utcnow()).strftime("%Y-%m-%d")
        params = {"startDate": start_date, "endDate": end_date}
        resp = requests.get(analytics_base, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 with valid date range, got {resp.status_code} body {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response is not a list with date range"
        for entry in data:
            assert 'date' in entry and 'clicks' in entry
            # Date must be in range and valid format
            try:
                dt = datetime.strptime(entry['date'], "%Y-%m-%d")
                sdt = datetime.strptime(start_date, "%Y-%m-%d")
                edt = datetime.strptime(end_date, "%Y-%m-%d")
                assert sdt <= dt <= edt, f"Date {entry['date']} out of range"
            except Exception:
                assert False, f"Date format invalid: {entry['date']}"
            assert isinstance(entry['clicks'], int)

        # Error case: invalid date range startDate > endDate
        params = {"startDate": "2026-04-10", "endDate": "2026-04-01"}
        resp = requests.get(analytics_base, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for startDate > endDate, got {resp.status_code}"

        # Error case: invalid date format for startDate
        params = {"startDate": "invalid-date", "endDate": "2026-04-30"}
        resp = requests.get(analytics_base, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for invalid startDate format, got {resp.status_code}"

        # Error case: invalid date format for endDate
        params = {"startDate": "2026-03-01", "endDate": "not-a-date"}
        resp = requests.get(analytics_base, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for invalid endDate format, got {resp.status_code}"

        # Unauthorized case: omit Authorization header
        resp = requests.get(analytics_base, timeout=TIMEOUT)
        assert resp.status_code == 401, f"Expected 401 Unauthorized without token, got {resp.status_code}"

    finally:
        # Cleanup: delete the created URL if possible
        if url_id:
            delete_url = f"{BASE_URL}/api/urls/{url_id}"
            try:
                del_resp = requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)
                assert del_resp.status_code == 200, f"Cleanup delete failed with {del_resp.status_code}"
            except Exception:
                pass


test_get_api_urls_id_analytics_daily_with_date_range_filtering()
