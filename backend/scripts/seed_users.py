"""Create the initial admin and faculty users.

Usage (from backend/):  python -m scripts.seed_users
"""
from app.database.mongodb import create_indexes, get_db
from app.services.auth_service import create_user

USERS = [
    ("Admin User", "admin@example.com", "Admin@123", "admin"),
    ("Faculty User", "faculty@example.com", "Faculty@123", "faculty"),
]


def main() -> None:
    db = get_db()
    create_indexes(db)
    for name, email, password, role in USERS:
        if db.users.find_one({"email": email}):
            print(f"exists : {email}")
            continue
        create_user(db, name, email, password, role)
        print(f"created: {email} / {password} ({role})")


if __name__ == "__main__":
    main()
