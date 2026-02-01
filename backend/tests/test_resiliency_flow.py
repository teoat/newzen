import uuid
from datetime import datetime, UTC
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import ProcessingJob, JobStatus
from app.core.db import get_db

@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer mock_token"}


@pytest.fixture
def test_project(client, auth_headers):
    project_payload = {
        "name": "Resiliency Test Project",
        "contractor_name": "Resiliency Contractor",
        "contract_value": 5000000,
        "start_date": "2026-01-01T00:00:00",
    }
    response = client.post(
        "/api/v1/project/", json=project_payload, headers=auth_headers
    )
    assert response.status_code == 200
    return response.json()


def test_batch_job_cancellation_resiliency(client, auth_headers, test_project):
    """
    Test that a job can be cancelled and correctly transitions state.
    """
    project_id = test_project["id"]
    payload = {
        "project_id": project_id,
        "data_type": "transaction",
        "items": [{"id": f"tx_{i}", "amount": i * 100} for i in range(10)],
    }

    # 1. Submit Job
    submit_resp = client.post(
        "/api/v1/batch-jobs/submit", json=payload, headers=auth_headers
    )
    assert submit_resp.status_code == 200
    job_id = submit_resp.json()["job_id"]

    # 2. Cancel Job
    cancel_resp = client.post(
        f"/api/v1/batch-jobs/{job_id}/cancel", headers=auth_headers
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # 3. Verify Status is CANCELLED
    status_resp = client.get(
        f"/api/v1/batch-jobs/{job_id}", headers=auth_headers
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == JobStatus.CANCELLED.value


def test_batch_job_failure_reporting(client, auth_headers, test_project):
    """
    Test that the API correctly reports failed jobs with error messages.
    """
    project_id = test_project["id"]

    # Manually create a failed job in the DB to test reporting
    job_id = str(uuid.uuid4())

    with get_db() as db:
        job = ProcessingJob(
            id=job_id,
            project_id=project_id,
            data_type="transaction",
            status=JobStatus.FAILED,
            total_items=100,
            total_batches=10,
            items_processed=45,
            items_failed=5,
            error_message="Simulation of batch failure: Redis timeout",
            created_at=datetime.now(UTC),
            started_at=datetime.now(UTC),
        )
        db.add(job)
        db.commit()

    # Verify via API
    response = client.get(f"/api/v1/batch-jobs/{job_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == JobStatus.FAILED.value
    assert "Redis timeout" in data["error_message"]
    assert data["items_processed"] == 45
    assert data["items_failed"] == 5


def test_batch_job_invalid_submission(client, auth_headers):
    """
    Test resiliency against malformed submissions.
    """
    # Missing items
    payload = {"project_id": "some-id", "data_type": "transaction"}
    response = client.post(
        "/api/v1/batch-jobs/submit", json=payload, headers=auth_headers
    )
    assert response.status_code == 422  # Pydantic validation error

    # Empty list which should be 400 based on our implementation.
    payload = {
        "project_id": "some-id",
        "data_type": "transaction",
        "items": []
    }
    response = client.post(
        "/api/v1/batch-jobs/submit", json=payload, headers=auth_headers
    )
    assert response.status_code == 400
    assert "No items provided" in response.json()["detail"]
