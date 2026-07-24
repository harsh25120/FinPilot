def test_register_success(client, test_user_payload):
    response = client.post("/api/v1/auth/register", json=test_user_payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


def test_register_duplicate_email(client, test_user_payload):
    client.post("/api/v1/auth/register", json=test_user_payload)
    response = client.post("/api/v1/auth/register", json=test_user_payload)
    assert response.status_code == 409


def test_register_weak_password_too_short(client, test_user_payload):
    payload = dict(test_user_payload, password="ab1")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_password_missing_digit(client, test_user_payload):
    payload = dict(test_user_payload, password="onlyletters")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_invalid_email(client, test_user_payload):
    payload = dict(test_user_payload, email="not-an-email")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_creates_default_categories(client, auth_headers):
    response = client.get("/api/v1/categories", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 16


def test_login_success(client, test_user_payload):
    client.post("/api/v1/auth/register", json=test_user_payload)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user_payload["email"], "password": test_user_payload["password"]},
    )
    assert response.status_code == 200, response.text
    assert "access_token" in response.json()


def test_login_wrong_password(client, test_user_payload):
    client.post("/api/v1/auth/register", json=test_user_payload)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": test_user_payload["email"], "password": "WrongPassword1"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login", data={"username": "nobody@example.com", "password": "whatever123"}
    )
    assert response.status_code == 401


def test_refresh_token_success(client, test_user_payload):
    reg = client.post("/api/v1/auth/register", json=test_user_payload)
    refresh_token = reg.json()["refresh_token"]
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200, response.text
    assert "access_token" in response.json()
    assert response.json()["refresh_token"] != refresh_token


def test_refresh_token_cannot_be_reused(client, test_user_payload):
    reg = client.post("/api/v1/auth/register", json=test_user_payload)
    refresh_token = reg.json()["refresh_token"]
    first = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert first.status_code == 200
    second = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert second.status_code == 401


def test_refresh_token_invalid(client):
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert response.status_code == 401


def test_logout_revokes_refresh_token(client, test_user_payload):
    reg = client.post("/api/v1/auth/register", json=test_user_payload)
    tokens = reg.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    logout_response = client.post(
        "/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}, headers=headers
    )
    assert logout_response.status_code == 204

    refresh_response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refresh_response.status_code == 401


def test_access_protected_route_without_token(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_access_protected_route_with_garbage_token(client):
    response = client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer not.a.valid.jwt"}
    )
    assert response.status_code == 401
