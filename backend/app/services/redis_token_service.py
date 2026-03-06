from app.utils.redis import get_redis

class RedisTokenService:
    """
    Service for managing ephemeral tokens in Redis.
    Handles storage, verification, and automatic expiration.
    """
    
    RESET_PREFIX = "reset:"
    TTL_SECONDS = 300  # 5 minutes

    @classmethod
    def store_reset_token(cls, token: str, user_id: str):
        """Store a password reset token mapped to a user ID with a 5-minute TTL."""
        redis = get_redis()
        key = f"{cls.RESET_PREFIX}{token}"
        # Set with ex (expiration in seconds)
        redis.set(key, user_id, ex=cls.TTL_SECONDS)

    @classmethod
    def verify_reset_token(cls, token: str) -> str | None:
        """
        Verify a token and return the user_id if valid.
        Deletes the token immediately after retrieval (single-use).
        """
        redis = get_redis()
        key = f"{cls.RESET_PREFIX}{token}"
        user_id = redis.get(key)
        
        if user_id:
            # Token found, delete it immediately to prevent reuse
            redis.delete(key)
            return user_id
            
        return None
