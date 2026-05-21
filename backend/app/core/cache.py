import json
from typing import Any

import redis

from app.core.config import settings


_client: redis.Redis | None = None


def cache_client() -> redis.Redis | None:
    global _client
    if not settings.redis_url:
        return None
    if _client is None:
        _client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def cache_get_json(key: str) -> Any | None:
    client = cache_client()
    if client is None:
        return None
    try:
        value = client.get(key)
    except redis.RedisError:
        return None
    return json.loads(value) if value else None


def cache_set_json(key: str, value: Any, ttl: int) -> None:
    client = cache_client()
    if client is None:
        return
    try:
        client.setex(key, ttl, json.dumps(value))
    except redis.RedisError:
        return


def cache_delete_prefix(prefix: str) -> None:
    client = cache_client()
    if client is None:
        return
    try:
        for key in client.scan_iter(f"{prefix}*"):
            client.delete(key)
    except redis.RedisError:
        return
