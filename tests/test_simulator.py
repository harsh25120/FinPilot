def test_projection_basic(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/projection",
        json={
            "starting_balance": "1000.00",
            "monthly_contribution": "200.00",
            "annual_interest_rate": 0.05,
            "months": 12,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data["schedule"]) == 12
    assert float(data["final_balance"]) > 1000.0
    assert float(data["total_contributed"]) == 2400.0


def test_projection_zero_interest(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/projection",
        json={
            "starting_balance": "0.00",
            "monthly_contribution": "100.00",
            "annual_interest_rate": 0.0,
            "months": 10,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["final_balance"] == "1000.00"
    assert response.json()["total_interest_earned"] == "0.00"


def test_projection_invalid_months(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/projection",
        json={"monthly_contribution": "100.00", "months": 0},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_goal_planner_with_contribution(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/goal-planner",
        json={
            "target_amount": "5000.00",
            "current_amount": "0.00",
            "monthly_contribution": "500.00",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["months_needed"] == 10


def test_goal_planner_with_target_date(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/goal-planner",
        json={"target_amount": "5000.00", "current_amount": "0.00", "target_date": "2027-01-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["required_monthly_contribution"] is not None


def test_goal_planner_already_reached(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/goal-planner",
        json={"target_amount": "1000.00", "current_amount": "1500.00"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["months_needed"] == 0
    assert response.json()["feasible"] is True


def test_goal_planner_missing_both_inputs_fails(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/goal-planner",
        json={"target_amount": "5000.00", "current_amount": "0.00"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_goal_planner_past_target_date_fails(client, auth_headers):
    response = client.post(
        "/api/v1/simulator/goal-planner",
        json={"target_amount": "5000.00", "current_amount": "0.00", "target_date": "2020-01-01"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_simulator_requires_auth(client):
    response = client.post(
        "/api/v1/simulator/projection",
        json={"monthly_contribution": "100.00", "months": 12},
    )
    assert response.status_code == 401
