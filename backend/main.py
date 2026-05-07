from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from routes import design, image, user, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🏠 DecorGenie API starting up...")
    yield
    print("👋 DecorGenie API shutting down...")

app = FastAPI(
    title="DecorGenie AI API",
    description="AI-powered interior design for Indian homes",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(design.router, prefix="/api/design", tags=["Design"])
app.include_router(image.router, prefix="/api/image", tags=["Image Generation"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "DecorGenie AI API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
