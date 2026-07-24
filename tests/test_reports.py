from datetime import date

from tests.conftest import get_category_id


def test_monthly_report(client, auth_headers):
    today = date.today()
    response = client.get(f"/api/v1/reports/monthly/{today.year}/{today.month}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["year"] == today.year
    assert data["month"] == today.month


def test_monthly_report_with_data(client, auth_headers):
    salary_id = get_category_id(client, auth_headers, "Salary", "income")
    today = date.today()
    client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": "4000.00",
            "category_id": salary_id,
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers,
    )
    response = client.get(f"/api/v1/reports/monthly/{today.year}/{today.month}", headers=auth_headers)
    data = response.json()
    assert float(data["total_income"]) >= 4000.0
    assert data["transaction_count"] >= 1


def test_monthly_report_invalid_month(client, auth_headers):
    response = client.get("/api/v1/reports/monthly/2026/13", headers=auth_headers)
    assert response.status_code == 400


def test_yearly_report(client, auth_headers):
    response = client.get("/api/v1/reports/yearly/2026", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["monthly_breakdown"]) == 12


def test_export_csv(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "25.00",
            "category_id": category_id,
            "description": "Test export row",
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/reports/export/csv", headers=auth_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Test export row" in response.text
