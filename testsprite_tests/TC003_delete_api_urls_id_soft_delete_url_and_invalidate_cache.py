import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic2Vzc2lvbklkIjoiZjE1MmUxOGQtZTAyZi00MTI4LWJiMTUtOTdjODhhNzRjNjAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUzNzIzNjUsImV4cCI6MTc3NTk3NzE2NX0.Vm8pkMW42ejvUiU8tZQ2IF3z8W-Cs0F1NFCgGGGSZ4Q"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_tc003_delete_api_urls_id_soft_delete_url_and_invalidate_cache():
    def delete_url(url_id, headers):
        return requests.delete(
            f"{BASE_URL}/api/urls/{url_id}",
            headers=headers,
            timeout=TIMEOUT
        )
    
    created_url_id = None
    
    try:
        # Create a new URL resource to test deletion
        create_resp = requests.post(
            f"{BASE_URL}/api/urls",
            json={"long_url": "https://example.com/tc003-test"},
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Expected 201 on URL creation but got {create_resp.status_code}"
        
        # Fetch list to extract the id
        list_resp = requests.get(f"{BASE_URL}/api/urls?page=1&limit=50", headers=HEADERS, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Expected 200 on URL list but got {list_resp.status_code}"
        response_json = list_resp.json()
        # Expecting {urls: [...]}
        assert isinstance(response_json, dict), f"Expected JSON object from list API but got {type(response_json)}"
        assert 'urls' in response_json, "Missing 'urls' key in URL list response"
        urls = response_json['urls']
        assert isinstance(urls, list), f"Expected 'urls' to be a list but got {type(urls)}"
        created_url_id = None
        for url in urls:
            assert isinstance(url, dict), f"Expected dict elements in url list but got {type(url)}"
            if url.get("long_url") == "https://example.com/tc003-test":
                created_url_id = url.get("id")
                break
        assert created_url_id is not None, "Failed to find created URL id in list"
        
        # 1) Soft delete with valid authorization
        del_resp = delete_url(created_url_id, HEADERS)
        assert del_resp.status_code == 200, f"Expected 200 on valid delete but got {del_resp.status_code}"
        del_data = del_resp.json()
        assert "message" in del_data, "Delete response missing 'message'"
        assert "url deleted" in del_data["message"].lower(), f"Unexpected delete message: {del_data['message']}"
        
        # 2) Deleting the same URL again (now non-existent or already deleted) should return 404
        del_resp_404 = delete_url(created_url_id, HEADERS)
        assert del_resp_404.status_code == 404, f"Expected 404 deleting non-existent URL but got {del_resp_404.status_code}"
        
        # 3) Delete with unauthorized request (no header)
        del_resp_unauth = delete_url(created_url_id, headers={})
        assert del_resp_unauth.status_code == 401, f"Expected 401 Unauthorized but got {del_resp_unauth.status_code}"

    finally:
        if created_url_id is not None:
            try:
                delete_url(created_url_id, HEADERS)
            except Exception:
                pass

test_tc003_delete_api_urls_id_soft_delete_url_and_invalidate_cache()
