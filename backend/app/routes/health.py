from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/health")


@router.get("")
async def health_check():
    # Use UTC timestamp (ISO 8601) and include a 'Z' to indicate UTC.
    return {
        "status": "healthy",
        "timestamp": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
        "version": "1.0.0",
        "message": "Service is up and running",
    }
