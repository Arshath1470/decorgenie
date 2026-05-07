import io
import os
import base64
import httpx
import replicate
from openai import OpenAI
from PIL import Image, ImageFilter, ImageDraw
from typing import Optional
import numpy as np

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

NEGATIVE_PROMPT = (
    "fisheye lens, wide angle distortion, tilted perspective, warped walls, "
    "neon lights, green LED, blue LED, purple LED, RGB lighting, colored lights, "
    "dramatic colored lighting, HDR, over-processed, oversaturated, "
    "surreal, fantasy, sci-fi, futuristic glow, gaming room, "
    "cartoon, illustration, drawing, painting, render, CGI look, "
    "watermark, text, signature, logo, low quality, blurry, noisy, "
    "moved furniture, missing furniture, replaced furniture, removed wardrobe, "
    "open wardrobe, open shelving, clothes visible, changed wardrobe design, "
    "open cabinet, different wardrobe, wardrobe doors open, "
    "added window, changed door, empty room, changed floor, different bed, "
    "floating objects, bad proportions, unrealistic scale, demolished walls, "
    "hallucinated mirror reflection, neon in mirror, city in mirror, "
    "3D wall panels, extreme texture, embossed walls, stone wall, brick wall, "
    "overly dramatic, dark shadows, underexposed, purple accent light, "
    "pink led, magenta light, colored under-bed lighting"
)


def resize_to_sdxl(image_base64: str) -> bytes:
    """Resize image to 1024x1024 and enhance brightness for better SDXL results."""
    from PIL import ImageEnhance
    img_bytes = base64.b64decode(image_base64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((1024, 1024), Image.LANCZOS)
    # Boost brightness slightly so model can work better with dark room photos
    img = ImageEnhance.Brightness(img).enhance(1.25)
    img = ImageEnhance.Contrast(img).enhance(1.1)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


async def generate_image_stability(prompt: str, negative_prompt: Optional[str] = None, image_base64: Optional[str] = None) -> str:
    """Generate room image using Stability AI — img2img if source image provided, else text-to-image."""
    if not STABILITY_API_KEY:
        raise ValueError("STABILITY_API_KEY not set")

    async with httpx.AsyncClient(timeout=60) as client:
        if image_base64:
            # img2img: preserves room structure, perspective, and proportions
            img_bytes = resize_to_sdxl(image_base64)
            response = await client.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
                headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "application/json"},
                data={
                    "text_prompts[0][text]": prompt,
                    "text_prompts[0][weight]": "1",
                    "text_prompts[1][text]": negative_prompt or NEGATIVE_PROMPT,
                    "text_prompts[1][weight]": "-1",
                    "image_strength": "0.65",
                    "cfg_scale": "15",
                    "steps": "50",
                    "samples": "1",
                },
                files={"init_image": ("room.jpg", img_bytes, "image/jpeg")},
            )
        else:
            response = await client.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Content-Type": "application/json", "Accept": "application/json"},
                json={
                    "text_prompts": [
                        {"text": prompt, "weight": 1},
                        {"text": negative_prompt or NEGATIVE_PROMPT, "weight": -1},
                    ],
                    "cfg_scale": 8,
                    "height": 768,
                    "width": 1344,
                    "steps": 30,
                    "samples": 1,
                },
            )

        response.raise_for_status()
        data = response.json()
        return f"data:image/png;base64,{data['artifacts'][0]['base64']}"


async def generate_image_replicate(prompt: str, negative_prompt: Optional[str] = None, image_base64: Optional[str] = None) -> str:
    """Generate room image using Replicate — img2img if source image provided, else text-to-image."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not set")

    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

    inp: dict = {
        "prompt": prompt,
        "negative_prompt": negative_prompt or NEGATIVE_PROMPT,
        "guidance_scale": 15,
        "num_inference_steps": 50,
        "num_outputs": 1,
    }

    if image_base64:
        # img2img: pass image + lower prompt_strength so furniture is mostly preserved
        img_bytes = resize_to_sdxl(image_base64)
        import tempfile, pathlib
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp.write(img_bytes)
        tmp.flush()
        tmp.close()
        inp["image"] = pathlib.Path(tmp.name).open("rb")
        inp["prompt_strength"] = 0.7   # ControlNet preserves geometry; 0.7 gives visible wall/ceiling changes
    else:
        inp["prompt_strength"] = 0.8

    output = replicate.run(
        "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input=inp,
    )

    return str(output[0])


async def generate_image_dalle(prompt: str) -> str:
    """Generate a photorealistic room render using DALL-E 3."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set")
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.images.generate(
        model="dall-e-3",
        prompt=(
            f"Photorealistic interior design render. {prompt}. "
            "Bright natural daylight, warm white ambient lighting, straight eye-level perspective, "
            "no fisheye distortion, no colored LED lights, no neon, "
            "professional real estate photography style, sharp focus, realistic materials and textures."
        ),
        size="1792x1024",
        quality="hd",
        n=1,
    )
    return response.data[0].url


