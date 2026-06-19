from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_login_accepts_json_body_like_frontend():
    email = "audit-login@example.com"
    password = "Secret123!"

    register_res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert register_res.status_code in (200, 400)

    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200, login_res.text
    body = login_res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_accepts_oauth2_form_for_swagger():
    email = "audit-login-form@example.com"
    password = "Secret123!"

    register_res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert register_res.status_code in (200, 400)

    login_res = client.post(
        "/api/auth/login",
        data={"username": email, "password": password}
    )

    assert login_res.status_code == 200, login_res.text
    body = login_res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
