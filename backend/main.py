# C:\Users\HP\Desktop\arachnie\Arachnie\backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import uvicorn

# Routers
from app.api.v1.remove_bg import router as remove_bg_router
from app.api.v1.iv_schedule import router as iv_schedule_router
from app.api.v1.visa_checker import router as visa_checker_router
from app.api.v1.pdf_routes import router as pdf_router
# from app.api.v1.whatsapp import router as whatsapp_router
from app.api.v1.compress import router as compress_router  # NEW IMPORT
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Immigration Assistant with Visa Bulletin Checker",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rahvana-1.onrender.com",
        "https://www.rahvana.com",
        "https://rahvana-test.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Arachnie API Live",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

# Register All Routes
app.include_router(remove_bg_router, prefix="/api/v1", tags=["remove-bg"])
app.include_router(iv_schedule_router, prefix="/api/v1", tags=["iv-schedule"])
app.include_router(pdf_router, prefix="/api/v1", tags=["pdf-forms"])
app.include_router(visa_checker_router, prefix="/api/v1/visa-checker", tags=["visa-checker"])
# app.include_router(whatsapp_router, prefix="/api/v1", tags=["whatsapp-ai"])
app.include_router(compress_router, prefix="/api/v1", tags=["pdf-compress"]) 

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
