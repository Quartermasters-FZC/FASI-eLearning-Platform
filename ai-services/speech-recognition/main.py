"""
Speech Recognition Service
AI-Powered eLearning Platform - Quartermasters FZC

FastAPI service for multi-language speech recognition and pronunciation analysis
Supporting all 70+ FSI languages with advanced AI capabilities
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import redis
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import structlog

# Internal imports
from src.services.speech_processor import SpeechProcessor
from src.services.pronunciation_analyzer import PronunciationAnalyzer
from src.services.language_detector import LanguageDetector
from src.models.speech_models import (
    SpeechRecognitionRequest,
    SpeechRecognitionResponse,
    PronunciationAnalysisRequest,
    PronunciationAnalysisResponse,
    LanguageDetectionResponse,
    AudioProcessingResponse
)
from src.utils.audio_processor import AudioProcessor
from src.utils.model_manager import ModelManager
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
REQUEST_COUNT = Counter('speech_recognition_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('speech_recognition_request_duration_seconds', 'Request duration')
PROCESSING_DURATION = Histogram('speech_processing_duration_seconds', 'Speech processing duration', ['language'])
ACCURACY_SCORE = Histogram('pronunciation_accuracy_score', 'Pronunciation accuracy scores', ['language', 'skill_level'])

# Global services
speech_processor: Optional[SpeechProcessor] = None
pronunciation_analyzer: Optional[PronunciationAnalyzer] = None
language_detector: Optional[LanguageDetector] = None
audio_processor: Optional[AudioProcessor] = None
model_manager: Optional[ModelManager] = None
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global speech_processor, pronunciation_analyzer, language_detector
    global audio_processor, model_manager, redis_client
    
    logger.info("Starting Speech Recognition Service initialization...")
    
    try:
        # Initialize Redis connection
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connection established")
        
        # Initialize model manager
        model_manager = ModelManager()
        await model_manager.initialize()
        logger.info("Model manager initialized")
        
        # Initialize audio processor
        audio_processor = AudioProcessor()
        logger.info("Audio processor initialized")
        
        # Initialize language detector
        language_detector = LanguageDetector(model_manager)
        await language_detector.initialize()
        logger.info("Language detector initialized")
        
        # Initialize speech processor
        speech_processor = SpeechProcessor(model_manager, redis_client)
        await speech_processor.initialize()
        logger.info("Speech processor initialized")
        
        # Initialize pronunciation analyzer
        pronunciation_analyzer = PronunciationAnalyzer(model_manager)
        await pronunciation_analyzer.initialize()
        logger.info("Pronunciation analyzer initialized")
        
        # Warm up models for common languages
        await warmup_models()
        
        logger.info("🚀 Speech Recognition Service fully initialized and ready!")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize Speech Recognition Service: {e}")
        raise
    finally:
        # Cleanup
        logger.info("Shutting down Speech Recognition Service...")
        if redis_client:
            await redis_client.close()
        if model_manager:
            await model_manager.cleanup()
        logger.info("Speech Recognition Service shutdown complete")


async def warmup_models():
    """Warm up models for frequently used languages"""
    warmup_languages = ['en', 'ur', 'ar', 'zh-CN', 'es', 'fr', 'ru']
    
    for lang_code in warmup_languages:
        try:
            await model_manager.load_speech_model(lang_code)
            logger.info(f"Warmed up speech model for {lang_code}")
        except Exception as e:
            logger.warning(f"Failed to warm up model for {lang_code}: {e}")


# Create FastAPI app
app = FastAPI(
    title="Speech Recognition Service",
    description="Multi-language speech recognition and pronunciation analysis for FSI eLearning platform",
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
            "service": "speech-recognition",
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
    """Get list of supported languages"""
    return {
        "supported_languages": [
            {
                "code": lang_code,
                "name": config["name"],
                "native_name": config["native_name"],
                "fsi_category": config["fsi_category"],
                "script_type": config["script_type"],
                "is_tonal": config.get("is_tonal", False),
                "model_available": await model_manager.is_model_available(lang_code) if model_manager else False
            }
            for lang_code, config in FSI_LANGUAGES.items()
        ],
        "total_languages": len(FSI_LANGUAGES)
    }


# =================================================================
# SPEECH RECOGNITION ENDPOINTS
# =================================================================

@app.post("/recognize", response_model=SpeechRecognitionResponse)
async def recognize_speech(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    auto_detect_language: bool = Form(True),
    return_alternatives: bool = Form(False),
    enable_profanity_filter: bool = Form(True),
    enable_automatic_punctuation: bool = Form(True)
):
    """
    Recognize speech from audio file
    
    Supports all 70+ FSI languages with automatic language detection
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Speech recognition request received", 
                   language=language, 
                   auto_detect=auto_detect_language,
                   filename=audio_file.filename)
        
        # Validate audio file
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Invalid audio file format")
        
        # Read and process audio
        audio_data = await audio_file.read()
        processed_audio = await audio_processor.process_audio(audio_data)
        
        # Detect language if not specified
        detected_language = None
        if auto_detect_language or not language:
            detection_result = await language_detector.detect_language(processed_audio)
            detected_language = detection_result.language_code
            language = language or detected_language
            
            logger.info(f"Language detected: {detected_language}", 
                       confidence=detection_result.confidence)
        
        # Validate language support
        if language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{language}' not supported")
        
        # Perform speech recognition
        recognition_request = SpeechRecognitionRequest(
            audio_data=processed_audio,
            language_code=language,
            return_alternatives=return_alternatives,
            enable_profanity_filter=enable_profanity_filter,
            enable_automatic_punctuation=enable_automatic_punctuation
        )
        
        result = await speech_processor.recognize_speech(recognition_request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/recognize", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        PROCESSING_DURATION.labels(language=language).observe(processing_time)
        
        # Log successful processing in background
        background_tasks.add_task(
            log_recognition_success,
            language, result.confidence, processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/recognize", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/recognize", status="error").inc()
        logger.error(f"Speech recognition failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@app.post("/analyze-pronunciation", response_model=PronunciationAnalysisResponse)
async def analyze_pronunciation(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    reference_text: str = Form(...),
    language: str = Form(...),
    fsi_level: Optional[float] = Form(None),
    focus_phonemes: Optional[str] = Form(None)
):
    """
    Analyze pronunciation accuracy against reference text
    
    Provides detailed phoneme-level analysis and FSI-aligned scoring
    """
    request_start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Pronunciation analysis request", 
                   language=language, 
                   fsi_level=fsi_level,
                   text_length=len(reference_text))
        
        # Validate inputs
        if language not in FSI_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Language '{language}' not supported")
        
        if not reference_text.strip():
            raise HTTPException(status_code=400, detail="Reference text cannot be empty")
        
        # Process audio
        audio_data = await audio_file.read()
        processed_audio = await audio_processor.process_audio(audio_data)
        
        # Parse focus phonemes
        focus_phonemes_list = None
        if focus_phonemes:
            focus_phonemes_list = [p.strip() for p in focus_phonemes.split(',')]
        
        # Create analysis request
        analysis_request = PronunciationAnalysisRequest(
            audio_data=processed_audio,
            reference_text=reference_text,
            language_code=language,
            fsi_level=fsi_level,
            focus_phonemes=focus_phonemes_list
        )
        
        # Perform pronunciation analysis
        result = await pronunciation_analyzer.analyze_pronunciation(analysis_request)
        
        # Record metrics
        processing_time = asyncio.get_event_loop().time() - request_start_time
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-pronunciation", status="success").inc()
        REQUEST_DURATION.observe(processing_time)
        ACCURACY_SCORE.labels(language=language, skill_level=str(fsi_level or 'unknown')).observe(result.overall_score)
        
        # Log analysis in background
        background_tasks.add_task(
            log_pronunciation_analysis,
            language, result.overall_score, fsi_level, processing_time
        )
        
        return result
        
    except HTTPException:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-pronunciation", status="error").inc()
        raise
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/analyze-pronunciation", status="error").inc()
        logger.error(f"Pronunciation analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language(
    audio_file: UploadFile = File(...),
    return_probabilities: bool = Form(False)
):
    """
    Detect language from audio file
    
    Supports identification of all FSI languages
    """
    try:
        logger.info("Language detection request received")
        
        # Process audio
        audio_data = await audio_file.read()
        processed_audio = await audio_processor.process_audio(audio_data)
        
        # Detect language
        result = await language_detector.detect_language(
            processed_audio, 
            return_probabilities=return_probabilities
        )
        
        REQUEST_COUNT.labels(method="POST", endpoint="/detect-language", status="success").inc()
        
        return result
        
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/detect-language", status="error").inc()
        logger.error(f"Language detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


# =================================================================
# AUDIO PROCESSING ENDPOINTS
# =================================================================

@app.post("/process-audio", response_model=AudioProcessingResponse)
async def process_audio_endpoint(
    audio_file: UploadFile = File(...),
    noise_reduction: bool = Form(True),
    normalize_volume: bool = Form(True),
    trim_silence: bool = Form(True),
    target_sample_rate: Optional[int] = Form(16000)
):
    """
    Process audio file with various enhancement options
    """
    try:
        logger.info("Audio processing request received")
        
        # Read audio data
        audio_data = await audio_file.read()
        
        # Apply processing
        result = await audio_processor.process_audio_advanced(
            audio_data,
            noise_reduction=noise_reduction,
            normalize_volume=normalize_volume,
            trim_silence=trim_silence,
            target_sample_rate=target_sample_rate
        )
        
        REQUEST_COUNT.labels(method="POST", endpoint="/process-audio", status="success").inc()
        
        return result
        
    except Exception as e:
        REQUEST_COUNT.labels(method="POST", endpoint="/process-audio", status="error").inc()
        logger.error(f"Audio processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# =================================================================
# BACKGROUND TASKS
# =================================================================

async def log_recognition_success(language: str, confidence: float, processing_time: float):
    """Log successful speech recognition for analytics"""
    try:
        analytics_data = {
            "event": "speech_recognition_success",
            "language": language,
            "confidence": confidence,
            "processing_time": processing_time,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        # Store in Redis for analytics
        await redis_client.lpush("speech_analytics", str(analytics_data))
        await redis_client.ltrim("speech_analytics", 0, 9999)  # Keep last 10k entries
        
    except Exception as e:
        logger.error(f"Failed to log analytics: {e}")


async def log_pronunciation_analysis(language: str, score: float, fsi_level: Optional[float], processing_time: float):
    """Log pronunciation analysis for analytics"""
    try:
        analytics_data = {
            "event": "pronunciation_analysis",
            "language": language,
            "accuracy_score": score,
            "fsi_level": fsi_level,
            "processing_time": processing_time,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        # Store in Redis for analytics
        await redis_client.lpush("pronunciation_analytics", str(analytics_data))
        await redis_client.ltrim("pronunciation_analytics", 0, 9999)
        
    except Exception as e:
        logger.error(f"Failed to log pronunciation analytics: {e}")


# =================================================================
# SERVER STARTUP
# =================================================================

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    workers = int(os.getenv("WORKERS", 1))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"Starting Speech Recognition Service on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level=log_level,
        reload=os.getenv("ENV") == "development"
    )