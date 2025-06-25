from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse


def setup_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
