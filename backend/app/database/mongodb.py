from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

from app.config.settings import get_settings

_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """Return the application database (lazily connected)."""
    global _client, _db
    if _db is None:
        settings = get_settings()
        _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        # Database name comes from the URI path (.../student_management)
        _db = _client.get_default_database(default="student_management")
    return _db


def set_db(db: Database) -> None:
    """Override the database (used by tests)."""
    global _db
    _db = db


def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


def create_indexes(db: Database | None = None) -> None:
    db = db if db is not None else get_db()
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.students.create_index([("email", ASCENDING)], unique=True)
    db.students.create_index([("name", ASCENDING)])
    db.students.create_index([("course", ASCENDING)])
