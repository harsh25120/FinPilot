def test_default_categories_created_on_register(client, auth_headers):
    response = client.get("/api/v1/categories", headers=auth_headers)
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) == 16
    assert any(c["name"] == "Salary" for c in categories)
    assert any(c["name"] == "Groceries" for c in categories)


def test_create_category(client, auth_headers):
    response = client.post(
        "/api/v1/categories",
        json={"name": "Side Hustle", "type": "income", "icon": "star", "color": "#FFAA00"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Side Hustle"
    assert data["type"] == "income"
    assert data["is_default"] is False


def test_create_category_invalid_color(client, auth_headers):
    response = client.post(
        "/api/v1/categories",
        json={"name": "Bad Color", "type": "expense", "color": "not-a-hex-color"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_create_duplicate_category_name_and_type_fails(client, auth_headers):
    payload = {"name": "Side Hustle", "type": "income"}
    first = client.post("/api/v1/categories", json=payload, headers=auth_headers)
    assert first.status_code == 201
    second = client.post("/api/v1/categories", json=payload, headers=auth_headers)
    assert second.status_code == 409


def test_same_name_different_type_is_allowed(client, auth_headers):
    client.post("/api/v1/categories", json={"name": "Misc", "type": "income"}, headers=auth_headers)
    response = client.post(
        "/api/v1/categories", json={"name": "Misc", "type": "expense"}, headers=auth_headers
    )
    assert response.status_code == 201


def test_filter_categories_by_type(client, auth_headers):
    response = client.get("/api/v1/categories?type=expense", headers=auth_headers)
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) > 0
    assert all(c["type"] == "expense" for c in categories)


def test_search_categories_by_name(client, auth_headers):
    response = client.get("/api/v1/categories?search=groc", headers=auth_headers)
    assert response.status_code == 200
    assert any(c["name"] == "Groceries" for c in response.json())


def test_update_category(client, auth_headers):
    create = client.post(
        "/api/v1/categories", json={"name": "Gadgets", "type": "expense"}, headers=auth_headers
    )
    category_id = create.json()["id"]
    response = client.put(
        f"/api/v1/categories/{category_id}", json={"name": "Tech Gadgets"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Tech Gadgets"


def test_delete_category(client, auth_headers):
    create = client.post(
        "/api/v1/categories", json={"name": "Temp Category", "type": "expense"}, headers=auth_headers
    )
    category_id = create.json()["id"]
    response = client.delete(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert response.status_code == 204

    follow_up = client.get(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert follow_up.status_code == 404


def test_delete_category_with_transactions_fails(client, auth_headers):
    create = client.post(
        "/api/v1/categories", json={"name": "In Use Category", "type": "expense"}, headers=auth_headers
    )
    category_id = create.json()["id"]
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "10.00",
            "category_id": category_id,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.delete(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert response.status_code == 400


def test_get_nonexistent_category(client, auth_headers):
    response = client.get("/api/v1/categories/999999", headers=auth_headers)
    assert response.status_code == 404


def test_categories_are_isolated_per_user(client, auth_headers):
    other_user = {
        "email": "otheruser@example.com",
        "password": "OtherPass123",
        "full_name": "Other User",
    }
    other_register = client.post("/api/v1/auth/register", json=other_user)
    other_headers = {"Authorization": f"Bearer {other_register.json()['access_token']}"}

    created = client.post(
        "/api/v1/categories", json={"name": "Only Mine", "type": "expense"}, headers=other_headers
    )
    category_id = created.json()["id"]

    response = client.get(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert response.status_code == 404
