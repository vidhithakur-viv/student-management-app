import pytest

BAD_ID = "64b7f0f2a1b2c3d4e5f60718"


def create(client, headers, payload):
    r = client.post("/api/students", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ---- unauthorized -------------------------------------------------------
@pytest.mark.parametrize(
    "method,url",
    [
        ("get", "/api/students"),
        ("get", "/api/students/search?query=a"),
        ("get", f"/api/students/{BAD_ID}"),
        ("post", "/api/students"),
        ("put", f"/api/students/{BAD_ID}"),
        ("delete", f"/api/students/{BAD_ID}"),
    ],
)
def test_unauthorized_requests(client, method, url):
    assert getattr(client, method)(url).status_code == 401


# ---- create -------------------------------------------------------------
def test_create_student(client, admin_headers, student_payload):
    s = create(client, admin_headers, student_payload)
    assert s["id"] and s["name"] == "Asha Verma"
    assert s["createdAt"] and s["updatedAt"]


def test_create_duplicate_email(client, admin_headers, student_payload):
    create(client, admin_headers, student_payload)
    r = client.post("/api/students", json=student_payload, headers=admin_headers)
    assert r.status_code == 409


@pytest.mark.parametrize(
    "field,value",
    [
        ("name", ""),
        ("name", "   "),
        ("email", "bad-email"),
        ("phone", "abc"),
        ("age", 2),
        ("age", "twenty"),
        ("course", ""),
        ("year", 0),
        ("year", 99),
    ],
)
def test_validation_errors(client, admin_headers, student_payload, field, value):
    student_payload[field] = value
    r = client.post("/api/students", json=student_payload, headers=admin_headers)
    assert r.status_code == 422
    body = r.json()
    assert body["errors"][0]["field"] == field


def test_missing_fields(client, admin_headers):
    r = client.post("/api/students", json={}, headers=admin_headers)
    assert r.status_code == 422
    assert len(r.json()["errors"]) == 6


# ---- read ---------------------------------------------------------------
def test_get_students_and_one(client, admin_headers, student_payload):
    s = create(client, admin_headers, student_payload)
    r = client.get("/api/students", headers=admin_headers)
    assert r.status_code == 200 and len(r.json()) == 1
    r = client.get(f"/api/students/{s['id']}", headers=admin_headers)
    assert r.status_code == 200 and r.json()["email"] == "asha@example.com"


def test_get_empty_list(client, admin_headers):
    r = client.get("/api/students", headers=admin_headers)
    assert r.status_code == 200 and r.json() == []


def test_get_invalid_student(client, admin_headers):
    assert client.get(f"/api/students/{BAD_ID}", headers=admin_headers).status_code == 404
    assert client.get("/api/students/not-an-object-id", headers=admin_headers).status_code == 404


# ---- update -------------------------------------------------------------
def test_update_student(client, faculty_headers, student_payload):
    s = create(client, faculty_headers, student_payload)
    student_payload.update(name="Asha V", year=3)
    r = client.put(f"/api/students/{s['id']}", json=student_payload, headers=faculty_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Asha V" and r.json()["year"] == 3
    assert r.json()["createdAt"] == s["createdAt"]


def test_update_missing_student(client, admin_headers, student_payload):
    r = client.put(f"/api/students/{BAD_ID}", json=student_payload, headers=admin_headers)
    assert r.status_code == 404


def test_update_validation(client, admin_headers, student_payload):
    s = create(client, admin_headers, student_payload)
    student_payload["age"] = 500
    r = client.put(f"/api/students/{s['id']}", json=student_payload, headers=admin_headers)
    assert r.status_code == 422


# ---- delete / roles -----------------------------------------------------
def test_admin_can_delete(client, admin_headers, student_payload):
    s = create(client, admin_headers, student_payload)
    assert client.delete(f"/api/students/{s['id']}", headers=admin_headers).status_code == 204
    assert client.get(f"/api/students/{s['id']}", headers=admin_headers).status_code == 404


def test_faculty_cannot_delete(client, admin_headers, faculty_headers, student_payload):
    s = create(client, admin_headers, student_payload)
    r = client.delete(f"/api/students/{s['id']}", headers=faculty_headers)
    assert r.status_code == 403
    assert client.get(f"/api/students/{s['id']}", headers=admin_headers).status_code == 200


def test_delete_missing_student(client, admin_headers):
    assert client.delete(f"/api/students/{BAD_ID}", headers=admin_headers).status_code == 404


def test_faculty_can_create_read_update(client, faculty_headers, student_payload):
    s = create(client, faculty_headers, student_payload)
    assert client.get("/api/students", headers=faculty_headers).status_code == 200
    assert client.put(
        f"/api/students/{s['id']}", json=student_payload, headers=faculty_headers
    ).status_code == 200


# ---- search -------------------------------------------------------------
def test_search(client, admin_headers, student_payload):
    create(client, admin_headers, student_payload)
    create(
        client,
        admin_headers,
        {**student_payload, "name": "Ravi Kumar", "email": "ravi@example.com", "course": "Physics"},
    )
    by_name = client.get("/api/students/search?query=asha", headers=admin_headers).json()
    assert [s["name"] for s in by_name] == ["Asha Verma"]
    by_course = client.get("/api/students/search?query=PHYS", headers=admin_headers).json()
    assert [s["name"] for s in by_course] == ["Ravi Kumar"]
    by_email = client.get("/api/students/search?query=ravi@", headers=admin_headers).json()
    assert len(by_email) == 1
    assert client.get("/api/students/search?query=zzz", headers=admin_headers).json() == []
    # regex characters are escaped, not interpreted
    assert client.get("/api/students/search?query=.*", headers=admin_headers).json() == []
    # empty query returns everything
    assert len(client.get("/api/students/search", headers=admin_headers).json()) == 2
