import os
from supabase import create_client, Client
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if not _client:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


async def save_design(user_id: str, data: dict) -> dict:
    db = get_client()
    result = db.table("designs").insert({
        "user_id": user_id,
        "title": data.get("headline", "My Design"),
        "style": data["style"],
        "room_type": data["room_type"],
        "budget": data["budget"],
        "room_size": data.get("room_size"),
        "notes": data.get("notes"),
        "original_image_url": data.get("original_image_url"),
        "generated_image_url": data.get("generated_image_url"),
        "design_data": data["design_data"],
    }).execute()
    return result.data[0] if result.data else {}


async def get_user_designs(user_id: str) -> list:
    db = get_client()
    result = db.table("designs") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return result.data or []


async def get_design_by_share_token(token: str) -> Optional[dict]:
    db = get_client()
    result = db.table("designs") \
        .select("*") \
        .eq("share_token", token) \
        .eq("is_public", True) \
        .execute()
    return result.data[0] if result.data else None


async def get_user_profile(user_id: str) -> Optional[dict]:
    db = get_client()
    result = db.table("profiles").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


async def increment_usage(user_id: str) -> bool:
    """Increment design usage count. Returns True if within limit."""
    db = get_client()
    profile = await get_user_profile(user_id)
    if not profile:
        return False

    plan_limits = {"free": 3, "pro": 25, "business": 999999}
    limit = plan_limits.get(profile.get("plan", "free"), 3)

    used = profile.get("designs_used_this_month", 0)
    if used >= limit:
        return False

    db.table("profiles").update({
        "designs_used_this_month": used + 1
    }).eq("id", user_id).execute()
    return True


async def upload_image(bucket: str, path: str, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    db = get_client()
    db.storage.from_(bucket).upload(path, file_bytes, {"content-type": content_type})
    url = db.storage.from_(bucket).get_public_url(path)
    return url
