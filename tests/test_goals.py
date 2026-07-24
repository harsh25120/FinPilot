def test_create_goal(client, auth_headers):
    response = client.post(
        "/api/v1/goals",
        json={"name": "New Laptop", "target_amount": "2000.00", "target_date": "2027-01-01"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["current_amount"] == "0.00"
    assert data["status"] == "in_progress"


def test_contribute_to_goal(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "New Phone", "target_amount": "800.00"}, headers=auth_headers
    ).json()
    response = client.post(
        f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "300.00"}, headers=auth_headers
    )
    assert response.status_code == 200, response.text
    assert response.json()["current_amount"] == "300.00"
    assert response.json()["status"] == "in_progress"


def test_contribution_completes_goal(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "New Phone", "target_amount": "800.00"}, headers=auth_headers
    ).json()
    response = client.post(
        f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "800.00"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_cannot_contribute_to_completed_goal(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Small Goal", "target_amount": "100.00"}, headers=auth_headers
    ).json()
    client.post(f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "100.00"}, headers=auth_headers)
    response = client.post(
        f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "50.00"}, headers=auth_headers
    )
    assert response.status_code == 400


def test_goal_progress(client, auth_headers):
    goal = client.post(
        "/api/v1/goals",
        json={"name": "Car Fund", "target_amount": "10000.00", "target_date": "2027-06-01"},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "1000.00"}, headers=auth_headers)
    response = client.get(f"/api/v1/goals/{goal['id']}/progress", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["percentage_complete"] == 10.0
    assert data["remaining_amount"] == "9000.00"
    assert data["required_monthly_contribution"] is not None


def test_goal_progress_with_no_contributions(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Fresh Goal", "target_amount": "500.00"}, headers=auth_headers
    ).json()
    response = client.get(f"/api/v1/goals/{goal['id']}/progress", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["percentage_complete"] == 0.0


def test_update_goal(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Old Name", "target_amount": "100.00"}, headers=auth_headers
    ).json()
    response = client.put(
        f"/api/v1/goals/{goal['id']}", json={"name": "New Name"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_manually_cancel_goal(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Cancel Me", "target_amount": "100.00"}, headers=auth_headers
    ).json()
    response = client.put(
        f"/api/v1/goals/{goal['id']}", json={"status": "cancelled"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_delete_goal_with_transactions_fails(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Trip", "target_amount": "500.00"}, headers=auth_headers
    ).json()
    client.post(f"/api/v1/goals/{goal['id']}/contribute", json={"amount": "100.00"}, headers=auth_headers)
    response = client.delete(f"/api/v1/goals/{goal['id']}", headers=auth_headers)
    assert response.status_code == 400


def test_delete_goal_without_transactions(client, auth_headers):
    goal = client.post(
        "/api/v1/goals", json={"name": "Never Funded", "target_amount": "500.00"}, headers=auth_headers
    ).json()
    response = client.delete(f"/api/v1/goals/{goal['id']}", headers=auth_headers)
    assert response.status_code == 204


def test_list_goals_filter_by_status(client, auth_headers):
    client.post("/api/v1/goals", json={"name": "Goal A", "target_amount": "100.00"}, headers=auth_headers)
    response = client.get("/api/v1/goals?status=in_progress", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["meta"]["total"] >= 1


def test_get_nonexistent_goal(client, auth_headers):
    response = client.get("/api/v1/goals/999999", headers=auth_headers)
    assert response.status_code == 404
