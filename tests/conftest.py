from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL

# Safety guard: refuse to run destructive setup against anything that doesn't
# look like a dedicated test database, so a misconfigured environment can
# never wipe real development data.
_db_name = TEST_DATABASE_URL.rsplit("/", 1)[-1].lower()
if "test" not in _db_name:
    raise RuntimeError(
        "Refusing to run tests: the resolved database "
        f"({TEST_DATABASE_URL!r}) does not look like a test database. "
        "Set TEST_DATABASE_URL to a database whose name contains 'test'."
    )

engine = create_engine(TEST_DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """
    Wrap each test in an outer transaction + SAVEPOINT so that even though
    service code calls `session.commit()`, everything is rolled back at the
    end of the test. This is the standard SQLAlchemy pattern for isolating
    tests when application code manages its own commits.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if not connection.in_nested_transaction():
            connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def test_user_payload():
    return {
        "email": "testuser@example.com",
        "password": "StrongPass123",
        "full_name": "Test User",
        "monthly_income": "5000.00",
        "preferred_currency": "USD",
    }


@pytest.fixture()
def auth_headers(client, test_user_payload):
    response = client.post("/api/v1/auth/register", json=test_user_payload)
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_category_id(client, headers, name, type_):
    """Test helper: find an existing category by name/type, or create one."""
    response = client.get(f"/api/v1/categories?type={type_}", headers=headers)
    for category in response.json():
        if category["name"] == name:
            return category["id"]
    created = client.post(
        "/api/v1/categories", json={"name": name, "type": type_}, headers=headers
    )
    assert created.status_code == 201, created.text
    return created.json()["id"]
