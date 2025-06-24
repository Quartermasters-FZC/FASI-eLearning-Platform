"""
Speech Processing Service
AI-Powered eLearning Platform - Quartermasters FZC

Core speech recognition and processing service supporting all 70+ FSI languages
"""

import asyncio
import io
import json
import time
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import torch
import whisper
import librosa
import soundfile as sf
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import redis
import structlog

from ..models.speech_models import (
    SpeechRecognitionRequest,
    SpeechRecognitionResponse,
    TranscriptionAlternative
)
from ..utils.language_config import FSI_LANGUAGES, get_language_config
from ..utils.model_manager import ModelManager
from ..utils.audio_processor import AudioProcessor

logger = structlog.get_logger()


class SpeechProcessor:
    """
    Advanced speech recognition service supporting all FSI languages
    """
    
    def __init__(self, model_manager: ModelManager, redis_client: redis.Redis):
        self.model_manager = model_manager
        self.redis_client = redis_client
        self.audio_processor = AudioProcessor()
        
        # Whisper models for different quality levels
        self.whisper_models = {}
        
        # Language-specific ASR models
        self.language_models = {}
        
        # Post-processing pipelines
        self.punctuation_models = {}
        self.profanity_filters = {}
        
        # Processing statistics
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_processing_time": 0.0,
            "language_usage": {}
        }
        
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the speech processor"""
        try:
            logger.info("Initializing Speech Processor...")
            
            # Initialize core Whisper models
            await self._initialize_whisper_models()
            
            # Initialize language-specific models
            await self._initialize_language_models()
            
            # Initialize post-processing models
            await self._initialize_postprocessing_models()
            
            # Load cached statistics
            await self._load_statistics()
            
            self.is_initialized = True
            logger.info("Speech Processor initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Speech Processor: {e}")
            raise
    
    async def _initialize_whisper_models(self):
        """Initialize Whisper models for different quality levels"""
        try:
            # Load base Whisper model (good balance of speed and accuracy)
            logger.info("Loading Whisper base model...")
            self.whisper_models['base'] = whisper.load_model("base")
            
            # Load large model for high-accuracy tasks
            logger.info("Loading Whisper large model...")
            self.whisper_models['large'] = whisper.load_model("large-v3")
            
            # Multilingual model specifically for FSI languages
            logger.info("Loading multilingual Whisper model...")
            self.whisper_models['multilingual'] = whisper.load_model("large-v3")
            
            logger.info("Whisper models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Whisper models: {e}")
            raise
    
    async def _initialize_language_models(self):
        """Initialize language-specific ASR models"""
        try:
            # Priority languages for specialized models
            priority_languages = ['ur', 'ar', 'zh-CN', 'ja', 'ko', 'hi', 'ru', 'th', 'vi']
            
            for lang_code in priority_languages:
                try:
                    model_info = await self.model_manager.get_language_model_info(lang_code)
                    if model_info and model_info.get('specialized_asr'):
                        # Load specialized ASR model for this language
                        model_path = model_info['specialized_asr']['model_path']
                        self.language_models[lang_code] = await self._load_specialized_model(lang_code, model_path)
                        logger.info(f"Loaded specialized ASR model for {lang_code}")
                except Exception as e:
                    logger.warning(f"Could not load specialized model for {lang_code}: {e}")
            
            logger.info(f"Initialized {len(self.language_models)} specialized language models")
            
        except Exception as e:
            logger.error(f"Failed to initialize language models: {e}")
            raise
    
    async def _initialize_postprocessing_models(self):
        """Initialize post-processing models"""
        try:
            # Load punctuation restoration model
            logger.info("Loading punctuation restoration model...")
            self.punctuation_models['default'] = pipeline(
                "text2text-generation",
                model="oliverguhr/fullstop-punctuation-multilingual-base",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Initialize profanity filters for different languages
            await self._initialize_profanity_filters()
            
            logger.info("Post-processing models initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize post-processing models: {e}")
            raise
    
    async def _initialize_profanity_filters(self):
        """Initialize profanity filters for supported languages"""
        try:
            # Basic profanity word lists for major languages
            profanity_lists = {
                'en': ['badword1', 'badword2'],  # Placeholder - would use actual lists
                'ur': ['urdu_badword1', 'urdu_badword2'],
                'ar': ['arabic_badword1', 'arabic_badword2'],
                # Add more languages as needed
            }
            
            for lang_code, words in profanity_lists.items():
                self.profanity_filters[lang_code] = set(words)
            
            logger.info(f"Initialized profanity filters for {len(self.profanity_filters)} languages")
            
        except Exception as e:
            logger.warning(f"Could not initialize profanity filters: {e}")
    
    async def recognize_speech(self, request: SpeechRecognitionRequest) -> SpeechRecognitionResponse:
        """
        Recognize speech from audio data
        """
        start_time = time.time()
        
        try:
            logger.info(f"Processing speech recognition for language: {request.language_code}")
            
            # Validate language support
            if request.language_code not in FSI_LANGUAGES:
                raise ValueError(f"Language {request.language_code} not supported")
            
            # Preprocess audio
            processed_audio, audio_info = await self._preprocess_audio(request.audio_data)
            
            # Choose appropriate model
            model_key = await self._select_optimal_model(request.language_code, audio_info)
            
            # Perform recognition
            transcription_result = await self._perform_recognition(
                processed_audio, 
                request.language_code, 
                model_key,
                request.return_alternatives
            )
            
            # Post-process results
            final_result = await self._postprocess_transcription(
                transcription_result,
                request.language_code,
                request.enable_profanity_filter,
                request.enable_automatic_punctuation
            )
            
            # Calculate metrics
            processing_time = time.time() - start_time
            audio_duration = len(processed_audio) / audio_info['sample_rate']
            
            # Create response
            response = SpeechRecognitionResponse(
                transcript=final_result['transcript'],
                confidence=final_result['confidence'],
                language_detected=request.language_code,
                language_confidence=final_result.get('language_confidence', 0.95),
                alternatives=final_result.get('alternatives'),
                processing_time=processing_time,
                audio_duration=audio_duration,
                word_count=len(final_result['transcript'].split()),
                speaking_rate=self._calculate_speaking_rate(final_result['transcript'], audio_duration),
                metadata={
                    'model_used': model_key,
                    'audio_sample_rate': audio_info['sample_rate'],
                    'audio_channels': audio_info['channels'],
                    'processing_speed_factor': audio_duration / processing_time if processing_time > 0 else 0
                }
            )
            
            # Update statistics
            await self._update_statistics(request.language_code, processing_time, True)
            
            return response
            
        except Exception as e:
            processing_time = time.time() - start_time
            await self._update_statistics(request.language_code, processing_time, False)
            logger.error(f"Speech recognition failed: {e}")
            raise
    
    async def _preprocess_audio(self, audio_data: bytes) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Preprocess audio data for recognition"""
        try:
            # Load audio using librosa
            audio_io = io.BytesIO(audio_data)
            audio, sample_rate = librosa.load(audio_io, sr=16000, mono=True)
            
            # Audio enhancement
            audio = await self.audio_processor.enhance_audio(audio, sample_rate)
            
            # Normalize audio
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio))
            
            audio_info = {
                'sample_rate': sample_rate,
                'duration': len(audio) / sample_rate,
                'channels': 1,
                'format': 'wav'
            }
            
            return audio, audio_info
            
        except Exception as e:
            logger.error(f"Audio preprocessing failed: {e}")
            raise
    
    async def _select_optimal_model(self, language_code: str, audio_info: Dict[str, Any]) -> str:
        """Select the optimal model for recognition based on language and audio characteristics"""
        try:
            # Check if we have a specialized model for this language
            if language_code in self.language_models:
                return f"specialized_{language_code}"
            
            # For tonal languages, use the large model for better accuracy
            lang_config = get_language_config(language_code)
            if lang_config.get('is_tonal', False):
                return 'large'
            
            # For short audio clips, use base model for speed
            if audio_info['duration'] < 10:
                return 'base'
            
            # For longer audio or complex languages, use large model
            if lang_config.get('fsi_category', 1) >= 4:
                return 'large'
            
            # Default to multilingual model
            return 'multilingual'
            
        except Exception as e:
            logger.warning(f"Model selection failed, using default: {e}")
            return 'base'
    
    async def _perform_recognition(
        self, 
        audio: np.ndarray, 
        language_code: str, 
        model_key: str, 
        return_alternatives: bool
    ) -> Dict[str, Any]:
        """Perform the actual speech recognition"""
        try:
            if model_key.startswith('specialized_'):
                # Use specialized language model
                lang = model_key.replace('specialized_', '')
                return await self._recognize_with_specialized_model(audio, lang, return_alternatives)
            else:
                # Use Whisper model
                return await self._recognize_with_whisper(audio, language_code, model_key, return_alternatives)
                
        except Exception as e:
            logger.error(f"Recognition failed with {model_key}: {e}")
            # Fallback to base Whisper model
            return await self._recognize_with_whisper(audio, language_code, 'base', return_alternatives)
    
    async def _recognize_with_whisper(
        self, 
        audio: np.ndarray, 
        language_code: str, 
        model_key: str, 
        return_alternatives: bool
    ) -> Dict[str, Any]:
        """Recognize speech using Whisper model"""
        try:
            model = self.whisper_models[model_key]
            
            # Convert language code to Whisper format
            whisper_lang = self._convert_to_whisper_language(language_code)
            
            # Perform recognition
            result = model.transcribe(
                audio,
                language=whisper_lang,
                task="transcribe",
                fp16=torch.cuda.is_available(),
                beam_size=5 if return_alternatives else 1,
                best_of=5 if return_alternatives else 1,
                temperature=0.0,
                compression_ratio_threshold=2.4,
                logprob_threshold=-1.0,
                no_speech_threshold=0.6
            )
            
            # Extract primary transcription
            transcript = result["text"].strip()
            
            # Calculate confidence from segments
            confidence = self._calculate_confidence_from_segments(result.get("segments", []))
            
            response_data = {
                'transcript': transcript,
                'confidence': confidence,
                'language_confidence': 0.95,  # Whisper is generally confident about language
                'raw_result': result
            }
            
            # Add alternatives if requested
            if return_alternatives and "segments" in result:
                alternatives = self._extract_alternatives_from_segments(result["segments"])
                response_data['alternatives'] = alternatives
            
            return response_data
            
        except Exception as e:
            logger.error(f"Whisper recognition failed: {e}")
            raise
    
    async def _recognize_with_specialized_model(
        self, 
        audio: np.ndarray, 
        language_code: str, 
        return_alternatives: bool
    ) -> Dict[str, Any]:
        """Recognize speech using specialized language model"""
        try:
            model = self.language_models[language_code]
            
            # This would use the specialized model's API
            # Implementation depends on the specific model architecture
            # For now, fallback to Whisper
            return await self._recognize_with_whisper(audio, language_code, 'base', return_alternatives)
            
        except Exception as e:
            logger.error(f"Specialized model recognition failed: {e}")
            # Fallback to Whisper
            return await self._recognize_with_whisper(audio, language_code, 'base', return_alternatives)
    
    async def _postprocess_transcription(
        self,
        transcription_result: Dict[str, Any],
        language_code: str,
        enable_profanity_filter: bool,
        enable_automatic_punctuation: bool
    ) -> Dict[str, Any]:
        """Post-process transcription results"""
        try:
            transcript = transcription_result['transcript']
            
            # Apply punctuation if enabled
            if enable_automatic_punctuation and transcript:
                transcript = await self._add_punctuation(transcript, language_code)
            
            # Apply profanity filter if enabled
            if enable_profanity_filter and language_code in self.profanity_filters:
                transcript = self._filter_profanity(transcript, language_code)
            
            # Update the result
            result = transcription_result.copy()
            result['transcript'] = transcript
            
            return result
            
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            return transcription_result
    
    async def _add_punctuation(self, text: str, language_code: str) -> str:
        """Add automatic punctuation to text"""
        try:
            # Use the punctuation model
            if 'default' in self.punctuation_models:
                result = self.punctuation_models['default'](text)
                if result and len(result) > 0:
                    return result[0]['generated_text']
            
            return text
            
        except Exception as e:
            logger.warning(f"Punctuation addition failed: {e}")
            return text
    
    def _filter_profanity(self, text: str, language_code: str) -> str:
        """Filter profanity from text"""
        try:
            if language_code not in self.profanity_filters:
                return text
            
            profanity_words = self.profanity_filters[language_code]
            words = text.split()
            
            filtered_words = []
            for word in words:
                # Simple word replacement - could be made more sophisticated
                if word.lower() in profanity_words:
                    filtered_words.append('*' * len(word))
                else:
                    filtered_words.append(word)
            
            return ' '.join(filtered_words)
            
        except Exception as e:
            logger.warning(f"Profanity filtering failed: {e}")
            return text
    
    def _convert_to_whisper_language(self, language_code: str) -> str:
        """Convert FSI language code to Whisper language format"""
        whisper_mapping = {
            'ur': 'urdu',
            'ar': 'arabic',
            'zh-CN': 'chinese',
            'ja': 'japanese',
            'ko': 'korean',
            'hi': 'hindi',
            'ru': 'russian',
            'es': 'spanish',
            'fr': 'french',
            'de': 'german',
            'it': 'italian',
            'pt': 'portuguese',
            'th': 'thai',
            'vi': 'vietnamese',
            'he': 'hebrew',
            'fa': 'persian',
            'id': 'indonesian'
        }
        
        return whisper_mapping.get(language_code, 'english')
    
    def _calculate_confidence_from_segments(self, segments: List[Dict[str, Any]]) -> float:
        """Calculate overall confidence from segment-level probabilities"""
        if not segments:
            return 0.8  # Default confidence
        
        # Weight by segment duration
        total_duration = 0
        weighted_confidence = 0
        
        for segment in segments:
            duration = segment.get('end', 0) - segment.get('start', 0)
            confidence = segment.get('avg_logprob', -0.5)
            
            # Convert log probability to confidence score
            confidence_score = min(1.0, max(0.0, (confidence + 1.0)))
            
            weighted_confidence += confidence_score * duration
            total_duration += duration
        
        if total_duration > 0:
            return weighted_confidence / total_duration
        
        return 0.8
    
    def _extract_alternatives_from_segments(self, segments: List[Dict[str, Any]]) -> List[TranscriptionAlternative]:
        """Extract alternative transcriptions from segments"""
        alternatives = []
        
        try:
            # This is a simplified implementation
            # In practice, you would need to access beam search results or n-best lists
            for i, segment in enumerate(segments[:3]):  # Top 3 alternatives
                if 'text' in segment:
                    alternative = TranscriptionAlternative(
                        transcript=segment['text'].strip(),
                        confidence=self._calculate_confidence_from_segments([segment]),
                        words=None  # Could be extracted from token-level data
                    )
                    alternatives.append(alternative)
        
        except Exception as e:
            logger.warning(f"Could not extract alternatives: {e}")
        
        return alternatives
    
    def _calculate_speaking_rate(self, transcript: str, duration: float) -> Optional[float]:
        """Calculate speaking rate in words per minute"""
        if duration <= 0:
            return None
        
        word_count = len(transcript.split())
        return (word_count / duration) * 60
    
    async def _load_specialized_model(self, language_code: str, model_path: str):
        """Load a specialized ASR model for a specific language"""
        try:
            # This would load the actual specialized model
            # Implementation depends on the model format (HuggingFace, TensorFlow, etc.)
            logger.info(f"Loading specialized model for {language_code} from {model_path}")
            
            # Placeholder - return a dummy model reference
            return {"language": language_code, "model_path": model_path}
            
        except Exception as e:
            logger.error(f"Failed to load specialized model for {language_code}: {e}")
            raise
    
    async def _update_statistics(self, language_code: str, processing_time: float, success: bool):
        """Update processing statistics"""
        try:
            self.stats["total_requests"] += 1
            self.stats["total_processing_time"] += processing_time
            
            if success:
                self.stats["successful_requests"] += 1
            else:
                self.stats["failed_requests"] += 1
            
            # Update language usage
            if language_code not in self.stats["language_usage"]:
                self.stats["language_usage"][language_code] = 0
            self.stats["language_usage"][language_code] += 1
            
            # Cache statistics to Redis
            await self.redis_client.set(
                "speech_processor_stats",
                json.dumps(self.stats),
                ex=3600  # Cache for 1 hour
            )
            
        except Exception as e:
            logger.warning(f"Failed to update statistics: {e}")
    
    async def _load_statistics(self):
        """Load cached statistics from Redis"""
        try:
            cached_stats = await self.redis_client.get("speech_processor_stats")
            if cached_stats:
                self.stats.update(json.loads(cached_stats))
                logger.info("Loaded cached statistics")
        except Exception as e:
            logger.warning(f"Could not load cached statistics: {e}")
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        return self.stats.copy()
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            # Clear models from memory
            self.whisper_models.clear()
            self.language_models.clear()
            self.punctuation_models.clear()
            
            # Clear CUDA cache if using GPU
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("Speech processor cleanup completed")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")