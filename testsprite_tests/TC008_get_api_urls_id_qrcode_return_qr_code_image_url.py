import requests
import time

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_tc008_get_qrcode_image_url_return():
    url_create = f"{BASE_URL}/api/urls"
    create_payload = {
        "longUrl": "https://example.com/test-qrcode-image"
    }
    resource_id = None
    try:
        create_resp = requests.post(url_create, json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 on URL creation, got {create_resp.status_code}"
        json_create = create_resp.json()
        short_url = json_create.get('short_url')
        assert short_url, "short_url missing in create response"

        if short_url.startswith(BASE_URL):
            short_code = short_url[len(BASE_URL)+1:]
        else:
            short_code = short_url.rsplit('/', 1)[-1]

        url_list = f"{BASE_URL}/api/urls?page=1&limit=20"
        list_resp = requests.get(url_list, headers=HEADERS, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Expected 200 on URL list, got {list_resp.status_code}"
        list_json = list_resp.json()
        assert isinstance(list_json, list), "Expected list of URLs in response"

        resource_id = None
        for url_obj in list_json:
            if 'short_code' in url_obj and url_obj['short_code'] == short_code:
                resource_id = url_obj.get('id')
                break

        assert resource_id is not None, "Could not find created URL id from list response"

        url_qr = f"{BASE_URL}/api/urls/{resource_id}/qrcode"

        unauthorized_resp = requests.get(url_qr, timeout=TIMEOUT)
        assert unauthorized_resp.status_code == 401, f"Expected 401 Unauthorized without token, got {unauthorized_resp.status_code}"

        max_attempts = 6
        qr_code_url = None
        for _ in range(max_attempts):
            resp = requests.get(url_qr, headers=HEADERS, timeout=TIMEOUT)
            if resp.status_code == 200:
                resp_json = resp.json()
                qr_code_url = resp_json.get('qr_code')
                assert qr_code_url, "qr_code field missing in 200 response"
                assert isinstance(qr_code_url, str) and qr_code_url.startswith("http"), "qr_code is not a valid URL"
                break
            elif resp.status_code == 404:
                time.sleep(5)
            else:
                assert False, f"Unexpected status {resp.status_code} when fetching QR code"
        else:
            pass

    finally:
        if resource_id:
            url_del = f"{BASE_URL}/api/urls/{resource_id}"
            try:
                del_resp = requests.delete(url_del, headers=HEADERS, timeout=TIMEOUT)
                if del_resp.status_code not in (200, 404):
                    pass
            except Exception:
                pass

test_tc008_get_qrcode_image_url_return()
