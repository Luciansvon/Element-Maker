import httpx
import os

api_key = os.environ.get("OPENAI_API_KEY", "")
api_base = os.environ.get("OPENAI_API_BASE", "")
print("Key:", api_key[:10])
print("Base:", api_base)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
# CogView-3 di Zhipu AI
try:
    resp = httpx.post(f"{api_base.rstrip('/')}/images/generations", json={"model": "cogview-3", "prompt": "a green chair isolated on white background"}, headers=headers, timeout=15.0)
    print("Zhipu CogView status:", resp.status_code)
    print("Zhipu CogView text:", resp.text[:200])
except Exception as e:
    print("Zhipu error:", e)
