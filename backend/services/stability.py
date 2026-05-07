import io
import os
import base64
import httpx
import replicate
from openai import OpenAI
from PIL import Image
from typing import Optional

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

NEGATIVE_PROMPT = (
    "fisheye lens, wide angle distortion, tilted perspective, warped walls, "
    "neon lights, blue LED, purple lighting, dramatic colored lighting, HDR, over-processed, "
    "oversaturated, surreal, fantasy, sci-fi, futuristic glow, "
    "cartoon, illustration, drawing, painting, render, CGI look, "
    "watermark, text, signature, logo, low quality, blurry, noisy, "
    "deformed furniture, floating objects, bad proportions, unrealistic scale"
)


def resize_to_sdxl(image_base64: str) -> bytes:
    """Resize image to 1024x1024 as required by SDXL."""
    img_bytes = base64.b64decode(image_base64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((1024, 1024), Image.LANCZOS)
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
                    "image_strength": "0.35",
                    "cfg_scale": "7",
                    "steps": "40",
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

    # Always use the interior-design specific model for best photorealistic results
    output = replicate.run(
        "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input={
            "prompt": prompt,
            "negative_prompt": negative_prompt or NEGATIVE_PROMPT,
            "guidance_scale": 15,
            "prompt_strength": 0.8,
            "num_inference_steps": 50,
            "num_outputs": 1,
        },
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


async def generate_image(prompt: str, negative_prompt: Optional[str] = None, image_base64: Optional[str] = None) -> dict:
    """Try DALL-E 3 first, then Stability, then Replicate."""
    if OPENAI_API_KEY:
        try:
            url = await generate_image_dalle(prompt)
            return {"image_url": url, "provider": "dalle3"}
        except Exception as e:
            print(f"DALL-E 3 failed: {e}, trying Stability...")

    if STABILITY_API_KEY:
        try:
            url = await generate_image_stability(prompt, negative_prompt, image_base64)
            return {"image_url": url, "provider": "stability"}
        except Exception as e:
            print(f"Stability failed: {e}, trying Replicate...")

    if REPLICATE_API_TOKEN:
        url = await generate_image_replicate(prompt, negative_prompt, image_base64)
        return {"image_url": url, "provider": "replicate"}

    raise ValueError(
        "No image generation API configured. "
        "Set OPENAI_API_KEY, STABILITY_API_KEY or REPLICATE_API_TOKEN in .env"
    )
