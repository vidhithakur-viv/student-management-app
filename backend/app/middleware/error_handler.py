import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

logger = logging.getLogger("app")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        errors = [
            {
                "field": ".".join(str(p) for p in e["loc"] if p not in ("body", "query")),
                "message": e["msg"].removeprefix("Value error, "),
            }
            for e in exc.errors()
        ]
        summary = "; ".join(f"{e['field']}: {e['message']}" for e in errors)
        return JSONResponse(status_code=422, content={"detail": summary, "errors": errors})

    @app.exception_handler(PyMongoError)
    async def mongo_handler(request: Request, exc: PyMongoError):
        logger.exception("Database error")
        return JSONResponse(status_code=503, content={"detail": "Database unavailable"})
