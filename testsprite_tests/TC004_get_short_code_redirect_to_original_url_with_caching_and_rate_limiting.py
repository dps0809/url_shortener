import requests
import time

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS_AUTH = {"Authorization": f"Bearer {AUTH_TOKEN}"}
REQUEST_TIMEOUT = 30


def test_get_short_code_redirect_with_caching_and_rate_limiting():
    # Step 1: Create a new short URL resource (to get a valid shortCode)
    create_body = {
        "long_url": "https://example.com/test-get-short-code",
    }
    short_code = None
    url_id = None

    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            headers={**HEADERS_AUTH, "Content-Type": "application/json"},
            json=create_body,
            timeout=REQUEST_TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Create URL failed: {create_resp.text}"
        create_data = create_resp.json()
        assert "short_url" in create_data
        assert create_data["short_url"].startswith("http")
        # Extract shortCode from short_url (last path segment)
        short_code = create_data["short_url"].rstrip("/").split("/")[-1]

        # Fetch URL details to get urlId (id)
        list_resp = requests.get(
            f"{BASE_URL}/api/urls?page=1&limit=20",
            headers=HEADERS_AUTH,
            timeout=REQUEST_TIMEOUT,
        )
        assert list_resp.status_code == 200, f"Listing URLs failed: {list_resp.text}"
        urls = list_resp.json()
        matching_url = next((u for u in urls if u.get("short_code") == short_code), None)
        assert matching_url is not None, "Created short code not found in user's URLs"
        url_id = matching_url.get("id")
        assert url_id is not None

        # -----------------------------
        # Step 2: Test public GET redirect for the short code (cache miss)
        redirect_url = f"{BASE_URL}/{short_code}"
        session = requests.Session()

        first_resp = session.get(redirect_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert first_resp.status_code == 302, f"Expected 302 redirect but got {first_resp.status_code}"
        location_1 = first_resp.headers.get("Location")
        assert location_1 == create_body["long_url"], f"Redirect location mismatch on first request: {location_1}"

        # -----------------------------
        # Step 3: Test public GET redirect for the short code again (cache hit)
        second_resp = session.get(redirect_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert second_resp.status_code == 302, f"Expected 302 redirect on second request but got {second_resp.status_code}"
        location_2 = second_resp.headers.get("Location")
        assert location_2 == create_body["long_url"], f"Redirect location mismatch on second request: {location_2}"

        # -----------------------------
        # Step 4: Disable the URL to simulate expired/disabled link
        disable_resp = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/disable",
            headers=HEADERS_AUTH,
            timeout=REQUEST_TIMEOUT,
        )
        assert disable_resp.status_code == 200, f"Disabling URL failed: {disable_resp.text}"
        disable_json = disable_resp.json()
        assert disable_json.get("message") == "URL disabled"

        # Step 5: GET disabled link should return 410 or 404
        disabled_resp = session.get(redirect_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert disabled_resp.status_code in (410, 404), (
            f"Expected 410 or 404 for disabled link but got {disabled_resp.status_code}"
        )

        # -----------------------------
        # Step 6: Test expired link (simulate by extending a URL then patching expiry date in past)
        # Extend expiry to a past date to simulate expiration

        past_date = "2000-01-01T00:00:00.000Z"
        extend_resp = requests.patch(
            f"{BASE_URL}/api/urls/{url_id}/extend",
            headers={**HEADERS_AUTH, "Content-Type": "application/json"},
            json={"expiry_date": past_date},
            timeout=REQUEST_TIMEOUT,
        )
        assert extend_resp.status_code == 200, f"Extending expiry failed: {extend_resp.text}"
        extend_json = extend_resp.json()
        assert extend_json.get("message") == "URL expiration extended"

        # After expiry, GET request should return 410 (link expired)
        expired_resp = session.get(redirect_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
        assert expired_resp.status_code == 410, (
            f"Expected 410 for expired link but got {expired_resp.status_code}"
        )

        # -----------------------------
        # Step 7: Test 404 for non-existent short code
        non_existent_code = "nonexistentcode12345"
        nonexist_resp = session.get(f"{BASE_URL}/{non_existent_code}", allow_redirects=False, timeout=REQUEST_TIMEOUT)
        # According to PRD, could return 404 or 302 to /not-found, check for 404 or redirect with special location
        if nonexist_resp.status_code == 302:
            loc = nonexist_resp.headers.get("Location", "")
            assert loc.endswith("/not-found"), f"Unexpected redirect location for non-existent code: {loc}"
        else:
            assert nonexist_resp.status_code == 404, f"Expected 404 or redirect for non-existent code, got {nonexist_resp.status_code}"

        # -----------------------------
        # Step 8: Test rate limiting on redirects by sending many requests
        # We assume a threshold is low enough to test, send repeatedly until 429 or max count.

        rate_limit_exceeded = False
        max_requests = 100  # safety ceiling to avoid infinite loop
        for i in range(max_requests):
            rl_resp = session.get(redirect_url, allow_redirects=False, timeout=REQUEST_TIMEOUT)
            if rl_resp.status_code == 429:
                rate_limit_exceeded = True
                break
            else:
                # Accept 302 or others except error.
                assert rl_resp.status_code in (302, 410, 404), f"Unexpected status during rate limit test: {rl_resp.status_code}"

        assert rate_limit_exceeded, "Rate limiting did not trigger 429 after repeated requests."

    finally:
        # Cleanup - Delete the created URL if id available
        if url_id:
            requests.delete(
                f"{BASE_URL}/api/urls/{url_id}",
                headers=HEADERS_AUTH,
                timeout=REQUEST_TIMEOUT,
            )


test_get_short_code_redirect_with_caching_and_rate_limiting()