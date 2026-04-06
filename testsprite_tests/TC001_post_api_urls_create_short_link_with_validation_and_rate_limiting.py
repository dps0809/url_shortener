import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwic2Vzc2lvbklkIjoiNzMzYmY0YTUtNmQ0OC00OGY0LTg2NWUtNjY4NzNlODg5YmZhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzU0MTU5NjksImV4cCI6MTc3NjAyMDc2OX0.Rcsxoe18UGGeY1FI8hgnz2HWUoD5o72D_V86bMEuMeo"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_post_api_urls_create_short_link_with_validation_and_rate_limiting():
    # Prepare valid data with optional custom alias and expiry date
    expiry_date_iso = (datetime.utcnow() + timedelta(days=7)).replace(microsecond=0).isoformat() + "Z"
    valid_payload = {
        "long_url": "https://example.com/some/valid/path",
        "custom_alias": "customalias123",
        "expiry_date": expiry_date_iso
    }

    created_url_id = None
    try:
        # Test creating a new short URL with valid data and authorization
        response = requests.post(
            f"{BASE_URL}/api/urls",
            headers=HEADERS,
            json=valid_payload,
            timeout=30
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        json_resp = response.json()
        assert "short_url" in json_resp, "Response missing 'short_url'"
        assert "expires_at" in json_resp, "Response missing 'expires_at'"
        # expires_at may be null or string ISO; validate if present is string
        assert (json_resp["expires_at"] is None) or isinstance(json_resp["expires_at"], str), "'expires_at' should be string or null"
        # Extract urlId for cleanup and further tests - from returned short_url or response
        # Since schema in PRD says response is { short_url, expires_at }, we don't have urlId here
        # To delete or track, we need urlId from GET api/urls list or created resource
        # We'll get it from the paginated list filtered by custom alias:
        params = {"page":1,"limit":20}
        list_resp = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS, params=params, timeout=30)
        assert list_resp.status_code == 200, f"Failed to get URLs list after creation, status {list_resp.status_code}"
        urls = list_resp.json()
        matching = [u for u in urls if u.get("short_code") == valid_payload["custom_alias"]]
        assert len(matching) > 0, "Created short URL not found in list"
        created_url_id = matching[0].get("id")
        assert created_url_id is not None, "Created URL id not found"

        # Test creation with malicious URL rejected with 400 error
        malicious_payload = {
            "long_url": "http://malicious.example.com/phishing",
        }
        malicious_resp = requests.post(
            f"{BASE_URL}/api/urls",
            headers=HEADERS,
            json=malicious_payload,
            timeout=30
        )
        assert malicious_resp.status_code == 400, f"Expected 400 for malicious URL, got {malicious_resp.status_code}"

        # Test exceeding daily creation limit returns 429 rate limit error
        # We have to create URLs repeatedly until the limit is hit
        # We do this carefully to avoid infinite loops
        for _ in range(100):  # some large number to exceed limit (limit unknown)
            test_payload = {
                "long_url": "https://example.com/rate_limit_test_" + str(datetime.utcnow().timestamp())
            }
            rate_resp = requests.post(
                f"{BASE_URL}/api/urls",
                headers=HEADERS,
                json=test_payload,
                timeout=30
            )
            if rate_resp.status_code == 429:
                break
            else:
                # On 201 or other success, continue
                assert rate_resp.status_code == 201, f"Expected 201 or 429, got {rate_resp.status_code}"
        else:
            assert False, "Rate limit 429 error was not triggered after multiple attempts"

    finally:
        # Clean up created resource if exists
        if created_url_id is not None:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/urls/{created_url_id}",
                    headers=HEADERS,
                    timeout=30
                )
                # Allow 200 or 404 if already deleted, ignore errors in cleanup
            except Exception:
                pass

test_post_api_urls_create_short_link_with_validation_and_rate_limiting()
