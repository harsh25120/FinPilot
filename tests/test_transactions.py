from tests.conftest import get_category_id


def test_create_income_transaction(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Salary", "income")
    response = client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": "1500.00",
            "category_id": category_id,
            "description": "Monthly salary",
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["amount"] == "1500.00"
    assert data["currency"] == "USD"
    assert data["category"]["name"] == "Salary"


def test_create_expense_without_category_fails(client, auth_headers):
    response = client.post(
        "/api/v1/transactions",
        json={"type": "expense", "amount": "50.00", "transaction_date": "2026-06-01"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_create_expense_with_income_category_fails(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Salary", "income")
    response = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "50.00",
            "category_id": category_id,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_create_transfer_requires_goal(client, auth_headers):
    response = client.post(
        "/api/v1/transactions",
        json={"type": "transfer", "amount": "100.00", "transaction_date": "2026-06-01"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_create_transfer_with_category_fails(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    goal = client.post(
        "/api/v1/goals", json={"name": "Trip Fund", "target_amount": "500.00"}, headers=auth_headers
    ).json()
    response = client.post(
        "/api/v1/transactions",
        json={
            "type": "transfer",
            "amount": "100.00",
            "category_id": category_id,
            "goal_id": goal["id"],
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_transfer_updates_goal_balance(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Emergency Fund", "target_amount": "1000.00"}, headers=auth_headers
    ).json()
    response = client.post(
        "/api/v1/transactions",
        json={
            "type": "transfer",
            "amount": "200.00",
            "goal_id": goal["id"],
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    updated_goal = client.get(f"/api/v1/goals/{goal['id']}", headers=auth_headers).json()
    assert updated_goal["current_amount"] == "200.00"


def test_list_transactions_pagination(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    for i in range(5):
        client.post(
            "/api/v1/transactions",
            json={
                "type": "expense",
                "amount": f"{10 + i}.00",
                "category_id": category_id,
                "transaction_date": "2026-06-01",
            },
            headers=auth_headers,
        )
    response = client.get("/api/v1/transactions?page=1&page_size=2", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 2
    assert body["meta"]["total"] >= 5
    assert body["meta"]["page"] == 1
    assert body["meta"]["page_size"] == 2


def test_filter_transactions_by_amount(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "999.00",
            "category_id": category_id,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/transactions?min_amount=500", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    assert all(float(t["amount"]) >= 500 for t in items)


def test_filter_transactions_by_type(client, auth_headers):
    income_cat = get_category_id(client, auth_headers, "Salary", "income")
    expense_cat = get_category_id(client, auth_headers, "Rent", "expense")
    client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": "100.00",
            "category_id": income_cat,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "100.00",
            "category_id": expense_cat,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/transactions?type=income", headers=auth_headers)
    assert response.status_code == 200
    assert all(t["type"] == "income" for t in response.json()["items"])


def test_search_transactions_by_description(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "45.00",
            "category_id": category_id,
            "description": "Weekly farmers market run",
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    response = client.get("/api/v1/transactions?search=farmers", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["items"]) >= 1


def test_sort_transactions_by_amount(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    for amount in ["30.00", "10.00", "50.00"]:
        client.post(
            "/api/v1/transactions",
            json={
                "type": "expense",
                "amount": amount,
                "category_id": category_id,
                "transaction_date": "2026-06-01",
            },
            headers=auth_headers,
        )
    response = client.get(
        "/api/v1/transactions?sort_by=amount&sort_order=desc&page_size=100", headers=auth_headers
    )
    amounts = [float(t["amount"]) for t in response.json()["items"]]
    assert amounts == sorted(amounts, reverse=True)


def test_update_transaction_amount(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    created = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "20.00",
            "category_id": category_id,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()
    response = client.put(
        f"/api/v1/transactions/{created['id']}", json={"amount": "25.00"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["amount"] == "25.00"


def test_update_transfer_goal_id_adjusts_both_goals(client, auth_headers):
    goal_a = client.post(
        "/api/v1/goals", json={"name": "Goal A", "target_amount": "1000.00"}, headers=auth_headers
    ).json()
    goal_b = client.post(
        "/api/v1/goals", json={"name": "Goal B", "target_amount": "1000.00"}, headers=auth_headers
    ).json()
    txn = client.post(
        "/api/v1/transactions",
        json={
            "type": "transfer",
            "amount": "100.00",
            "goal_id": goal_a["id"],
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()

    response = client.put(
        f"/api/v1/transactions/{txn['id']}", json={"goal_id": goal_b["id"]}, headers=auth_headers
    )
    assert response.status_code == 200

    goal_a_after = client.get(f"/api/v1/goals/{goal_a['id']}", headers=auth_headers).json()
    goal_b_after = client.get(f"/api/v1/goals/{goal_b['id']}", headers=auth_headers).json()
    assert goal_a_after["current_amount"] == "0.00"
    assert goal_b_after["current_amount"] == "100.00"


def test_delete_transaction(client, auth_headers):
    category_id = get_category_id(client, auth_headers, "Groceries", "expense")
    created = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": "20.00",
            "category_id": category_id,
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()
    response = client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    follow_up = client.get(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert follow_up.status_code == 404


def test_delete_transfer_transaction_reverts_goal_balance(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Vacation", "target_amount": "500.00"}, headers=auth_headers
    ).json()
    txn = client.post(
        "/api/v1/transactions",
        json={
            "type": "transfer",
            "amount": "150.00",
            "goal_id": goal["id"],
            "transaction_date": "2026-06-01",
        },
        headers=auth_headers,
    ).json()
    client.delete(f"/api/v1/transactions/{txn['id']}", headers=auth_headers)
    updated_goal = client.get(f"/api/v1/goals/{goal['id']}", headers=auth_headers).json()
    assert updated_goal["current_amount"] == "0.00"


def test_get_nonexistent_transaction(client, auth_headers):
    response = client.get("/api/v1/transactions/999999", headers=auth_headers)
    assert response.status_code == 404
