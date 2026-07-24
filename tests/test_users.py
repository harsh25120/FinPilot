def test_get_profile(client, auth_headers, test_user_payload):
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_payload["email"]
    assert data["full_name"] == test_user_payload["full_name"]
    assert data["monthly_income"] == "5000.00"
    assert data["preferred_currency"] == "USD"
    assert data["is_active"] is True


def test_update_profile(client, auth_headers):
    response = client.put(
        "/api/v1/users/me",
        json={"full_name": "Updated Name", "monthly_income": "6000.00", "preferred_currency": "eur"},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["monthly_income"] == "6000.00"
    assert data["preferred_currency"] == "EUR"


def test_update_profile_partial(client, auth_headers):
    response = client.put(
        "/api/v1/users/me", json={"full_name": "Only Name Changed"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Only Name Changed"
    assert response.json()["monthly_income"] == "5000.00"


def test_change_password_success(client, auth_headers, test_user_payload):
    response = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": test_user_payload["password"], "new_password": "NewStrongPass123"},
        headers=auth_headers,
    )
    assert response.status_code == 204

    login = client.post(
        "/api/v1/auth/login",
        data={"username": test_user_payload["email"], "password": "NewStrongPass123"},
    )
    assert login.status_code == 200


def test_change_password_wrong_current(client, auth_headers):
    response = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "WrongOne123", "new_password": "NewStrongPass123"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_deactivate_account(client, auth_headers):
    response = client.delete("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 204

    follow_up = client.get("/api/v1/users/me", headers=auth_headers)
    assert follow_up.status_code == 403
