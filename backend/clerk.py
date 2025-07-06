# utils/clerk.py
import httpx, os

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "sk_test_EO9oM8pFqYvn0OiCOyWI3Ktptep6IXsnUnIv6Myetp")
CLERK_API_BASE = os.getenv("CLERK_API_BASE", "https://api.clerk.dev/v1")

async def get_org_name_from_clerk(org_id: str):
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}"
    }
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{CLERK_API_BASE}/organizations/{org_id}", headers=headers)
        res.raise_for_status()
        data = res.json()
        return data["name"]
