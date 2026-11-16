import time
from collections import defaultdict
from typing import Callable, Dict, List
from fastapi import HTTPException, Request, status
import redis.asyncio as aioredis

from app.core.config import settings

# In-memory sliding window cache fallback
_memory_cache: Dict[str, List[float]] = defaultdict(list)
_redis_client: aioredis.Redis | None = None


def get_redis_client() -> aioredis.Redis | None:
    global _redis_client
    if _redis_client is None and settings.REDIS_URL:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=1,
            )
        except Exception:
            _redis_client = None
    return _redis_client


class RateLimiter:
    """
    Sliding window rate limiter with Redis backend and in-memory fallback.
    """

    def __init__(self, times: int = 10, seconds: int = 60):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        endpoint = request.url.path
        key = f"rl:{endpoint}:{client_ip}"
        now = time.time()

        r = get_redis_client()
        if r is not None:
            try:
                pipe = r.pipeline()
                window_start = now - self.seconds
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, self.seconds)
                results = await pipe.execute()
                current_requests = results[2]

                if current_requests > self.times:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "success": False,
                            "message": f"Rate limit exceeded. Please wait {self.seconds} seconds before retrying.",
                            "error": {"code": "RATE_LIMIT_EXCEEDED"},
                        },
                    )
                return
            except HTTPException:
                raise
            except Exception:
                # If Redis is temporarily unreachable, seamlessly fall back to memory
                pass

        # In-memory sliding window fallback
        timestamps = _memory_cache[key]
        window_start = now - self.seconds
        _memory_cache[key] = [t for t in timestamps if t > window_start]
        if len(_memory_cache[key]) >= self.times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "success": False,
                    "message": f"Rate limit exceeded. Please wait {self.seconds} seconds before retrying.",
                    "error": {"code": "RATE_LIMIT_EXCEEDED"},
                },
            )
        _memory_cache[key].append(now)

