from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class StyleEnum(str, Enum):
    modern = "Modern"
    luxury = "Luxury"
    minimal = "Minimal"
    scandinavian = "Scandinavian"
    industrial = "Industrial"
    japandi = "Japandi"
    indian = "Traditional Indian"
    contemporary = "Contemporary"
    bohemian = "Bohemian"


class RoomEnum(str, Enum):
    living = "Living Room"
    bedroom = "Bedroom"
    kitchen = "Kitchen"
    office = "Home Office"
    dining = "Dining Room"
    pooja = "Pooja Room"
    bathroom = "Bathroom"


class BudgetEnum(str, Enum):
    budget = "under ₹2 lakhs (budget-friendly)"
    mid = "₹2–5 lakhs (mid-range)"
    premium = "₹5–10 lakhs (premium)"
    luxury = "above ₹10 lakhs (luxury)"


class DesignRequest(BaseModel):
    style: StyleEnum
    room_type: RoomEnum
    budget: BudgetEnum
    room_size: Optional[int] = 250  # sq ft
    notes: Optional[str] = ""
    image_base64: Optional[str] = None  # base64 encoded room image
    theme_color: Optional[str] = None  # hex color e.g. "#D4A84B"


class ColorItem(BaseModel):
    hex: str
    name: str
    use: str


class ShoppingItem(BaseModel):
    emoji: str
    name: str
    style: str
    price: str
    store: str
    url: Optional[str] = None


class CostBreakdown(BaseModel):
    painting: str
    flooring: str
    furniture: str
    lighting: str
    false_ceiling: str
    total: str


class DesignResponse(BaseModel):
    headline: str
    overview: str
    vastu_tip: str
    colors: List[ColorItem]
    walls: str
    flooring: str
    ceiling: str
    lighting: str
    furniture: List[str]
    layout_tips: List[str]
    decor: str
    costs: CostBreakdown
    shopping: List[ShoppingItem]
    pro_tips: List[str]
    ai_image_prompt: str


class ImageRequest(BaseModel):
    prompt: str
    style: str
    room_type: str
    negative_prompt: Optional[str] = None
    image_base64: Optional[str] = None  # original room photo for img2img


class ImageResponse(BaseModel):
    image_url: str
    provider: str  # "stability" or "replicate"


class SaveDesignRequest(BaseModel):
    design_data: dict
    style: str
    room_type: str
    budget: str
    room_size: Optional[int] = None
    notes: Optional[str] = None
    original_image_url: Optional[str] = None
    generated_image_url: Optional[str] = None


class CreateOrderRequest(BaseModel):
    plan: str  # "pro" or "business"
    user_id: str
