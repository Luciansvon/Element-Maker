import httpx

try:
    r = httpx.post("http://127.0.0.1:8008/api/generate", json={
        "prompt": "sofa hijau elegan",
        "mode": "no_bg",
        "model": "dall-e-3",
        "base_url": "http://localhost:20128/v1",
        "api_key": ""
    }, timeout=10.0)
    print("Status /api/generate:", r.status_code)
    print("Response:", r.text[:200])
except Exception as e:
    print("Error:", e)
