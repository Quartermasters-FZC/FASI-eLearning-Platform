import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from src.models.translation_models import (
    TranslationRequest,
    TranslationResponse,
    BatchTranslationRequest,
    BatchTranslationResponse,
    QualityAssessmentRequest,
    QualityAssessmentResponse,
    SupportedLanguagesResponse,
    TranslationPair,
)
from src.utils.language_config import FSI_LANGUAGES

from .service_init import (
    neural_translator,
    cultural_adapter,
    quality_estimator,
    batch_translator,
    domain_adapter,
    model_manager,
    redis_client,
    REQUEST_COUNT,
    REQUEST_DURATION,
    TRANSLATION_QUALITY,
    BATCH_SIZE,
    logger,
)
from .utils import (
    _determine_quality_tier,
    _supports_cultural_adaptation,
    _estimate_latency,
    log_translation,
    log_batch_translation,
)

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        await redis_client.ping()
        if not model_manager or not model_manager.is_initialized:
            raise HTTPException(status_code=503, detail="Model manager not ready")
        return {
            "status": "healthy",
            "service": "translation-service",
            "version": "1.0.0",
            "timestamp": asyncio.get_event_loop().time(),
            "models_loaded": len(model_manager.loaded_models) if model_manager else 0,
            "supported_languages": len(FSI_LANGUAGES),
            "supported_pairs": len(FSI_LANGUAGES) * (len(FSI_LANGUAGES) - 1),
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@router.get("/metrics")
async def get_metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@router.get("/supported-languages", response_model=SupportedLanguagesResponse)
async def get_supported_languages():
    language_codes = list(FSI_LANGUAGES.keys())
    translation_pairs = []
    for source_code in language_codes:
        for target_code in language_codes:
            if source_code != target_code:
                source_config = FSI_LANGUAGES[source_code]
                target_config = FSI_LANGUAGES[target_code]
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
                    estimated_latency_ms=_estimate_latency(source_config, target_config),
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
                "writing_direction": config.get("writing_direction", "ltr"),
            }
            for lang_code, config in FSI_LANGUAGES.items()
        ],
        translation_pairs=translation_pairs,
        total_languages=len(FSI_LANGUAGES),
        total_pairs=len(translation_pairs),
    )


@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest, background_tasks: BackgroundTasks):
    request_start_time = asyncio.get_event_loop().time()
    try:
        logger.info(f"Translation request: {request.source_language} -> {request.target_language}")
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")
        if request.source_language == request.target_language:
            raise HTTPException(status_code=400, detail="Source and target languages must be different")
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        translation_result = await neural_translator.translate(request)
        if request.enable_cultural_adaptation:
            translation_result = await cultural_adapter.adapt_translation(
                translation_result,
                request.source_language,
                request.target_language,
                request.cultural_context,
            )
        if request.domain:
            translation_result = await domain_adapter.adapt_to_domain(
                translation_result,
                request.domain,
                request.target_language,
            )
        quality_score = None
        quality_feedback = None
        if request.include_quality_assessment:
            quality_result = await quality_estimator.assess_quality(
                request.text,
                translation_result.translated_text,
                request.source_language,
                request.target_language,
            )
            quality_score = quality_result.quality_score
            quality_feedback = quality_result.feedback
        processing_time = asyncio.get_event_loop().time() - request_start_time
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
                "quality_assessment": request.include_quality_assessment,
            },
        )
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        if quality_score:
            TRANSLATION_QUALITY.labels(source_lang=request.source_language, target_lang=request.target_language).observe(quality_score)
        background_tasks.add_task(
            log_translation,
            request.source_language,
            request.target_language,
            len(request.text),
            response.confidence_score,
            quality_score,
            processing_time,
        )
        return response
    except HTTPException:
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="error").inc()
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/translate-batch", response_model=BatchTranslationResponse)
async def translate_batch(request: BatchTranslationRequest, background_tasks: BackgroundTasks):
    request_start_time = asyncio.get_event_loop().time()
    try:
        logger.info(f"Batch translation request: {request.source_language} -> {request.target_language}, {len(request.texts)} texts")
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        if len(request.texts) > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 texts per batch")
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")

        batch_result = await batch_translator.translate_batch(request)
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        BATCH_SIZE.labels(source_lang=request.source_language, target_lang=request.target_language).observe(len(request.texts))
        background_tasks.add_task(
            log_batch_translation,
            request.source_language,
            request.target_language,
            len(request.texts),
            sum(len(text) for text in request.texts),
            batch_result.average_confidence,
            processing_time,
        )
        return batch_result
    except HTTPException:
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(source_lang=request.source_language, target_lang=request.target_language, status="error").inc()
        logger.error(f"Batch translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch translation failed: {str(e)}")


@router.post("/assess-quality", response_model=QualityAssessmentResponse)
async def assess_translation_quality(request: QualityAssessmentRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Quality assessment request: {request.source_language} -> {request.target_language}")
        if request.source_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Source language '{request.source_language}' not supported")
        if request.target_language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Target language '{request.target_language}' not supported")
        if not request.source_text.strip() or not request.translated_text.strip():
            raise HTTPException(status_code=400, detail="Source and translated texts cannot be empty")
        result = await quality_estimator.assess_quality(
            request.source_text,
            request.translated_text,
            request.source_language,
            request.target_language,
            include_detailed_analysis=request.include_detailed_analysis,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quality assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quality assessment failed: {str(e)}")
