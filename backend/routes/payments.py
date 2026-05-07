from fastapi import APIRouter, HTTPException, Header
import razorpay
import os
from models.schemas import CreateOrderRequest

router = APIRouter()

PLAN_PRICES = {
    "pro": 99900,       # ₹999 in paise
    "business": 499900, # ₹4,999 in paise
}

def get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise ValueError("Razorpay keys not configured")
    return razorpay.Client(auth=(key_id, key_secret))


@router.post("/create-order")
async def create_order(request: CreateOrderRequest):
    """Create a Razorpay order for plan upgrade."""
    if request.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        client = get_razorpay_client()
        order = client.order.create({
            "amount": PLAN_PRICES[request.plan],
            "currency": "INR",
            "receipt": f"decorgenie_{request.plan}_{request.user_id[:8]}",
            "notes": {
                "plan": request.plan,
                "user_id": request.user_id,
            },
        })
        return {
            "success": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID"),
        }
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/verify")
async def verify_payment(payload: dict):
    """Verify Razorpay payment signature and upgrade user plan."""
    try:
        client = get_razorpay_client()
        client.utility.verify_payment_signature({
            "razorpay_order_id": payload["order_id"],
            "razorpay_payment_id": payload["payment_id"],
            "razorpay_signature": payload["signature"],
        })
        # TODO: Update user plan in Supabase
        return {"success": True, "message": "Payment verified. Plan upgraded!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
