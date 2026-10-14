from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.mongodb import close_db, create_indexes
from app.middleware.error_handler import register_error_handlers
from app.routes import auth, students


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        create_indexes()
    except Exception as exc:  # keep API up so /docs works; DB requests will return 503
        print(f"WARNING: could not create MongoDB indexes: {exc}")
    yield
    close_db()


app = FastAPI(title="Student Management API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # native apps are not subject to CORS; this only helps browser tools
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
