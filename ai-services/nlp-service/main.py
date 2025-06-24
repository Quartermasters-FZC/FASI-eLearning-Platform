"""
NLP Service
AI-Powered eLearning Platform - Quartermasters FZC

Natural Language Processing service for grammar checking, text analysis, and content generation
Supporting all 70+ FSI languages with advanced linguistic analysis
"""

import os
import asyncio
import logging
import json
import time
from typing import Optional, Dict, Any, List
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
from src.services.grammar_checker import GrammarChecker
from src.services.text_analyzer import TextAnalyzer
from src.services.content_generator import ContentGenerator
from src.services.cultural_analyzer import CulturalAnalyzer
from src.services.language_classifier import LanguageClassifier
from src.models.nlp_models import (
    GrammarCheckRequest,
    GrammarCheckResponse,
    TextAnalysisRequest,
    TextAnalysisResponse,
    ContentGenerationRequest,
    ContentGenerationResponse,
    CulturalAnalysisRequest,
    CulturalAnalysisResponse,
    LanguageClassificationRequest,
    LanguageClassificationResponse
)
from src.utils.model_manager import NLPModelManager
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
REQUEST_COUNT = Counter('nlp_requests_total', 'Total NLP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('nlp_request_duration_seconds', 'NLP request duration')
PROCESSING_DURATION = Histogram('nlp_processing_duration_seconds', 'NLP processing duration', ['service', 'language'])
GRAMMAR_ACCURACY = Histogram('grammar_check_accuracy_score', 'Grammar check accuracy scores', ['language'])

# Global services
grammar_checker: Optional[GrammarChecker] = None
text_analyzer: Optional[TextAnalyzer] = None
content_generator: Optional[ContentGenerator] = None
cultural_analyzer: Optional[CulturalAnalyzer] = None
language_classifier: Optional[LanguageClassifier] = None
model_manager: Optional[NLPModelManager] = None
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global grammar_checker, text_analyzer, content_generator
    global cultural_analyzer, language_classifier, model_manager, redis_client
    
    logger.info("Starting NLP Service initialization...")
    
    try:
        # Initialize Redis connection
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connection established")
        
        # Initialize model manager
        model_manager = NLPModelManager()
        await model_manager.initialize()
        logger.info("NLP model manager initialized")
        
        # Initialize language classifier
        language_classifier = LanguageClassifier(model_manager)
        await language_classifier.initialize()
        logger.info("Language classifier initialized")
        
        # Initialize grammar checker
        grammar_checker = GrammarChecker(model_manager, redis_client)
        await grammar_checker.initialize()
        logger.info("Grammar checker initialized")
        
        # Initialize text analyzer
        text_analyzer = TextAnalyzer(model_manager, redis_client)
        await text_analyzer.initialize()
        logger.info("Text analyzer initialized")
        
        # Initialize content generator
        content_generator = ContentGenerator(model_manager, redis_client)
        await content_generator.initialize()
        logger.info("Content generator initialized")
        
        # Initialize cultural analyzer
        cultural_analyzer = CulturalAnalyzer(model_manager)
        await cultural_analyzer.initialize()
        logger.info("Cultural analyzer initialized")
        
        # Warm up models for common languages
        await warmup_models()
        
        logger.info("🚀 NLP Service fully initialized and ready!")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize NLP Service: {e}")
        raise
    finally:
        # Cleanup
        logger.info("Shutting down NLP Service...")
        if redis_client:
            await redis_client.close()
        if model_manager:
            await model_manager.cleanup()
        logger.info("NLP Service shutdown complete")


async def warmup_models():
    """Warm up models for frequently used languages"""
    warmup_languages = ['en', 'ur', 'ar', 'zh-CN', 'es', 'fr', 'ru']
    
    for lang_code in warmup_languages:
        try:
            await model_manager.load_grammar_model(lang_code)
            logger.info(f"Warmed up grammar model for {lang_code}")
        except Exception as e:
            logger.warning(f"Failed to warm up model for {lang_code}: {e}")


# Create FastAPI app
app = FastAPI(
    title="NLP Service",
    description="Multi-language natural language processing for FSI eLearning platform",
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
            "service": "nlp-service",
            "version": "1.0.0",
            "timestamp": asyncio.get_event_loop().time(),
            "models_loaded": len(model_manager.loaded_models) if model_manager else 0,
            "supported_languages": len(FSI_LANGUAGES)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for NLP"""
    return {
        "supported_languages": [
            {
                "code": lang_code,
                "name": config["name"],
                "native_name": config["native_name"],
                "fsi_category": config["fsi_category"],
                "script_type": config["script_type"],
                "has_grammar_model": await model_manager.has_grammar_model(lang_code) if model_manager else False,
                "has_analyzer_model": await model_manager.has_analyzer_model(lang_code) if model_manager else False
            }
            for lang_code, config in FSI_LANGUAGES.items()
        ],
        "total_languages": len(FSI_LANGUAGES),
        "services_available": [
            "grammar_checking",
            "text_analysis",
            "content_generation",
            "cultural_analysis",
            "language_classification"
        ]
    }


# =================================================================
# GRAMMAR CHECKING ENDPOINTS
# =================================================================

@app.post("/check-grammar", response_model=GrammarCheckResponse)
async def check_grammar(
    request: GrammarCheckRequest,
    background_tasks: BackgroundTasks
):
    """
    Check grammar and style for text in any FSI language
    
    Provides detailed error detection, suggestions, and explanations
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Grammar check request for language: {request.language_code}")
        
        # Validate language support
        if request.language_code not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{request.language_code}' not supported")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform grammar checking
        result = await grammar_checker.check_grammar(request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/check-grammar", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(service="grammar", language=request.language_code).observe(processing_time)
        GRAMMAR_ACCURACY.labels(language=request.language_code).observe(result.overall_score)
        
        # Log processing in background
        background_tasks.add_task(
            log_grammar_check,
            request.language_code, result.overall_score, len(result.errors), processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/check-grammar", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/check-grammar", status="error").inc()
        logger.error(f"Grammar check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Grammar check failed: {str(e)}")


# =================================================================
# TEXT ANALYSIS ENDPOINTS
# =================================================================

@app.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(
    request: TextAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Comprehensive text analysis including sentiment, complexity, and linguistic features
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Text analysis request for language: {request.language_code}")
        
        # Validate language support
        if request.language_code not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{request.language_code}' not supported")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform text analysis
        result = await text_analyzer.analyze_text(request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-text", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(service="analysis", language=request.language_code).observe(processing_time)
        
        # Log analysis in background
        background_tasks.add_task(
            log_text_analysis,
            request.language_code, result.complexity_score, result.sentiment_score, processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-text", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-text", status="error").inc()
        logger.error(f"Text analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# =================================================================
# CONTENT GENERATION ENDPOINTS
# =================================================================

@app.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate educational content for language learning
    
    Supports lesson content, exercises, and assessments for all FSI languages
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Content generation request for language: {request.language_code}")
        
        # Validate language support
        if request.language_code not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{request.language_code}' not supported")
        
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Perform content generation
        result = await content_generator.generate_content(request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-content", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(service="generation", language=request.language_code).observe(processing_time)
        
        # Log generation in background
        background_tasks.add_task(
            log_content_generation,
            request.language_code, request.content_type, len(result.generated_text), processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-content", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/generate-content", status="error").inc()
        logger.error(f"Content generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# =================================================================
# CULTURAL ANALYSIS ENDPOINTS
# =================================================================

@app.post("/analyze-cultural-context", response_model=CulturalAnalysisResponse)
async def analyze_cultural_context(
    request: CulturalAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze cultural appropriateness and context of text
    
    Provides feedback on formality, register, and cultural sensitivity
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Cultural analysis request for language: {request.language_code}")
        
        # Validate language support
        if request.language_code not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{request.language_code}' not supported")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform cultural analysis
        result = await cultural_analyzer.analyze_cultural_context(request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-cultural-context", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(service="cultural", language=request.language_code).observe(processing_time)
        
        # Log analysis in background
        background_tasks.add_task(
            log_cultural_analysis,
            request.language_code, result.appropriateness_score, result.formality_level, processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-cultural-context", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-cultural-context", status="error").inc()
        logger.error(f"Cultural analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# =================================================================
# LANGUAGE CLASSIFICATION ENDPOINTS
# =================================================================

@app.post("/classify-language", response_model=LanguageClassificationResponse)
async def classify_language(
    request: LanguageClassificationRequest,
    background_tasks: BackgroundTasks
):
    """
    Classify the language of input text
    
    Supports identification of all FSI languages with confidence scores
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info("Language classification request received")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Perform language classification
        result = await language_classifier.classify_language(request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/classify-language", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(service="classification", language=result.detected_language).observe(processing_time)
        
        # Log classification in background
        background_tasks.add_task(
            log_language_classification,
            result.detected_language, result.confidence, processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/classify-language", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/classify-language", status="error").inc()
        logger.error(f"Language classification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


# =================================================================
# BATCH PROCESSING ENDPOINTS
# =================================================================

@app.post("/batch-process")
async def batch_process(
    texts: List[str],
    language_code: str,
    services: List[str],
    callback_url: Optional[str] = None
):
    """
    Process multiple texts in batch for better efficiency
    """
    try:
        logger.info(f"Batch processing {len(texts)} texts for {language_code}")
        
        # Validate inputs
        if not texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        
        if language_code not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{language_code}' not supported")
        
        valid_services = ['grammar', 'analysis', 'cultural', 'classification']
        if not all(service in valid_services for service in services):
            raise HTTPException(status_code=400, detail="Invalid service specified")
        
        # Create batch job
        batch_id = f"batch_{int(time.time())}_{len(texts)}"
        
        # Start background processing
        asyncio.create_task(
            process_batch_job(batch_id, texts, language_code, services, callback_url)
        )
        
        return {
            "batch_id": batch_id,
            "status": "processing",
            "total_texts": len(texts),
            "services": services,
            "estimated_completion": time.time() + (len(texts) * 2)  # Rough estimate
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@app.get("/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get status of batch processing job"""
    try:
        # Retrieve status from Redis
        status_key = f"batch_status:{batch_id}"
        status_data = await redis_client.get(status_key)
        
        if not status_data:
            raise HTTPException(status_code=404, detail="Batch job not found")
        
        return json.loads(status_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get batch status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve batch status")


# =================================================================
# BACKGROUND TASKS
# =================================================================

async def log_grammar_check(language: str, score: float, error_count: int, processing_time: float):
    """Log grammar check for analytics"""
    try:
        analytics_data = {
            "event": "grammar_check",
            "language": language,
            "overall_score": score,
            "error_count": error_count,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        
        await redis_client.lpush("grammar_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("grammar_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log grammar analytics: {e}")


async def log_text_analysis(language: str, complexity: float, sentiment: float, processing_time: float):
    """Log text analysis for analytics"""
    try:
        analytics_data = {
            "event": "text_analysis",
            "language": language,
            "complexity_score": complexity,
            "sentiment_score": sentiment,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        
        await redis_client.lpush("analysis_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("analysis_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log analysis analytics: {e}")


async def log_content_generation(language: str, content_type: str, content_length: int, processing_time: float):
    """Log content generation for analytics"""
    try:
        analytics_data = {
            "event": "content_generation",
            "language": language,
            "content_type": content_type,
            "content_length": content_length,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        
        await redis_client.lpush("generation_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("generation_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log generation analytics: {e}")


async def log_cultural_analysis(language: str, appropriateness: float, formality: str, processing_time: float):
    """Log cultural analysis for analytics"""
    try:
        analytics_data = {
            "event": "cultural_analysis",
            "language": language,
            "appropriateness_score": appropriateness,
            "formality_level": formality,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        
        await redis_client.lpush("cultural_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("cultural_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log cultural analytics: {e}")


async def log_language_classification(detected_language: str, confidence: float, processing_time: float):
    """Log language classification for analytics"""
    try:
        analytics_data = {
            "event": "language_classification",
            "detected_language": detected_language,
            "confidence": confidence,
            "processing_time": processing_time,
            "timestamp": time.time()
        }
        
        await redis_client.lpush("classification_analytics", json.dumps(analytics_data))
        await redis_client.ltrim("classification_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log classification analytics: {e}")


async def process_batch_job(batch_id: str, texts: List[str], language_code: str, services: List[str], callback_url: Optional[str]):
    """Process batch job in background"""
    try:
        # Initialize batch status
        batch_status = {
            "batch_id": batch_id,
            "status": "processing",
            "total_texts": len(texts),
            "processed_texts": 0,
            "failed_texts": 0,
            "services": services,
            "started_at": time.time(),
            "updated_at": time.time()
        }
        
        # Store initial status
        status_key = f"batch_status:{batch_id}"
        await redis_client.set(status_key, json.dumps(batch_status), ex=86400)  # 24 hours
        
        results = []
        
        # Process each text
        for i, text in enumerate(texts):
            try:
                text_results = {}
                
                # Process with each requested service
                if 'grammar' in services:
                    grammar_request = GrammarCheckRequest(text=text, language_code=language_code)
                    text_results['grammar'] = await grammar_checker.check_grammar(grammar_request)
                
                if 'analysis' in services:
                    analysis_request = TextAnalysisRequest(text=text, language_code=language_code)
                    text_results['analysis'] = await text_analyzer.analyze_text(analysis_request)
                
                if 'cultural' in services:
                    cultural_request = CulturalAnalysisRequest(text=text, language_code=language_code)
                    text_results['cultural'] = await cultural_analyzer.analyze_cultural_context(cultural_request)
                
                if 'classification' in services:
                    classification_request = LanguageClassificationRequest(text=text)
                    text_results['classification'] = await language_classifier.classify_language(classification_request)
                
                results.append({
                    "text_index": i,
                    "text": text,
                    "results": text_results,
                    "status": "success"
                })
                
                batch_status["processed_texts"] += 1
                
            except Exception as e:
                logger.error(f"Failed to process text {i} in batch {batch_id}: {e}")
                results.append({
                    "text_index": i,
                    "text": text,
                    "error": str(e),
                    "status": "failed"
                })
                
                batch_status["failed_texts"] += 1
            
            # Update status periodically
            if i % 10 == 0:
                batch_status["updated_at"] = time.time()
                await redis_client.set(status_key, json.dumps(batch_status), ex=86400)
        
        # Final status update
        batch_status["status"] = "completed"
        batch_status["completed_at"] = time.time()
        batch_status["updated_at"] = time.time()
        await redis_client.set(status_key, json.dumps(batch_status), ex=86400)
        
        # Store results
        results_key = f"batch_results:{batch_id}"
        await redis_client.set(results_key, json.dumps(results), ex=86400)
        
        # Send callback if provided
        if callback_url:
            # Would implement webhook callback here
            pass
        
        logger.info(f"Batch job {batch_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Batch job {batch_id} failed: {e}")
        
        # Update status with error
        batch_status = {
            "batch_id": batch_id,
            "status": "failed",
            "error": str(e),
            "failed_at": time.time()
        }
        
        status_key = f"batch_status:{batch_id}"
        await redis_client.set(status_key, json.dumps(batch_status), ex=86400)


# =================================================================
# SERVER STARTUP
# =================================================================

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8002))
    workers = int(os.getenv("WORKERS", 1))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"Starting NLP Service on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level=log_level,
        reload=os.getenv("ENV") == "development"
    )