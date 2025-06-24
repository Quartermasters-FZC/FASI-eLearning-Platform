"""
Speech Recognition Data Models
AI-Powered eLearning Platform - Quartermasters FZC

Pydantic models for speech recognition, pronunciation analysis, and language detection
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
import base64


class AudioFormat(str, Enum):
    """Supported audio formats"""
    WAV = "wav"
    MP3 = "mp3"
    FLAC = "flac"
    OGG = "ogg"
    AAC = "aac"
    WEBM = "webm"


class FSILevel(str, Enum):
    """FSI Proficiency Levels"""
    LEVEL_0 = "0"
    LEVEL_0_PLUS = "0+"
    LEVEL_1 = "1"
    LEVEL_1_PLUS = "1+"
    LEVEL_2 = "2"
    LEVEL_2_PLUS = "2+"
    LEVEL_3 = "3"
    LEVEL_3_PLUS = "3+"
    LEVEL_4 = "4"
    LEVEL_4_PLUS = "4+"
    LEVEL_5 = "5"


class SkillType(str, Enum):
    """Language skill types"""
    SPEAKING = "speaking"
    LISTENING = "listening"
    READING = "reading"
    WRITING = "writing"


class PronunciationQuality(str, Enum):
    """Pronunciation quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    VERY_POOR = "very_poor"


# =================================================================
# REQUEST MODELS
# =================================================================

class SpeechRecognitionRequest(BaseModel):
    """Request model for speech recognition"""
    audio_data: bytes = Field(..., description="Audio data in bytes")
    language_code: str = Field(..., description="Language code (e.g., 'en', 'ur', 'ar')")
    return_alternatives: bool = Field(default=False, description="Return alternative transcriptions")
    enable_profanity_filter: bool = Field(default=True, description="Filter profanity from results")
    enable_automatic_punctuation: bool = Field(default=True, description="Add automatic punctuation")
    model_variant: Optional[str] = Field(default=None, description="Specific model variant to use")
    
    class Config:
        arbitrary_types_allowed = True


class PronunciationAnalysisRequest(BaseModel):
    """Request model for pronunciation analysis"""
    audio_data: bytes = Field(..., description="Audio data in bytes")
    reference_text: str = Field(..., description="Reference text for comparison")
    language_code: str = Field(..., description="Language code")
    fsi_level: Optional[float] = Field(default=None, description="Expected FSI proficiency level")
    focus_phonemes: Optional[List[str]] = Field(default=None, description="Specific phonemes to analyze")
    detailed_analysis: bool = Field(default=True, description="Include detailed phoneme analysis")
    
    class Config:
        arbitrary_types_allowed = True
    
    @validator('fsi_level')
    def validate_fsi_level(cls, v):
        if v is not None and (v < 0 or v > 5):
            raise ValueError('FSI level must be between 0 and 5')
        return v


class LanguageDetectionRequest(BaseModel):
    """Request model for language detection"""
    audio_data: bytes = Field(..., description="Audio data in bytes")
    return_probabilities: bool = Field(default=False, description="Return probability scores for all languages")
    candidate_languages: Optional[List[str]] = Field(default=None, description="Limit detection to specific languages")
    
    class Config:
        arbitrary_types_allowed = True


# =================================================================
# RESPONSE MODELS
# =================================================================

class TranscriptionAlternative(BaseModel):
    """Alternative transcription with confidence score"""
    transcript: str = Field(..., description="Alternative transcription text")
    confidence: float = Field(..., description="Confidence score (0.0 - 1.0)")
    words: Optional[List[Dict[str, Any]]] = Field(default=None, description="Word-level details")


