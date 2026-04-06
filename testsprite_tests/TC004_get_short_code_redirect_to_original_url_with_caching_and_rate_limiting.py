import requests
import time

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwic2Vzc2lvbklkIjoiNzMzYmY0YTUtNmQ0OC00OGY0LTg2NWUtNjY4NzNlODg5YmZhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzU0MTU5NjksImV4cCI6MTc3NjAyMDc2OX0.Rcsxoe18UGGeY1FI8hgnz2HWUoD5o72D_V86bMEuMeo"
HEADERS_AUTH = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}
REQUEST_TIMEOUT = 30

def test_get_short_code_redirect_with_caching_and_rate_limiting():
    url_create = f"{BASE_URL}/api/urls"
    long_url = "https://example.com/long-test-url-for-redirect"
    disabled_url = "https://example.com/disabled-url"
    # 1. Create a normal URL for testing redirect & caching
    payload_normal = {
        "long_url": long_url
    }
    # 3. Create a URL to disable later
    payload_disable = {
        "long_url": disabled_url
    }
    short_codes = {}

    try:
        # Create normal URL
        resp = requests.post(url_create, headers=HEADERS_AUTH, json=payload_normal, timeout=REQUEST_TIMEOUT)
        assert resp.status_code == 201, f"Failed to create normal URL: {resp.text}"
        normal_url_data = resp.json()
        normal_short_url = normal_url_data.get("short_url")
        assert normal_short_url and normal_short_url.startswith("http"), "Invalid short_url in create response"
        # Extract short code from short_url
        normal_short_code = normal_short_url.rstrip("/").split("/")[-1]
        short_codes["normal"] = normal_short_code

        # Create URL to disable
        resp = requests.post(url_create, headers=HEADERS_AUTH, json=payload_disable, timeout=REQUEST_TIMEOUT)
        assert resp.status_code == 201, f"Failed to create URL for disable: {resp.text}"
        disable_data = resp.json()
        disable_short_url = disable_data.get("short_url")
        assert disable_short_url and disable_short_url.startswith("http"), "Invalid short_url in disable create response"
        disable_short_code = disable_short_url.rstrip("/").split("/")[-1]
        short_codes["disable"] = disable_short_code

        # 4. Test redirect for normal short code (first request, cache miss)
        redirect_url_1 = f"{BASE_URL}/{normal_short_code}"
        resp = requests.get(redirect_url_1, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert resp.status_code == 302, f"Expected 302 redirect, got {resp.status_code} first request"
        location_1 = resp.headers.get("Location")
        assert location_1 == long_url, f"Redirect location mismatch on first request: expected {long_url}, got {location_1}"

        # 5. Test redirect for normal short code (second request, should hit cache)
        resp = requests.get(redirect_url_1, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert resp.status_code == 302, f"Expected 302 redirect, got {resp.status_code} second request"
        location_2 = resp.headers.get("Location")
        assert location_2 == long_url, f"Redirect location mismatch on second request: expected {long_url}, got {location_2}"

        # 7. Test disabled short code returns 410 or 404 as appropriate
        # Disable the URL first
        patch_disable_url = f"{BASE_URL}/api/urls/{disable_short_code}/disable"
        resp = requests.patch(patch_disable_url, headers=HEADERS_AUTH, timeout=REQUEST_TIMEOUT)
        assert resp.status_code in (200, 404), f"Unexpected status code on disable URL: {resp.status_code}, body: {resp.text}"
        if resp.status_code == 404:
            # If already deleted or not found, skip further checks
            return

        # After disabling, requesting the short code should return 410 or 404 or redirect to /link-expired
        redirect_disabled_url = f"{BASE_URL}/{disable_short_code}"
        resp = requests.get(redirect_disabled_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert resp.status_code in (410, 404, 302), f"Expected 410, 404, or redirect after disable, got {resp.status_code}"
        if resp.status_code == 302:
            loc = resp.headers.get("Location", "")
            assert loc in ("/link-expired", "/not-found"), f"Unexpected redirect location after disable: {loc}"

        # 8. Test non-existent short code returns 404 or redirect to /not-found
        unknown_code = "nonexistentcodexyz"
        redirect_unknown_url = f"{BASE_URL}/{unknown_code}"
        resp = requests.get(redirect_unknown_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert resp.status_code in (404, 302), f"Expected 404 or 302 for unknown short code, got {resp.status_code}"
        if resp.status_code == 302:
            loc = resp.headers.get("Location")
            assert loc == "/not-found" or loc == "/link-not-found", f"Unexpected redirect location for unknown code: {loc}"

        # 9. Test rate limiting triggers 429 after threshold exceeded
        rate_limit_code = short_codes["normal"]
        rate_limit_url = f"{BASE_URL}/{rate_limit_code}"
        got_429 = False
        max_requests = 50  # reasonable number to try exceed rate limit
        for _ in range(max_requests):
            resp = requests.get(rate_limit_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 429:
                got_429 = True
                break
            assert resp.status_code == 302, f"Expected 302 or 429 during rate limit test, got {resp.status_code}"
        assert got_429, "Rate limiting threshold not reached, expected 429 status"

    finally:
        # No cleanup because URL ids are not provided in create response
        pass

test_get_short_code_redirect_with_caching_and_rate_limiting()
