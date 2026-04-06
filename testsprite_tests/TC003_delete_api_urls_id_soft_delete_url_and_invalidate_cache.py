import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwic2Vzc2lvbklkIjoiNzMzYmY0YTUtNmQ0OC00OGY0LTg2NWUtNjY4NzNlODg5YmZhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzU0MTU5NjksImV4cCI6MTc3NjAyMDc2OX0.Rcsxoe18UGGeY1FI8hgnz2HWUoD5o72D_V86bMEuMeo"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_delete_api_urls_id_soft_delete_url_and_invalidate_cache():
    # Prepare: Create a URL to delete
    create_payload = {
        "long_url": "https://example.com/test-delete-url"
    }

    created_url_id = None

    try:
        # Create new URL
        r_create = requests.post(
            f"{BASE_URL}/api/urls",
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT
        )
        assert r_create.status_code == 201, f"URL creation failed: {r_create.status_code}, {r_create.text}"
        data_create = r_create.json()
        # The response according to PRD for POST /api/urls 201 is { short_url: string, expires_at: string | null }
        # But to get the id, we need to get the list and find it or we assume response includes urlId or shortUrl contains short code.
        # The PRD does not clarify the ID field in create response, but the URL list returns id. We will get the id from list.

        # Get list and find newly created URL ID by matching short_url (should be unique)
        r_list = requests.get(
            f"{BASE_URL}/api/urls?page=1&limit=20",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert r_list.status_code == 200, f"Failed to get list of URLs: {r_list.status_code}, {r_list.text}"
        urls = r_list.json()
        created_url = next((item for item in urls if item.get('short_code') and data_create['short_url'].endswith(item['short_code'])), None)
        assert created_url is not None, "Created URL not found in list"
        created_url_id = created_url['id']

        # 1) Valid soft delete: DELETE /api/urls/:id with Authorization
        r_delete = requests.delete(
            f"{BASE_URL}/api/urls/{created_url_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert r_delete.status_code == 200, f"Delete failed: {r_delete.status_code}, {r_delete.text}"
        delete_resp = r_delete.json()
        # From PRD: expected 200 {message: 'URL deleted'}
        assert 'message' in delete_resp, "No message in delete response"
        assert 'URL deleted' in delete_resp['message'], f"Unexpected delete message: {delete_resp['message']}"

        # 2) Delete non-existent URL: DELETE /api/urls/:id where id does not exist
        fake_id = "00000000-0000-0000-0000-000000000000"
        r_delete_404 = requests.delete(
            f"{BASE_URL}/api/urls/{fake_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert r_delete_404.status_code == 404, f"Expected 404 for non-existent delete, got {r_delete_404.status_code}"

        # 3) Unauthorized delete request: no Authorization header
        r_delete_unauth = requests.delete(
            f"{BASE_URL}/api/urls/{created_url_id}",
            timeout=TIMEOUT
        )
        assert r_delete_unauth.status_code == 401, f"Expected 401 for unauthorized delete, got {r_delete_unauth.status_code}"

    finally:
        # Cleanup: If the resource was created but not deleted successfully, attempt to delete
        if created_url_id is not None:
            try:
                # Attempt a delete with auth to cleanup, ignore errors
                requests.delete(
                    f"{BASE_URL}/api/urls/{created_url_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_delete_api_urls_id_soft_delete_url_and_invalidate_cache()