class NLPModelManager:
    """Minimal NLP model manager."""

    def __init__(self):
        self.loaded_models = {}
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def cleanup(self) -> None:
        pass

    async def load_grammar_model(self, lang_code: str) -> None:
        self.loaded_models[lang_code] = "loaded"

    async def has_grammar_model(self, lang_code: str) -> bool:
        return lang_code in self.loaded_models

    async def has_analyzer_model(self, lang_code: str) -> bool:
        return False
