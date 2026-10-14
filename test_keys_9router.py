import httpx
import os

openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")
print("Key found:", openrouter_key[:15] + "...")

# Tes 1: 9router dengan OpenRouter Key
headers = {
    "Authorization": f"Bearer {openrouter_key}"
}
try:
    resp = httpx.post("http://localhost:20128/v1/images/generations", json={"prompt": "apple on white background", "model": "dall-e-3"}, headers=headers, timeout=10.0)
    print("9Router with OpenRouter Key status:", resp.status_code)
    print("9Router text:", resp.text[:200])
except Exception as e:
    print("Error 9router:", e)

# Tes 2: OpenRouter langsung untuk model image
try:
    resp2 = httpx.post("https://openrouter.ai/api/v1/images/generations", json={"prompt": "apple on white background", "model": "google/imagen-3.0-generate-002"}, headers=headers, timeout=10.0)
    print("Direct OpenRouter status:", resp2.status_code)
    print("Direct OpenRouter text:", resp2.text[:200])
except Exception as e:
    print("Error OpenRouter direct:", e)
