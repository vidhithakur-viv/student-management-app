"""MongoDB document shapes (PyMongo stores plain dicts; shapes documented here).

students collection
  _id: ObjectId, name, email (unique, lowercase), phone, age (int), course,
  year (int), createdAt (UTC datetime), updatedAt (UTC datetime)

users collection
  _id: ObjectId, name, email (unique, lowercase), password_hash (bcrypt),
  role ("admin" | "faculty"), createdAt (UTC datetime)
"""
from datetime import datetime
from typing import TypedDict

from bson import ObjectId


class StudentDoc(TypedDict):
    _id: ObjectId
    name: str
    email: str
    phone: str
    age: int
    course: str
    year: int
    createdAt: datetime
    updatedAt: datetime
