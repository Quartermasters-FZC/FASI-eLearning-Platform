import sys
import types
from pathlib import Path
import importlib

# Ensure service src directory is on path
SERVICE_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVICE_ROOT))

# Stub heavy external dependencies if they are missing
for mod_name in [
    "numpy",
    "torch",
    "whisper",
    "librosa",
    "soundfile",
    "transformers",
    "redis",
    "structlog",
    "pydantic",
]:
    if mod_name not in sys.modules:
        sys.modules[mod_name] = types.ModuleType(mod_name)

# Minimal numpy replacement
np = sys.modules["numpy"]
if not hasattr(np, "ndarray"):
    class ndarray(list):
        pass
    np.ndarray = ndarray

# Basic pydantic replacements
pyd = sys.modules["pydantic"]
if not hasattr(pyd, "BaseModel"):
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    def Field(*args, **kwargs):
        return None

    def validator(*args, **kwargs):
        def wrapper(fn):
            return fn
        return wrapper

    pyd.BaseModel = BaseModel
    pyd.Field = Field
    pyd.validator = validator

# Minimal functionality for specific stubs
import types as _types

# torch cuda availability
torch = sys.modules["torch"]
if not hasattr(torch, "cuda"):
    torch.cuda = _types.SimpleNamespace(is_available=lambda: False)

# redis client stub
class DummyRedis:
    async def set(self, *args, **kwargs):
        pass
    async def get(self, *args, **kwargs):
        return None
sys.modules["redis"].Redis = DummyRedis

# structlog stub
structlog = sys.modules["structlog"]
structlog.get_logger = lambda *a, **k: _types.SimpleNamespace(
    info=lambda *a, **k: None,
    warning=lambda *a, **k: None,
    error=lambda *a, **k: None,
)

# transformers pipeline stub
transformers = sys.modules["transformers"]
transformers.pipeline = lambda *a, **k: (lambda text: [{"generated_text": text}])
transformers.AutoTokenizer = object
transformers.AutoModelForSeq2SeqLM = object

# Provide missing internal utilities
mm_mod = types.ModuleType("src.utils.model_manager")
class ModelManager:
    async def get_language_model_info(self, lang):
        return {}
mm_mod.ModelManager = ModelManager
sys.modules["src.utils.model_manager"] = mm_mod

ap_mod = types.ModuleType("src.utils.audio_processor")
class AudioProcessor:
    async def enhance_audio(self, audio, sr):
        return audio
ap_mod.AudioProcessor = AudioProcessor
sys.modules["src.utils.audio_processor"] = ap_mod

# Minimal language configuration
lang_mod = types.ModuleType("src.utils.language_config")
lang_mod.FSI_LANGUAGES = {"en": {"fsi_category": 1, "is_tonal": False}}
def get_language_config(code):
    return lang_mod.FSI_LANGUAGES.get(code)
lang_mod.get_language_config = get_language_config
sys.modules["src.utils.language_config"] = lang_mod

# Import target module
speech_module = importlib.import_module("src.services.speech_processor")
SpeechProcessor = speech_module.SpeechProcessor


async def create_processor():
    return SpeechProcessor(ModelManager(), DummyRedis())


def test_convert_to_whisper_language():
    sp = SpeechProcessor(ModelManager(), DummyRedis())
    assert sp._convert_to_whisper_language("ur") == "urdu"
    assert sp._convert_to_whisper_language("es") == "spanish"
    assert sp._convert_to_whisper_language("xx") == "english"


def test_calculate_confidence_from_segments():
    sp = SpeechProcessor(ModelManager(), DummyRedis())
    segments = [
        {"start": 0, "end": 1, "avg_logprob": -0.2},
        {"start": 1, "end": 3, "avg_logprob": -0.8},
    ]
    conf = sp._calculate_confidence_from_segments(segments)
    assert round(conf, 2) == 0.40


def test_calculate_speaking_rate():
    sp = SpeechProcessor(ModelManager(), DummyRedis())
    assert sp._calculate_speaking_rate("hello world", 1.0) == 120.0
    assert sp._calculate_speaking_rate("hi", 0) is None
