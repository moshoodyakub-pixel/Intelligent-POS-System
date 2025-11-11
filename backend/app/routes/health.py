from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/health")

@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "message": "Service is up and running"
    }