class SpeechRecognitionResponse(BaseModel):
    """Response model for speech recognition"""
    transcript: str = Field(..., description="Primary transcription result")
    confidence: float = Field(..., description="Overall confidence score (0.0 - 1.0)")
    language_detected: str = Field(..., description="Detected language code")
    language_confidence: float = Field(..., description="Language detection confidence")
    alternatives: Optional[List[TranscriptionAlternative]] = Field(default=None, description="Alternative transcriptions")
    processing_time: float = Field(..., description="Processing time in seconds")
    audio_duration: float = Field(..., description="Audio duration in seconds")
    word_count: int = Field(..., description="Number of words in transcript")
    speaking_rate: Optional[float] = Field(default=None, description="Words per minute")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('confidence', 'language_confidence')
    def validate_confidence(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Confidence must be between 0 and 1')
        return v


class PhonemeAnalysis(BaseModel):
    """Analysis of individual phoneme pronunciation"""
    phoneme: str = Field(..., description="Phoneme symbol")
    expected: str = Field(..., description="Expected pronunciation")
    actual: str = Field(..., description="Actual pronunciation detected")
    accuracy_score: float = Field(..., description="Accuracy score (0.0 - 1.0)")
    feedback: str = Field(..., description="Specific feedback for this phoneme")
    is_critical: bool = Field(default=False, description="Whether this phoneme is critical for meaning")
    
    @validator('accuracy_score')
    def validate_accuracy(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Accuracy score must be between 0 and 1')
        return v


class WordAnalysis(BaseModel):
    """Analysis of individual word pronunciation"""
    word: str = Field(..., description="The word being analyzed")
    start_time: float = Field(..., description="Start time in audio (seconds)")
    end_time: float = Field(..., description="End time in audio (seconds)")
    accuracy_score: float = Field(..., description="Word-level accuracy score")
    stress_pattern: Optional[str] = Field(default=None, description="Stress pattern analysis")
    phonemes: List[PhonemeAnalysis] = Field(default_factory=list, description="Phoneme-level analysis")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
    
    @validator('accuracy_score')
    def validate_accuracy(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Accuracy score must be between 0 and 1')
        return v


class PronunciationAnalysisResponse(BaseModel):
    """Response model for pronunciation analysis"""
    overall_score: float = Field(..., description="Overall pronunciation score (0.0 - 1.0)")
    fsi_estimated_level: float = Field(..., description="Estimated FSI proficiency level")
    quality_rating: PronunciationQuality = Field(..., description="Overall quality rating")
    fluency_score: float = Field(..., description="Fluency score (0.0 - 1.0)")
    rhythm_score: float = Field(..., description="Rhythm and timing score (0.0 - 1.0)")
    intonation_score: float = Field(..., description="Intonation score (0.0 - 1.0)")
    clarity_score: float = Field(..., description="Clarity score (0.0 - 1.0)")
    
    # Detailed analysis
    words: List[WordAnalysis] = Field(default_factory=list, description="Word-by-word analysis")
    common_errors: List[str] = Field(default_factory=list, description="Common pronunciation errors identified")
    strengths: List[str] = Field(default_factory=list, description="Pronunciation strengths")
    improvement_suggestions: List[str] = Field(default_factory=list, description="Specific improvement suggestions")
    
    # Metrics
    words_per_minute: float = Field(..., description="Speaking rate in words per minute")
    pause_frequency: float = Field(..., description="Frequency of pauses per minute")
    average_pause_duration: float = Field(..., description="Average pause duration in seconds")
    
    # Cultural and contextual analysis
    cultural_appropriateness: Optional[float] = Field(default=None, description="Cultural appropriateness score")
    register_appropriateness: Optional[str] = Field(default=None, description="Register/formality level appropriateness")
    
    # Processing metadata
    processing_time: float = Field(..., description="Analysis processing time in seconds")
    audio_duration: float = Field(..., description="Audio duration in seconds")
    model_version: str = Field(..., description="Analysis model version used")
    language_code: str = Field(..., description="Language analyzed")
    
    @validator('overall_score', 'fluency_score', 'rhythm_score', 'intonation_score', 'clarity_score')
    def validate_scores(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Scores must be between 0 and 1')
        return v
    
    @validator('fsi_estimated_level')
    def validate_fsi_level(cls, v):
        if not 0 <= v <= 5:
            raise ValueError('FSI level must be between 0 and 5')
        return v


class LanguageProbability(BaseModel):
    """Language detection probability"""
    language_code: str = Field(..., description="Language code")
    language_name: str = Field(..., description="Language name in English")
    native_name: str = Field(..., description="Language name in native script")
    probability: float = Field(..., description="Detection probability (0.0 - 1.0)")
    fsi_category: int = Field(..., description="FSI difficulty category (1-5)")
    
    @validator('probability')
    def validate_probability(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Probability must be between 0 and 1')
        return v


class LanguageDetectionResponse(BaseModel):
    """Response model for language detection"""
    language_code: str = Field(..., description="Most likely language code")
    confidence: float = Field(..., description="Detection confidence (0.0 - 1.0)")
    language_name: str = Field(..., description="Language name in English")
    native_name: str = Field(..., description="Language name in native script")
    fsi_category: int = Field(..., description="FSI difficulty category")
    script_type: str = Field(..., description="Writing script type")
    is_tonal: bool = Field(..., description="Whether language is tonal")
    
    # Detailed probabilities (if requested)
    all_probabilities: Optional[List[LanguageProbability]] = Field(default=None, description="All language probabilities")
    
    # Processing metadata
    processing_time: float = Field(..., description="Detection processing time in seconds")
    audio_duration: float = Field(..., description="Audio duration in seconds")
    model_version: str = Field(..., description="Detection model version")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Confidence must be between 0 and 1')
        return v


class AudioProcessingResponse(BaseModel):
    """Response model for audio processing"""
    processed_audio: str = Field(..., description="Base64 encoded processed audio")
    original_format: str = Field(..., description="Original audio format")
    processed_format: str = Field(..., description="Processed audio format")
    sample_rate: int = Field(..., description="Audio sample rate")
    duration: float = Field(..., description="Audio duration in seconds")
    channels: int = Field(..., description="Number of audio channels")
    
    # Processing applied
    noise_reduction_applied: bool = Field(..., description="Whether noise reduction was applied")
    volume_normalized: bool = Field(..., description="Whether volume was normalized")
    silence_trimmed: bool = Field(..., description="Whether silence was trimmed")
    
    # Quality metrics
    signal_to_noise_ratio: Optional[float] = Field(default=None, description="Signal-to-noise ratio in dB")
    dynamic_range: Optional[float] = Field(default=None, description="Dynamic range in dB")
    peak_amplitude: float = Field(..., description="Peak amplitude level")
    rms_amplitude: float = Field(..., description="RMS amplitude level")
    
    # Processing metadata
    processing_time: float = Field(..., description="Processing time in seconds")
    file_size_original: int = Field(..., description="Original file size in bytes")
    file_size_processed: int = Field(..., description="Processed file size in bytes")


# =================================================================
# ERROR MODELS
# =================================================================

class SpeechServiceError(BaseModel):
    """Error response model"""
    error_code: str = Field(..., description="Error code identifier")
    error_message: str = Field(..., description="Human-readable error message")
    error_details: Dict[str, Any] = Field(default_factory=dict, description="Additional error details")
    timestamp: float = Field(..., description="Error timestamp")
    request_id: Optional[str] = Field(default=None, description="Request identifier for tracking")


# =================================================================
# BATCH PROCESSING MODELS
# =================================================================

class BatchSpeechRecognitionRequest(BaseModel):
    """Request model for batch speech recognition"""
    audio_files: List[str] = Field(..., description="List of base64 encoded audio files")
    language_code: str = Field(..., description="Language code for all files")
    callback_url: Optional[str] = Field(default=None, description="Webhook URL for results")
    priority: str = Field(default="normal", description="Processing priority (low, normal, high)")


class BatchProcessingStatus(BaseModel):
    """Batch processing status"""
    batch_id: str = Field(..., description="Batch processing identifier")
    status: str = Field(..., description="Processing status")
    total_files: int = Field(..., description="Total number of files")
    completed_files: int = Field(..., description="Number of completed files")
    failed_files: int = Field(..., description="Number of failed files")
    estimated_completion: Optional[float] = Field(default=None, description="Estimated completion time")
    created_at: float = Field(..., description="Batch creation timestamp")
    updated_at: float = Field(..., description="Last update timestamp")


# =================================================================
# ANALYTICS MODELS
# =================================================================

class UsageAnalytics(BaseModel):
    """Usage analytics data"""
    total_requests: int = Field(..., description="Total number of requests")
    successful_requests: int = Field(..., description="Number of successful requests")
    failed_requests: int = Field(..., description="Number of failed requests")
    average_processing_time: float = Field(..., description="Average processing time in seconds")
    most_used_languages: List[str] = Field(..., description="Most frequently used languages")
    total_audio_processed: float = Field(..., description="Total audio duration processed in hours")
    peak_usage_hours: List[int] = Field(..., description="Peak usage hours (0-23)")
    
    # Performance metrics
    average_accuracy_score: float = Field(..., description="Average pronunciation accuracy score")
    model_performance: Dict[str, float] = Field(..., description="Performance metrics by model")
    
    # Time period
    period_start: float = Field(..., description="Analytics period start timestamp")
    period_end: float = Field(..., description="Analytics period end timestamp")