import requests
import time

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwic2Vzc2lvbklkIjoiNzMzYmY0YTUtNmQ0OC00OGY0LTg2NWUtNjY4NzNlODg5YmZhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzU0MTU5NjksImV4cCI6MTc3NjAyMDc2OX0.Rcsxoe18UGGeY1FI8hgnz2HWUoD5o72D_V86bMEuMeo"
HEADERS_AUTH = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_get_api_urls_id_qrcode_return_qr_code_image_url():
    url_create = f"{BASE_URL}/api/urls"
    url_qrcode_path = "/api/urls/{id}/qrcode"

    # Create a new short URL to get its ID
    payload = {"long_url": "https://example.com/test-qrcode"}
    response_create = requests.post(url_create, json=payload, headers=HEADERS_AUTH, timeout=TIMEOUT)
    assert response_create.status_code == 201, f"Failed to create URL, got {response_create.status_code}"
    data_create = response_create.json()
    # response schema from PRD says 201 returns {short_url, expires_at} - we need the id, so retrieve list or get detail
    # We must get the urlId or id; the schema in PRD for creation didn't expose id, so retrieve list and find by short_url

    # Retrieve list to find our created URL's id
    response_list = requests.get(f"{BASE_URL}/api/urls", headers=HEADERS_AUTH, timeout=TIMEOUT)
    assert response_list.status_code == 200, f"Failed to list URLs, got {response_list.status_code}"
    urls = response_list.json()
    created_url = None
    for u in urls:
        if u.get("short_url") == data_create.get("short_url") or u.get("short_code") == data_create.get("short_url").split('/')[-1]:
            created_url = u
            break
    if not created_url:
        # fallback: try to find via long_url match
        for u in urls:
            if u.get("long_url") == payload["long_url"]:
                created_url = u
                break
    assert created_url is not None, "Created URL not found in list"
    url_id = created_url.get("id")
    assert url_id is not None, "URL id not found"

    try:
        # 1) Test unauthorized access returns 401
        url_qrcode = f"{BASE_URL}/api/urls/{url_id}/qrcode"
        response_unauth = requests.get(url_qrcode, timeout=TIMEOUT)  # no auth header
        assert response_unauth.status_code == 401, f"Expected 401 Unauthorized for no auth, got {response_unauth.status_code}"

        # 2) Test 404 response if QR code still generating (immediately after creation very likely)
        response_qr_404 = requests.get(url_qrcode, headers=HEADERS_AUTH, timeout=TIMEOUT)
        # According to PRD, 404 qr code not found means still generating
        if response_qr_404.status_code == 404:
            # valid scenario
            pass
        elif response_qr_404.status_code == 200:
            # QR code ready immediately
            data_qr = response_qr_404.json()
            qr_code_url = data_qr.get("qr_code")
            assert qr_code_url and qr_code_url.startswith("https://"), "qr_code URL missing or invalid"
            return  # QR code ready immediately, test done
        else:
            assert False, f"Unexpected status code for QR code retrieval immediately after creation: {response_qr_404.status_code}"

        # 3) Wait and retry to get 200 with qr_code URL (background worker generates QR asynchronously)
        max_attempts = 10
        for attempt in range(max_attempts):
            time.sleep(3)
            response_qr = requests.get(url_qrcode, headers=HEADERS_AUTH, timeout=TIMEOUT)
            if response_qr.status_code == 200:
                data_qr = response_qr.json()
                qr_code_url = data_qr.get("qr_code")
                assert qr_code_url and qr_code_url.startswith("https://"), f"qr_code URL missing or invalid: {qr_code_url}"
                break
            elif response_qr.status_code == 404:
                continue
            else:
                assert False, f"Unexpected status code during QR code polling: {response_qr.status_code}"
        else:
            assert False, "QR code did not become available after waiting"
    finally:
        # Clean up - delete created URL
        del_response = requests.delete(f"{BASE_URL}/api/urls/{url_id}", headers=HEADERS_AUTH, timeout=TIMEOUT)
        assert del_response.status_code == 200 or del_response.status_code == 404, f"Failed to delete URL for cleanup, got {del_response.status_code}"

test_get_api_urls_id_qrcode_return_qr_code_image_url()