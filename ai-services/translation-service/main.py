"""
Translation Service
AI-Powered eLearning Platform - Quartermasters FZC

Multi-language translation service supporting all 70+ FSI language pairs
Advanced neural machine translation with cultural adaptation
"""

import os
import asyncio
import logging
import json
import time
from typing import Optional, Dict, Any, List, Tuple
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import redis
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import structlog

# Internal imports
from src.services.neural_translator import NeuralTranslator
from src.services.cultural_adapter import CulturalAdapter
from src.services.quality_estimator import QualityEstimator
from src.services.batch_translator import BatchTranslator
from src.services.domain_adapter import DomainAdapter
from src.models.translation_models import (
    TranslationRequest,
    TranslationResponse,
    BatchTranslationRequest,
    BatchTranslationResponse,
    QualityAssessmentRequest,
    QualityAssessmentResponse,
    SupportedLanguagesResponse,
    TranslationPair
)
from src.utils.model_manager import TranslationModelManager
from src.utils.language_config import FSI_LANGUAGES, get_language_config
from src.api.middleware import setup_middleware
from src.api.error_handlers import setup_error_handlers

# Configure structured logging
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

# Prometheus metrics
REQUEST_COUNT = Counter('translation_requests_total', 'Total translation requests', ['source_lang', 'target_lang', 'status'])
REQUEST_DURATION = Histogram('translation_request_duration_seconds', 'Translation request duration')
TRANSLATION_QUALITY = Histogram('translation_quality_score', 'Translation quality scores', ['source_lang', 'target_lang'])
BATCH_SIZE = Histogram('batch_translation_size', 'Batch translation sizes', ['source_lang', 'target_lang'])

# Global services
neural_translator: Optional[NeuralTranslator] = None
cultural_adapter: Optional[CulturalAdapter] = None
quality_estimator: Optional[QualityEstimator] = None
batch_translator: Optional[BatchTranslator] = None
domain_adapter: Optional[DomainAdapter] = None
model_manager: Optional[TranslationModelManager] = None
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global neural_translator, cultural_adapter, quality_estimator
    global batch_translator, domain_adapter, model_manager, redis_client
    
    logger.info("Starting Translation Service initialization...")
    
    try:
        # Initialize Redis connection
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connection established")
        
        # Initialize model manager
        model_manager = TranslationModelManager()
        await model_manager.initialize()
        logger.info("Translation model manager initialized")
        
        # Initialize neural translator
        neural_translator = NeuralTranslator(model_manager, redis_client)
        await neural_translator.initialize()
        logger.info("Neural translator initialized")
        
        # Initialize cultural adapter
        cultural_adapter = CulturalAdapter(model_manager)
        await cultural_adapter.initialize()
        logger.info("Cultural adapter initialized")
        
        # Initialize quality estimator
        quality_estimator = QualityEstimator(model_manager)
        await quality_estimator.initialize()
        logger.info("Quality estimator initialized")
        
        # Initialize batch translator
        batch_translator = BatchTranslator(neural_translator, redis_client)
        await batch_translator.initialize()
        logger.info("Batch translator initialized")
        
        # Initialize domain adapter
        domain_adapter = DomainAdapter(model_manager)
        await domain_adapter.initialize()
        logger.info("Domain adapter initialized")
        
        # Warm up models for common language pairs
        await warmup_models()
        
        logger.info("🚀 Translation Service fully initialized and ready!")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize Translation Service: {e}")
        raise
    finally:
        # Cleanup
        logger.info("Shutting down Translation Service...")
        if redis_client:
            await redis_client.close()
        if model_manager:
            await model_manager.cleanup()
        logger.info("Translation Service shutdown complete")


async def warmup_models():
    """Warm up models for frequently used language pairs"""
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


