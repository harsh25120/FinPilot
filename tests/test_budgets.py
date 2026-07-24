from datetime import date

from tests.conftest import get_category_id


def test_create_budget(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    response = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "300.00",
            "period": "monthly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    assert response.json()["end_date"] == "2026-06-30"


def test_create_budget_for_income_category_fails(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Salary", "income")
    response = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "300.00",
            "period": "monthly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_create_overlapping_budget_fails(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    payload = {
        "category_id": category_id,
        "amount": "300.00",
        "period": "monthly",
        "start_date": "2026-06-01",
    }
    first = client.post("/api/v1/budgets", json=payload, headers=auth_headers)
    assert first.status_code == 201
    second = client.post("/api/v1/budgets", json=payload, headers=auth_headers)
    assert second.status_code == 400


def test_non_overlapping_budget_succeeds(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "300.00",
            "period": "monthly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "300.00",
            "period": "monthly",
            "start_date": "2026-07-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201


def test_weekly_budget_end_date(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Rent", "expense")
    response = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "100.00",
            "period": "weekly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["end_date"] == "2026-06-07"


def test_budget_status_tracks_spending(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    budget = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "100.00",
            "period": "monthly",
            "start_date": "2026-06-01",
            "alert_threshold": 0.5,
        },
        headers=auth_headers,
    ).json()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "60.00",
            "category_id": category_id,
            "transaction_date": "2026-06-05",
        },
        headers=auth_headers,
    )
    response = client.get(f"/api/v1/budgets/{budget['id']}/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["spent"] == "60.00"
    assert data["remaining"] == "40.00"
    assert data["percentage_used"] == 60.0
    assert data["is_alert"] is True
    assert data["is_exceeded"] is False


def test_budget_status_exceeded(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    budget = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "50.00",
            "period": "monthly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "75.00",
            "category_id": category_id,
            "transaction_date": "2026-06-05",
        },
        headers=auth_headers,
    )
    response = client.get(f"/api/v1/budgets/{budget['id']}/status", headers=auth_headers)
    assert response.json()["is_exceeded"] is True


def test_budget_alerts_endpoint(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Rent", "expense")
    today = date.today().replace(day=1)
    client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "50.00",
            "period": "monthly",
            "start_date": today.isoformat(),
            "alert_threshold": 0.5,
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "60.00",
            "category_id": category_id,
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/budgets/alerts", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_list_budgets_pagination(client, auth_headers):
    response = client.get("/api/v1/budgets", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "meta" in body


def test_delete_budget(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Utilities", "expense")
    budget = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category_id,
            "amount": "80.00",
            "period": "monthly",
            "start_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()
    response = client.delete(f"/api/v1/budgets/{budget['id']}", headers=auth_headers)
    assert response.status_code == 204


def test_get_nonexistent_budget(client, auth_headers):
    response = client.get("/api/v1/budgets/999999", headers=auth_headers)
    assert response.status_code == 404
