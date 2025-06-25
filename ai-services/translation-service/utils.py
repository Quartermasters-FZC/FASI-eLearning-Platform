import json
import time
from typing import Dict, Any, Optional

from .service_init import redis_client, logger


def _determine_quality_tier(source_config: Dict[str, Any], target_config: Dict[str, Any]) -> str:
    """Determine quality tier based on language characteristics"""
    if source_config.get("family") == target_config.get("family"):
        return "high"

    high_resource_languages = ['en', 'es', 'fr', 'de', 'zh-CN', 'ja', 'ar', 'ru']
    if source_config.get("code", "") in high_resource_languages and target_config.get("code", "") in high_resource_languages:
        return "medium"

    return "standard"


def _supports_cultural_adaptation(source_lang: str, target_lang: str) -> bool:
    """Check if cultural adaptation is supported for language pair"""
    cultural_pairs = {
        ('en', 'ja'), ('ja', 'en'),
        ('en', 'ko'), ('ko', 'en'),
        ('en', 'ar'), ('ar', 'en'),
        ('en', 'zh-CN'), ('zh-CN', 'en'),
        ('en', 'th'), ('th', 'en'),
        ('en', 'hi'), ('hi', 'en'),
        ('en', 'ur'), ('ur', 'en')
    }
    return (source_lang, target_lang) in cultural_pairs


def _estimate_latency(source_config: Dict[str, Any], target_config: Dict[str, Any]) -> int:
    """Estimate translation latency in milliseconds"""
    base_latency = 200

    if source_config.get("script_type") in ["arabic", "chinese", "japanese", "korean"]:
        base_latency += 100
    if target_config.get("script_type") in ["arabic", "chinese", "japanese", "korean"]:
        base_latency += 100

    if source_config.get("family") != target_config.get("family"):
        base_latency += 150

    return base_latency


async def log_translation(
    source_lang: str,
    target_lang: str,
    text_length: int,
    confidence: float,
    quality_score: Optional[float],
    processing_time: float
):
    """Log translation for analytics"""
    try:
        analytics_data = {
            "event": "translation",
            "source_language": source_lang,
            "target_language": target_lang,
            "text_length": text_length,
            "confidence_score": confidence,
            "quality_score": quality_score,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        await redis_client.lpush("translation_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("translation_analytics", 0, 9999)
    except Exception as e:
        logger.error(f"Failed to log translation analytics: {e}")


async def log_batch_translation(
    source_lang: str,
    target_lang: str,
    batch_size: int,
    total_chars: int,
    avg_confidence: float,
    processing_time: float
):
    """Log batch translation for analytics"""
    try:
        analytics_data = {
            "event": "batch_translation",
            "source_language": source_lang,
            "target_language": target_lang,
            "batch_size": batch_size,
            "total_characters": total_chars,
            "average_confidence": avg_confidence,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        await redis_client.lpush("batch_translation_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("batch_translation_analytics", 0, 9999)
    except Exception as e:
        logger.error(f"Failed to log batch translation analytics: {e}")
