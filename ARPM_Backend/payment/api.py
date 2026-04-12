from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

# 🔹 Request Schema
class OrderCreate(BaseModel):
    amount: int  # in INR

# 🔹 Razorpay Client
client = razorpay.Client(auth=(
    os.getenv("RAZORPAY_KEY_ID"),
    os.getenv("RAZORPAY_KEY_SECRET")
))


# ✅ Create Order API
@router.post(
    "/create-order",
    status_code=status.HTTP_201_CREATED
)
async def create_order(data: OrderCreate):
    try:
        amount = data.amount * 100  # convert to paise

        order = client.order.create({
            "amount": amount,
            "currency": "INR"
        })

        return order

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ✅ Health Check / Home
@router.get("/")
async def home():
    return {"message": "Backend running"}