import anthropic
import json
import os
from models.schemas import DesignRequest, DesignResponse

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are DecorGenie, an expert AI interior designer specializing in Indian homes.
You blend global design trends (Modern, Japandi, Scandinavian, Luxury, etc.) with Indian aesthetics,
Vastu Shastra principles, budget sensitivity, and practical renovation knowledge.
You know Indian material suppliers, furniture brands (Pepperfry, IKEA India, Urban Ladder),
and realistic cost ranges for Tier-1 and Tier-2 Indian cities.
Always respond with valid JSON only — no markdown fences, no preamble, no explanation outside the JSON."""

DESIGN_PROMPT_TEMPLATE = """{img_note}

Design a complete {style} style {room_type} interior for a {room_size} sq ft space with budget {budget}.
CRITICAL BUDGET RULE: The total cost estimate MUST stay strictly within the budget of {budget}. Every individual cost item and the final total must fit within this budget. Do not suggest items or totals that exceed it under any circumstance.
{color_line}
{notes_line}

Return ONLY a JSON object with these exact keys:
{{
  "headline": "Short punchy redesign tagline (max 8 words)",
  "overview": "2-3 sentence creative vision for this redesign",
  "vastu_tip": "One specific, actionable Vastu Shastra recommendation for this exact room type",
  "colors": [
    {{"hex":"#XXXXXX","name":"Color Name","use":"Specific usage in this room"}},
    {{"hex":"#XXXXXX","name":"Color Name","use":"Specific usage in this room"}},
    {{"hex":"#XXXXXX","name":"Color Name","use":"Specific usage in this room"}},
    {{"hex":"#XXXXXX","name":"Color Name","use":"Specific usage in this room"}}
  ],
  "walls": "Detailed wall treatment — paint brand/shade code, texture, paneling, or wallpaper",
  "flooring": "Flooring material, finish, pattern, and installation note",
  "ceiling": "False ceiling type, cove lighting, POP, or other ceiling design",
  "lighting": "Full lighting plan: ambient, task, accent — with fixture types and placement",
  "furniture": [
    "Furniture item 1 with material, approx size, style adjectives",
    "Furniture item 2 with material, approx size, style adjectives",
    "Furniture item 3 with material, approx size, style adjectives",
    "Furniture item 4 with material, approx size, style adjectives",
    "Furniture item 5 with material, approx size, style adjectives",
    "Furniture item 6 with material, approx size, style adjectives"
  ],
  "layout_tips": [
    "Specific furniture placement tip with cardinal direction if relevant",
    "Space optimization tip",
    "Traffic flow or proportion tip"
  ],
  "decor": "Key decor accessories, textiles, plants, art — specific to this style",
  "costs": {{
    "painting": "₹XX,XXX – ₹XX,XXX",
    "flooring": "₹XX,XXX – ₹XX,XXX",
    "furniture": "₹X,XX,XXX – ₹X,XX,XXX",
    "lighting": "₹XX,XXX – ₹XX,XXX",
    "false_ceiling": "₹XX,XXX – ₹XX,XXX",
    "total": "₹X,XX,XXX – ₹X,XX,XXX"
  }},
  "shopping": [
    {{"emoji":"🛋️","name":"Item name","style":"Description","price":"₹XX,XXX–₹XX,XXX","store":"Store name"}},
    {{"emoji":"💡","name":"Item name","style":"Description","price":"₹X,XXX–₹X,XXX","store":"Store name"}},
    {{"emoji":"🪴","name":"Item name","style":"Description","price":"₹XXX–₹X,XXX","store":"Store name"}},
    {{"emoji":"🖼️","name":"Item name","style":"Description","price":"₹X,XXX–₹X,XXX","store":"Store name"}},
    {{"emoji":"🪞","name":"Item name","style":"Description","price":"₹X,XXX–₹X,XXX","store":"Store name"}}
  ],
  "pro_tips": [
    "Expert designer tip specific to this style and room",
    "Material or maintenance insight",
    "Cost-saving or quality-upgrade tip"
  ],
  "ai_image_prompt": "photorealistic {style} {room_type} interior redesign, ONLY the walls and ceiling are changed, all original furniture stays in exact same position untouched, walls repainted in [FILL IN: specific hex color and name from your palette, e.g. soft sage green #A8B89A or warm ivory #F5EED8], smooth matte paint finish on walls, clean flat white false ceiling with recessed warm white spotlights, bright warm white ambient lighting 4000K, eye-level camera angle, professional real estate photography, sharp focus, no fisheye, no colored lights, no neon"
}}"""


async def validate_room_image(image_base64: str, media_type: str) -> dict:
    """Check if the image is a valid room/interior photo. Returns {valid, message}."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": image_base64},
                },
                {
                    "type": "text",
                    "text": (
                        "Is this image a photograph of an indoor room or interior space "
                        "(e.g. living room, bedroom, kitchen, office, dining room, bathroom, corridor)? "
                        "Reply with ONLY a JSON object: "
                        "{\"valid\": true/false, \"reason\": \"one short sentence\"}"
                    ),
                },
            ],
        }],
    )
    raw = response.content[0].text.strip()
    try:
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(clean)
    except Exception:
        return {"valid": True, "reason": ""}


