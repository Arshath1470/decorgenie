from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from typing import Optional
import base64
import uuid

from models.schemas import DesignRequest, SaveDesignRequest
from services import claude, supabase_db

router = APIRouter()


@router.post("/generate")
async def generate_design(request: DesignRequest, authorization: Optional[str] = Header(None)):
    """
    Generate a complete AI interior design plan.
    Optionally pass Authorization: Bearer <supabase_jwt> to track usage per user.
    """
    user_id = None

    # If user is authenticated, check + track usage limits
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        # Verify token with Supabase (simplified — in production use supabase.auth.get_user)
        try:
            from supabase import create_client
            import os
            sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
            user = sb.auth.get_user(token)
            user_id = user.user.id if user and user.user else None
        except Exception:
            pass

    if user_id:
        within_limit = await supabase_db.increment_usage(user_id)
        if not within_limit:
            raise HTTPException(
                status_code=429,
                detail="Monthly design limit reached. Please upgrade your plan."
            )

    try:
        design_data = await claude.generate_design(request)
        return {"success": True, "data": design_data, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/generate-with-image")
async def generate_design_with_image(
    style: str = Form(...),
    room_type: str = Form(...),
    budget: str = Form(...),
    room_size: int = Form(250),
    notes: str = Form(""),
    image: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
):
    """Generate design with multipart form upload for room image."""
    image_base64 = None
    original_image_url = None

    if image:
        img_bytes = await image.read()
        image_base64 = base64.b64encode(img_bytes).decode()

        # Optionally upload to Supabase Storage
        try:
            path = f"uploads/{uuid.uuid4()}.jpg"
            original_image_url = await supabase_db.upload_image(
                "room-images", path, img_bytes, image.content_type or "image/jpeg"
            )
        except Exception:
            pass  # Storage upload is optional

    request = DesignRequest(
        style=style,
        room_type=room_type,
        budget=budget,
        room_size=room_size,
        notes=notes,
        image_base64=image_base64,
    )

    try:
        design_data = await claude.generate_design(request)
        return {
            "success": True,
            "data": design_data,
            "original_image_url": original_image_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/save")
async def save_design(
    request: SaveDesignRequest,
    authorization: str = Header(...),
):
    """Save a generated design to the user's account."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.split(" ")[1]
    try:
        from supabase import create_client
        import os
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
        user = sb.auth.get_user(token)
        user_id = user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    saved = await supabase_db.save_design(user_id, {
        **request.dict(),
        "headline": request.design_data.get("headline", "My Design"),
    })
    return {"success": True, "design": saved}


@router.get("/share/{token}")
async def get_shared_design(token: str):
    """Get a publicly shared design by share token."""
    design = await supabase_db.get_design_by_share_token(token)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found or not public")
    return {"success": True, "design": design}
