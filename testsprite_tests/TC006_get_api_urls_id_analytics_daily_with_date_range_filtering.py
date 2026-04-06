import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_get_api_urls_id_analytics_daily_with_date_range_filtering():
    url_id = None
    created_url_id = None

    def create_url():
        payload = {
            "long_url": "https://example.com/some-path-for-analytics-test"
        }
        resp = requests.post(f"{BASE_URL}/api/urls", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("urlId") or resp.json().get("id") or resp.json().get("url_id") or resp.json().get("urlId") or resp.json().get("short_url")

    def delete_url(u_id):
        requests.delete(f"{BASE_URL}/api/urls/{u_id}", headers=HEADERS, timeout=TIMEOUT)

    try:
        # Create a URL resource for the analytics tests
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            json={"long_url": "https://example.com/analytics-test"},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201
        json_create = create_resp.json()
        # Attempt to extract URL ID from different possible keys
        created_url_id = json_create.get("urlId") or json_create.get("id") or json_create.get("url_id")
        if not created_url_id:
            # fallback: perhaps short_url is returned but not url id, fetch urls list to find
            list_resp = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, timeout=TIMEOUT)
            list_resp.raise_for_status()
            urls = list_resp.json()
            # Pick first url id if any
            if urls and isinstance(urls, list):
                created_url_id = urls[0].get("id")
        assert created_url_id is not None

        # 1. Test retrieval without date filtering returns 200 and valid array structure
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for entry in data:
            assert "date" in entry and isinstance(entry["date"], str)
            assert "clicks" in entry and isinstance(entry["clicks"], int)

        # 2. Test retrieval with valid startDate only
        params = {"startDate": "2026-01-01"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for entry in data:
            assert "date" in entry and isinstance(entry["date"], str)
            assert "clicks" in entry and isinstance(entry["clicks"], int)

        # 3. Test retrieval with valid endDate only
        params = {"endDate": "2026-12-31"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for entry in data:
            assert "date" in entry and isinstance(entry["date"], str)
            assert "clicks" in entry and isinstance(entry["clicks"], int)

        # 4. Test retrieval with valid startDate and endDate (startDate < endDate)
        params = {"startDate": "2026-03-01", "endDate": "2026-03-31"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for entry in data:
            assert "date" in entry and isinstance(entry["date"], str)
            assert "clicks" in entry and isinstance(entry["clicks"], int)

        # 5. Test retrieval with invalid date range (startDate > endDate)
        params = {"startDate": "2026-04-10", "endDate": "2026-04-01"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400

        # 6. Test retrieval with invalid date format for startDate
        params = {"startDate": "invalid-date"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400

        # 7. Test retrieval with invalid date format for endDate
        params = {"endDate": "31-03-2026"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400

        # 8. Test unauthorized access returns 401 (no token)
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            timeout=TIMEOUT,
        )
        assert resp.status_code == 401

        # 9. Test unauthorized access returns 401 (invalid token)
        bad_headers = {"Authorization": "Bearer invalidtoken"}
        resp = requests.get(
            f"{BASE_URL}/api/urls/{created_url_id}/analytics/daily",
            headers=bad_headers,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 401

    finally:
        if created_url_id:
            try:
                requests.delete(f"{BASE_URL}/api/urls/{created_url_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass


test_get_api_urls_id_analytics_daily_with_date_range_filtering()