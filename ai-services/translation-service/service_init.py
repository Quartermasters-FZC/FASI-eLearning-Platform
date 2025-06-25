import os
import asyncio
import redis
import structlog
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from prometheus_client import Counter, Histogram

from src.services.neural_translator import NeuralTranslator
from src.services.cultural_adapter import CulturalAdapter
from src.services.quality_estimator import QualityEstimator
from src.services.batch_translator import BatchTranslator
from src.services.domain_adapter import DomainAdapter
from src.utils.model_manager import TranslationModelManager

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

REQUEST_COUNT = Counter('translation_requests_total', 'Total translation requests', ['source_lang', 'target_lang', 'status'])
REQUEST_DURATION = Histogram('translation_request_duration_seconds', 'Translation request duration')
TRANSLATION_QUALITY = Histogram('translation_quality_score', 'Translation quality scores', ['source_lang', 'target_lang'])
BATCH_SIZE = Histogram('batch_translation_size', 'Batch translation sizes', ['source_lang', 'target_lang'])

neural_translator: Optional[NeuralTranslator] = None
cultural_adapter: Optional[CulturalAdapter] = None
quality_estimator: Optional[QualityEstimator] = None
batch_translator: Optional[BatchTranslator] = None
domain_adapter: Optional[DomainAdapter] = None
model_manager: Optional[TranslationModelManager] = None
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global neural_translator, cultural_adapter, quality_estimator
    global batch_translator, domain_adapter, model_manager, redis_client

    logger.info("Starting Translation Service initialization...")

    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connection established")

        model_manager = TranslationModelManager()
        await model_manager.initialize()
        logger.info("Translation model manager initialized")

        neural_translator = NeuralTranslator(model_manager, redis_client)
        await neural_translator.initialize()
        logger.info("Neural translator initialized")

        cultural_adapter = CulturalAdapter(model_manager)
        await cultural_adapter.initialize()
        logger.info("Cultural adapter initialized")

        quality_estimator = QualityEstimator(model_manager)
        await quality_estimator.initialize()
        logger.info("Quality estimator initialized")

        batch_translator = BatchTranslator(neural_translator, redis_client)
        await batch_translator.initialize()
        logger.info("Batch translator initialized")

        domain_adapter = DomainAdapter(model_manager)
        await domain_adapter.initialize()
        logger.info("Domain adapter initialized")

        await warmup_models()

        logger.info("🚀 Translation Service fully initialized and ready!")

        yield

    except Exception as e:
        logger.error(f"Failed to initialize Translation Service: {e}")
        raise
    finally:
        logger.info("Shutting down Translation Service...")
        if redis_client:
            await redis_client.close()
        if model_manager:
            await model_manager.cleanup()
        logger.info("Translation Service shutdown complete")


async def warmup_models():
    common_pairs = [
        ('en', 'ur'), ('ur', 'en'),
        ('en', 'ar'), ('ar', 'en'),
        ('en', 'zh-CN'), ('zh-CN', 'en'),
        ('en', 'es'), ('es', 'en'),
        ('en', 'fr'), ('fr', 'en'),
        ('en', 'ru'), ('ru', 'en')
    ]

    for source_lang, target_lang in common_pairs:
        try:
            await model_manager.load_translation_model(source_lang, target_lang)
            logger.info(f"Warmed up translation model for {source_lang}->{target_lang}")
        except Exception as e:
            logger.warning(f"Failed to warm up model for {source_lang}->{target_lang}: {e}")