# Create FastAPI app
app = FastAPI(
    title="Translation Service",
    description="Multi-language neural machine translation for FSI eLearning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Setup middleware and error handlers
setup_middleware(app)
setup_error_handlers(app)


# =================================================================
# HEALTH AND MONITORING ENDPOINTS
# =================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_client.ping()
        
        # Check model manager
        if not model_manager or not model_manager.is_initialized:
            raise HTTPException(status_code=503, detail="Model manager not ready")
        
        return {
            "status": "healthy",
            "service": "translation-service",
            "version": "1.0.0",
            "timestamp": asyncio.get_event_loop().time(),
            "models_loaded": len(model_manager.loaded_models) if model_manager else 0,
            "supported_languages": len(FSI_LANGUAGES),
            "supported_pairs": len(FSI_LANGUAGES) * (len(FSI_LANGUAGES) - 1)  # All combinations
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/supported-languages", response_model=SupportedLanguagesResponse)
async def get_supported_languages():
    """Get list of supported languages and translation pairs"""
    
    # Generate all possible language pairs
    language_codes = list(FSI_LANGUAGES.keys())
    translation_pairs = []
    
    for source_code in language_codes:
        for target_code in language_codes:
            if source_code != target_code:
                source_config = FSI_LANGUAGES[source_code]
                target_config = FSI_LANGUAGES[target_code]
                
                # Check if model is available
                model_available = await model_manager.is_model_available(source_code, target_code) if model_manager else False
                
                pair = TranslationPair(
                    source_language=source_code,
                    target_language=target_code,
                    source_name=source_config["name"],
                    target_name=target_config["name"],
                    source_native_name=source_config["native_name"],
                    target_native_name=target_config["native_name"],
                    quality_tier=_determine_quality_tier(source_config, target_config),
                    model_available=model_available,
                    supports_cultural_adaptation=_supports_cultural_adaptation(source_code, target_code),
                    estimated_latency_ms=_estimate_latency(source_config, target_config)
                )
                
                translation_pairs.append(pair)
    
    return SupportedLanguagesResponse(
        supported_languages=[
            {
                "code": lang_code,
                "name": config["name"],
                "native_name": config["native_name"],
                "fsi_category": config["fsi_category"],
                "script_type": config["script_type"],
                "writing_direction": config.get("writing_direction", "ltr")
            }
            for lang_code, config in FSI_LANGUAGES.items()
        ],
        translation_pairs=translation_pairs,
        total_languages=len(FSI_LANGUAGES),
        total_pairs=len(translation_pairs)
    )


# =================================================================
# TRANSLATION ENDPOINTS
# =================================================================

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    background_tasks: BackgroundTasks
):
    """
    Translate text between any FSI language pair
    
    Supports neural machine translation with cultural adaptation
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Translation request: {request.source_language} -> {request.target_language}")
        
        # Validate language support
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")
        
        if request.source_language == request.target_language:
            raise HTTPException(status_code=400, detail="Source and target languages must be different")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform neural translation
        translation_result = await neural_translator.translate(request)
        
        # Apply cultural adaptation if requested
        if request.enable_cultural_adaptation:
            translation_result = await cultural_adapter.adapt_translation(
                translation_result,
                request.source_language,
                request.target_language,
                request.cultural_context
            )
        
        # Apply domain adaptation if specified
        if request.domain:
            translation_result = await domain_adapter.adapt_to_domain(
                translation_result,
                request.domain,
                request.target_language
            )
        
        # Estimate quality if requested
        quality_score = None
        quality_feedback = None
        if request.include_quality_assessment:
            quality_result = await quality_estimator.assess_quality(
                request.text,
                translation_result.translated_text,
                request.source_language,
                request.target_language
            )
            quality_score = quality_result.quality_score
            quality_feedback = quality_result.feedback
        
        # Calculate processing metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        
        # Create response
        response = TranslationResponse(
            translated_text=translation_result.translated_text,
            source_language=request.source_language,
            target_language=request.target_language,
            confidence_score=translation_result.confidence_score,
            quality_score=quality_score,
            quality_feedback=quality_feedback,
            alternative_translations=translation_result.alternatives if request.return_alternatives else None,
            cultural_adaptations=translation_result.cultural_adaptations if request.enable_cultural_adaptation else None,
            detected_domain=translation_result.detected_domain,
            processing_time=processing_time,
            character_count=len(request.text),
            word_count=len(request.text.split()),
            model_version=translation_result.model_version,
            metadata={
                "translation_engine": "neural_transformer",
                "cultural_adaptation": request.enable_cultural_adaptation,
                "domain_adaptation": bool(request.domain),
                "quality_assessment": request.include_quality_assessment
            }
        )
        
        # Record metrics
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="success"
        ).inc()
        REQUEST_DURATION.observe(processing_time)
        
        if quality_score:
            TRANSLATION_QUALITY.labels(
                source_lang=request.source_language,
                target_lang=request.target_language
            ).observe(quality_score)
        
        # Log translation in background
        background_tasks.add_task(
            log_translation,
            request.source_language,
            request.target_language,
            len(request.text),
            response.confidence_score,
            quality_score,
            processing_time
        )
        
        return response
        
    except HTTPException:
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="error"
        ).inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="error"
        ).inc()
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


# =================================================================
# BATCH TRANSLATION ENDPOINTS
# =================================================================

@app.post("/translate-batch", response_model=BatchTranslationResponse)
async def translate_batch(
    request: BatchTranslationRequest,
    background_tasks: BackgroundTasks
):
    """
    Translate multiple texts in batch for better efficiency
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Batch translation request: {request.source_language} -> {request.target_language}, {len(request.texts)} texts")
        
        # Validate inputs
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        
        if len(request.texts) > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 texts per batch")
        
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")
        
        # Perform batch translation
        batch_result = await batch_translator.translate_batch(request)
        
        # Calculate processing metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        
        # Record metrics
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="success"
        ).inc()
        REQUEST_DURATION.observe(processing_time)
        BATCH_SIZE.labels(
            source_lang=request.source_language,
            target_lang=request.target_language
        ).observe(len(request.texts))
        
        # Log batch translation in background
        background_tasks.add_task(
            log_batch_translation,
            request.source_language,
            request.target_language,
            len(request.texts),
            sum(len(text) for text in request.texts),
            batch_result.average_confidence,
            processing_time
        )
        
        return batch_result
        
    except HTTPException:
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="error"
        ).inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(
            source_lang=request.source_language,
            target_lang=request.target_language,
            status="error"
        ).inc()
        logger.error(f"Batch translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch translation failed: {str(e)}")