def _make_wall_mask(img_rgba: Image.Image) -> Image.Image:
    """
    Generate an inpaint mask for walls + ceiling.
    Transparent (alpha=0)  → repaint this area  (walls / ceiling)
    Opaque (alpha=255)     → keep this area      (furniture / floor)
    Strategy: top 35% = ceiling. Remaining area: identify "wall-like" regions
    by high brightness (>160) — dark furniture/floor will be preserved.
    Edges of mask are feathered for seamless blending.
    """
    w, h = img_rgba.size
    arr = np.array(img_rgba.convert("RGBA"))

    # Start: everything opaque (keep everything)
    alpha = np.full((h, w), 255, dtype=np.uint8)

    # ── Ceiling band: top 35 % ──────────────────────────────────────────────
    alpha[: int(h * 0.35), :] = 0

    # ── Wall detection in the lower 65 %: bright flat areas are walls ───────
    lower = arr[int(h * 0.35) :, :, :3]
    brightness = lower.mean(axis=2)           # (lower_h, w)
    is_bright = brightness > 155              # bright pixels likely wall

    # Only mark left & right thirds as potential wall (centre = furniture/bed)
    left_third  = int(w * 0.25)
    right_third = int(w * 0.75)
    side_mask = np.zeros_like(is_bright, dtype=bool)
    side_mask[:, :left_third]  = True
    side_mask[:, right_third:] = True
    # Also include any bright strip in the upper-lower region (above bed height)
    upper_lower = int(lower.shape[0] * 0.5)
    side_mask[:upper_lower, :] = True         # full width in upper portion

    wall_pixels = is_bright & side_mask
    alpha[int(h * 0.35) :][wall_pixels] = 0

    # ── Build PIL image and feather edges ───────────────────────────────────
    mask_img = img_rgba.copy().convert("RGBA")
    rgba_arr = np.array(mask_img)
    rgba_arr[:, :, 3] = alpha
    mask_out = Image.fromarray(rgba_arr, "RGBA")

    # Slight blur on the alpha channel so mask edges blend naturally
    r, g, b, a = mask_out.split()
    a = a.filter(ImageFilter.GaussianBlur(radius=12))
    mask_out = Image.merge("RGBA", (r, g, b, a))
    return mask_out


async def generate_image_dalle_inpaint(prompt: str, image_base64: str) -> str:
    """
    Use DALL-E 2 inpainting to repaint ONLY walls + ceiling.
    The mask keeps furniture / floor pixel-perfect.
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set")

    # Prepare 1024×1024 RGBA original
    img_bytes = base64.b64decode(image_base64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA").resize((1024, 1024), Image.LANCZOS)

    # Build wall+ceiling mask
    mask = _make_wall_mask(img)

    # Serialise both as PNG (DALL-E 2 edit requires PNG with alpha)
    orig_buf = io.BytesIO()
    img.save(orig_buf, format="PNG")
    orig_buf.seek(0)

    mask_buf = io.BytesIO()
    mask.save(mask_buf, format="PNG")
    mask_buf.seek(0)

    inpaint_prompt = (
        f"{prompt}. "
        "Photorealistic interior, smooth freshly painted walls, warm white recessed ceiling lights, "
        "natural daylight, professional real estate photography, no colored LEDs, no neon."
    )

    oai = OpenAI(api_key=OPENAI_API_KEY)
    response = oai.images.edit(
        model="dall-e-2",
        image=orig_buf,
        mask=mask_buf,
        prompt=inpaint_prompt,
        n=1,
        size="1024x1024",
    )
    return response.data[0].url


async def generate_image(prompt: str, negative_prompt: Optional[str] = None, image_base64: Optional[str] = None) -> dict:
    """
    If source image provided: use Stability/Replicate img2img (preserves original room).
    If no source image: try DALL-E 3 first for best quality text-to-image.
    """
    if image_base64:
        # img2img path — DALL-E 2 inpaint uses an exact wall/ceiling mask = perfect furniture preservation
        if OPENAI_API_KEY:
            try:
                url = await generate_image_dalle_inpaint(prompt, image_base64)
                return {"image_url": url, "provider": "dalle2_inpaint"}
            except Exception as e:
                print(f"DALL-E 2 inpaint failed: {e}, trying Replicate...")
        # Replicate ControlNet depth — preserves room geometry well
        if REPLICATE_API_TOKEN:
            try:
                url = await generate_image_replicate(prompt, negative_prompt, image_base64)
                return {"image_url": url, "provider": "replicate"}
            except Exception as e:
                print(f"Replicate img2img failed: {e}, trying Stability...")
        # Last resort: Stability plain img2img
        if STABILITY_API_KEY:
            url = await generate_image_stability(prompt, negative_prompt, image_base64)
            return {"image_url": url, "provider": "stability"}
        raise ValueError("No img2img API configured. Set OPENAI_API_KEY, REPLICATE_API_TOKEN or STABILITY_API_KEY.")
    else:
        # text-to-image path — DALL-E 3 gives best results
        if OPENAI_API_KEY:
            try:
                url = await generate_image_dalle(prompt)
                return {"image_url": url, "provider": "dalle3"}
            except Exception as e:
                print(f"DALL-E 3 failed: {e}, trying Stability...")
        if STABILITY_API_KEY:
            try:
                url = await generate_image_stability(prompt, negative_prompt, None)
                return {"image_url": url, "provider": "stability"}
            except Exception as e:
                print(f"Stability failed: {e}, trying Replicate...")
        if REPLICATE_API_TOKEN:
            url = await generate_image_replicate(prompt, negative_prompt, None)
            return {"image_url": url, "provider": "replicate"}
        raise ValueError("No image generation API configured. Set OPENAI_API_KEY, STABILITY_API_KEY or REPLICATE_API_TOKEN.")
