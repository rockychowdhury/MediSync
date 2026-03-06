from upstash_redis import Redis
from app.core.config import settings

# Initialize Upstash Redis client
# Note: upstash-redis uses HTTPS REST API, which is perfect for serverless/constrained environments
redis_client = None

if settings.UPSTASH_REDIS_URL and settings.UPSTASH_REDIS_TOKEN:
    redis_client = Redis(
        url=settings.UPSTASH_REDIS_URL,
        token=settings.UPSTASH_REDIS_TOKEN
    )
else:
    print("[WARNING] Upstash Redis credentials not found. Redis features will be disabled.")

def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized. Check your UPSTASH_REDIS environment variables.")
    return redis_client
