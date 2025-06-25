from fastapi import FastAPI

from src.api.middleware import setup_middleware
from src.api.error_handlers import setup_error_handlers

from .service_init import lifespan
from .routes import router

app = FastAPI(
    title="Translation Service",
    description="Multi-language neural machine translation for FSI eLearning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

setup_middleware(app)
setup_error_handlers(app)
app.include_router(router)