# =================================================================
# QUALITY ASSESSMENT ENDPOINTS
# =================================================================

@app.post("/assess-quality", response_model=QualityAssessmentResponse)
async def assess_translation_quality(
    request: QualityAssessmentRequest,
    background_tasks: BackgroundTasks
):
    """
    Assess the quality of a translation
    
    Provides detailed analysis and improvement suggestions
    """
    try:
        logger.info(f"Quality assessment request: {request.source_language} -> {request.target_language}")
        
        # Validate inputs
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")
        
        if not request.source_text.strip() or not request.translated_text.strip():
            raise HTTPException(status_code=400, detail="Source and translated texts cannot be empty")
        
        # Perform quality assessment
        result = await quality_estimator.assess_quality(
            request.source_text,
            request.translated_text,
            request.source_language,
            request.target_language,
            include_detailed_analysis=request.include_detailed_analysis
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quality assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quality assessment failed: {str(e)}")


# =================================================================
# UTILITY FUNCTIONS
# =================================================================

def _determine_quality_tier(source_config: Dict[str, Any], target_config: Dict[str, Any]) -> str:
    """Determine quality tier based on language characteristics"""
    # High quality for similar language families
    if source_config.get("family") == target_config.get("family"):
        return "high"
    
    # Medium quality for well-resourced languages
    high_resource_languages = ['en', 'es', 'fr', 'de', 'zh-CN', 'ja', 'ar', 'ru']
    if source_config.get("code", "") in high_resource_languages and target_config.get("code", "") in high_resource_languages:
        return "medium"
    
    # Standard quality for others
    return "standard"


def _supports_cultural_adaptation(source_lang: str, target_lang: str) -> bool:
    """Check if cultural adaptation is supported for language pair"""
    # Cultural adaptation is particularly important for these language pairs
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
    
    # Add latency for complex scripts
    if source_config.get("script_type") in ["arabic", "chinese", "japanese", "korean"]:
        base_latency += 100
    
    if target_config.get("script_type") in ["arabic", "chinese", "japanese", "korean"]:
        base_latency += 100
    
    # Add latency for distant language pairs
    if source_config.get("family") != target_config.get("family"):
        base_latency += 150
    
    return base_latency


# =================================================================
# BACKGROUND TASKS
# =================================================================

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


# =================================================================
# SERVER STARTUP
# =================================================================

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8003))
    workers = int(os.getenv("WORKERS", 1))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"Starting Translation Service on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level=log_level,
        reload=os.getenv("ENV") == "development"
    )