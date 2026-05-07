from fastapi import APIRouter, HTTPException
from models.schemas import ImageRequest
from services import stability

router = APIRouter()

NEGATIVE_PROMPT = (
    "distorted walls, bad perspective, low quality, blurry, crooked furniture, "
    "unrealistic proportions, warped architecture, cartoon, illustration"
)


@router.post("/generate")
async def generate_image(request: ImageRequest):
    """Generate a photorealistic room render using Stability AI or Replicate."""
    try:
        result = await stability.generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or NEGATIVE_PROMPT,
            image_base64=request.image_base64,
        )
        return {"success": True, **result}
    except ValueError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e) + " Image generation is optional — design plans work without it.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
