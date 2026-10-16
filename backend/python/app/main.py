import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import ServiceError

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Portfolio AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://[\w.-]+\.vercel\.app",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(api_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "portfolio-ai", "health": "/api/health", "docs": "/docs"}


@app.exception_handler(ServiceError)
async def service_error_handler(_: Request, exc: ServiceError) -> JSONResponse:
    if exc.__cause__ is not None:
        logging.getLogger(__name__).warning("%s", exc.__cause__)
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, __: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": "Send a short message the assistant can read."},
    )
