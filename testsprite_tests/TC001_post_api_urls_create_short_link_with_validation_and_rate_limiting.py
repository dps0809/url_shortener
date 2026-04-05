import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_post_api_urls_create_short_link_with_validation_and_rate_limiting():
    created_url_ids = []

    try:
        # 1) Create a valid short URL with optional customAlias and expiryDate
        expiry_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        payload_valid = {
            "long_url": "https://www.example.com/test-path",
            "custom_alias": "customalias123",
            "expiry_date": expiry_date
        }
        resp = requests.post(
            f"{BASE_URL}/api/urls",
            json=payload_valid,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"
        json_data = resp.json()
        # Validate response contains short_url and expires_at (expires_at may be null or ISO string)
        assert "short_url" in json_data, "Response missing 'short_url'"
        assert "expires_at" in json_data, "Response missing 'expires_at'"
        assert isinstance(json_data["short_url"], str) and json_data["short_url"], "'short_url' is not a valid string"
        assert (json_data["expires_at"] is None) or isinstance(json_data["expires_at"], str), "'expires_at' is not string or null"
        # Extract URL ID for cleanup - calling GET /api/urls to find by short_url (no direct id returned)
        # The PRD response schema mentions urlId returned but example shows short_url and expires_at only,
        # So attempt to retrieve ID via listing with filtering is not possible here.
        # As workaround, create a second URL without optional fields and delete it by short_code via GET /api/urls.
        # Or ignore explicit deletion (not specified for this test) - but instruction says delete resource after test done.
        # We assume short_url is the full URL like "http://localhost:3000/abc123"
        short_code = json_data["short_url"].rstrip("/").rsplit("/", 1)[-1]

        # Fetch all URLs to find ID matching short_code
        list_resp = requests.get(
            f"{BASE_URL}/api/urls?page=1&limit=100",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert list_resp.status_code == 200, f"Expected 200 for list URLs, got {list_resp.status_code}"
        urls_list = list_resp.json()
        matched_url = next((u for u in urls_list if u.get("short_code") == short_code), None)
        assert matched_url is not None, "Created short URL not found in user's URL list"
        url_id = matched_url.get("id")
        assert url_id is not None, "URL id not found"

        created_url_ids.append(url_id)

        # 2) Attempt creation with malicious URL - expect 400 Validation error
        malicious_payload = {
            "long_url": "http://malicious.example.com/badcontent"
        }
        resp_bad = requests.post(
            f"{BASE_URL}/api/urls",
            json=malicious_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_bad.status_code == 400, f"Expected 400 Bad Request for malicious URL, got {resp_bad.status_code}"

        # 3) Exceeding daily creation limit - simulate by repeatedly creating URLs until 429 hit
        # We'll limit attempts to 50 to avoid endless loop, assuming limit < 50
        max_attempts = 50
        hit_rate_limit = False
        for i in range(max_attempts):
            payload = {
                "long_url": f"https://example.com/rate-limit-test-{i}"
            }
            r = requests.post(
                f"{BASE_URL}/api/urls",
                json=payload,
                headers=HEADERS,
                timeout=TIMEOUT
            )
            if r.status_code == 201:
                # Successfully created; store id for cleanup
                resp_json = r.json()
                short_url_full = resp_json.get("short_url", "")
                sc = short_url_full.rstrip("/").rsplit("/", 1)[-1]
                # Fetch URL id via list again
                lr = requests.get(
                    f"{BASE_URL}/api/urls?page=1&limit=100",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                if lr.status_code == 200:
                    urls = lr.json()
                    matched = next((u for u in urls if u.get("short_code") == sc), None)
                    if matched and matched.get("id") not in created_url_ids:
                        created_url_ids.append(matched.get("id"))
            elif r.status_code == 429:
                hit_rate_limit = True
                break
            else:
                # Unexpected status code, stop testing for rate limit
                break
        
        assert hit_rate_limit, "Rate limit (429) not reached after multiple creation attempts"

    finally:
        # Cleanup: Delete all created URLs
        for uid in created_url_ids:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/urls/{uid}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                # Accept 200 OK or 404 if already deleted
                assert del_resp.status_code in (200, 404)
            except Exception:
                pass


test_post_api_urls_create_short_link_with_validation_and_rate_limiting()