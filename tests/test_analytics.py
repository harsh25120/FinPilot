from datetime import date

from tests.conftest import get_category_id


def test_spending_by_category(client, auth_headers):
    groceries_id = get_category_id(client, auth_headers, "Groceries", "expense")
    today = date.today().isoformat()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "120.00",
            "category_id": groceries_id,
            "transaction_date": today,
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/analytics/spending-by-category", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_spent"]) >= 120.0
    assert any(b["category_name"] == "Groceries" for b in data["breakdown"])


def test_spending_by_category_custom_range(client, auth_headers):
    response = client.get(
        "/api/v1/analytics/spending-by-category?start_date=2020-01-01&end_date=2020-12-31",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["total_spent"] == "0.00"


def test_income_vs_expense(client, auth_headers):
    response = client.get("/api/v1/analytics/income-vs-expense?months=4", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["points"]) == 4


def test_savings_rate(client, auth_headers):
    response = client.get("/api/v1/analytics/savings-rate?months=3", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "average_savings_rate" in data
    assert len(data["points"]) == 3


def test_trends_endpoint(client, auth_headers):
    groceries_id = get_category_id(client, auth_headers, "Groceries", "expense")
    today = date.today().isoformat()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "80.00",
            "category_id": groceries_id,
            "transaction_date": today,
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/analytics/trends", headers=auth_headers)
    assert response.status_code == 200
    assert "trends" in response.json()
