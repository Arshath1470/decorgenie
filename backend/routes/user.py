from fastapi import APIRouter, HTTPException, Header
from services import supabase_db
import os

router = APIRouter()


def get_user_from_token(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")
    token = authorization.split(" ")[1]
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/profile")
async def get_profile(authorization: str = Header(...)):
    user_id = get_user_from_token(authorization)
    profile = await supabase_db.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "profile": profile}


@router.get("/designs")
async def get_my_designs(authorization: str = Header(...)):
    user_id = get_user_from_token(authorization)
    designs = await supabase_db.get_user_designs(user_id)
    return {"success": True, "designs": designs, "count": len(designs)}