async def generate_design(request: DesignRequest) -> dict:
    """Generate a complete interior design plan using Claude."""

    img_note = (
        "I have uploaded a photo of the room. Analyze it carefully — identify the current layout, "
        "furniture, wall color, flooring, lighting, and any issues. "
        "IMPORTANT: The redesign should ONLY modify the walls and ceiling. "
        "Keep all existing furniture, flooring, and room contents exactly as they are. "
        "Focus wall and ceiling recommendations on what will look best with the existing furniture."
        if request.image_base64
        else "No room photo provided. Use typical Indian apartment layout assumptions for this room type."
    )

    notes_line = f"Special preferences: {request.notes}" if request.notes else ""
    color_line = (
        f"Theme color chosen by user: {request.theme_color}. "
        f"Build the entire palette, walls, textiles, and accents around this color. "
        f"Include it as one of the 4 palette colors and make it the dominant tone."
        if request.theme_color else ""
    )

    prompt = DESIGN_PROMPT_TEMPLATE.format(
        img_note=img_note,
        style=request.style,
        room_type=request.room_type,
        room_size=request.room_size or 250,
        budget=request.budget,
        notes_line=notes_line,
        color_line=color_line,
    )

    # Build message content
    content = []
    if request.image_base64:
        import base64 as _b64
        from PIL import Image as _Image
        import io as _io
        try:
            raw_bytes = _b64.b64decode(request.image_base64)
            fmt = _Image.open(_io.BytesIO(raw_bytes)).format or "JPEG"
            media_type = {
                "JPEG": "image/jpeg", "JPG": "image/jpeg",
                "PNG": "image/png", "WEBP": "image/webp",
                "GIF": "image/gif", "BMP": "image/bmp",
                "TIFF": "image/tiff",
            }.get(fmt.upper(), "image/jpeg")
        except Exception:
            media_type = "image/jpeg"

        # Validate image is an actual room photo
        validation = await validate_room_image(request.image_base64, media_type)
        if not validation.get("valid", True):
            raise ValueError(
                "INVALID_IMAGE: The photo doesn't appear to be a room or interior space. "
                "Please upload a clear photo of your room (living room, bedroom, kitchen, office, etc.) "
                "for best results. Make sure the image is well-lit and shows the full room clearly."
            )

        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": request.image_base64,
            },
        })
    content.append({"type": "text", "text": prompt})

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw = "".join(block.text for block in response.content if hasattr(block, "text"))
    # Strip any accidental markdown fences
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    return json.loads(clean)
