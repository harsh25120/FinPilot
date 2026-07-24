from datetime import date

from tests.conftest import get_category_id


def test_dashboard_overview_empty_state(client, auth_headers):
    response = client.get("/api/v1/dashboard/overview", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == "0.00"
    assert data["total_expense"] == "0.00"
    assert data["budget_alerts_count"] == 0


def test_dashboard_overview_with_data(client, auth_headers):
    salary_id = get_category_id(client, auth_headers, "Salary", "income")
    today = date.today().isoformat()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": "3000.00",
            "category_id": salary_id,
            "transaction_date": today,
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/dashboard/overview", headers=auth_headers)
    data = response.json()
    assert float(data["total_income"]) >= 3000.0
    assert len(data["recent_transactions"]) >= 1


def test_dashboard_overview_top_categories(client, auth_headers):
    groceries_id = get_category_id(client, auth_headers, "Groceries", "expense")
    today = date.today().isoformat()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "150.00",
            "category_id": groceries_id,
            "transaction_date": today,
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/dashboard/overview", headers=auth_headers)
    data = response.json()
    assert any(c["category_name"] == "Groceries" for c in data["top_spending_categories"])


def test_cash_flow_default_months(client, auth_headers):
    response = client.get("/api/v1/dashboard/cash-flow", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["points"]) == 6


def test_cash_flow_custom_months(client, auth_headers):
    response = client.get("/api/v1/dashboard/cash-flow?months=3", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["points"]) == 3
