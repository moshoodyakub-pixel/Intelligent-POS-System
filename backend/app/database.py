from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from .models import Base
from .config import settings

# Configure engine with connection pool settings for better reliability
engine_kwargs = {}
if settings.DATABASE_URL.startswith("postgresql"):
    engine_kwargs = {
        "pool_pre_ping": True,  # Verify connections before use
        "pool_recycle": 300,    # Recycle connections after 5 minutes
    }

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_database_connection() -> bool:
    """Check if the database connection is working."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
