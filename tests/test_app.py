"""
Tests for the High School Management System API
"""

import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities data before each test"""
    activities.clear()
    activities.update({
        "Chess Club": {
            "description": "Learn strategies and compete in chess tournaments",
            "schedule": "Fridays, 3:30 PM - 5:00 PM",
            "max_participants": 12,
            "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
        },
        "Programming Class": {
            "description": "Learn programming fundamentals and build software projects",
            "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            "max_participants": 20,
            "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
        }
    })


def test_root_redirect(client):
    """Test that root redirects to static/index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert data["Chess Club"]["max_participants"] == 12
    assert len(data["Chess Club"]["participants"]) == 2


def test_signup_for_activity_success(client):
    """Test successfully signing up for an activity"""
    response = client.post(
        "/activities/Chess Club/signup?email=test@mergington.edu"
    )
    assert response.status_code == 200
    data = response.json()
    assert "Signed up" in data["message"]
    assert "test@mergington.edu" in data["message"]
    
    # Verify participant was added
    assert "test@mergington.edu" in activities["Chess Club"]["participants"]


def test_signup_activity_not_found(client):
    """Test signing up for a non-existent activity"""
    response = client.post(
        "/activities/Nonexistent Club/signup?email=test@mergington.edu"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_already_registered(client):
    """Test signing up when already registered"""
    response = client.post(
        "/activities/Chess Club/signup?email=michael@mergington.edu"
    )
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_unregister_from_activity_success(client):
    """Test successfully unregistering from an activity"""
    response = client.delete(
        "/activities/Chess Club/unregister?email=michael@mergington.edu"
    )
    assert response.status_code == 200
    data = response.json()
    assert "Unregistered" in data["message"]
    assert "michael@mergington.edu" in data["message"]
    
    # Verify participant was removed
    assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]


def test_unregister_activity_not_found(client):
    """Test unregistering from a non-existent activity"""
    response = client.delete(
        "/activities/Nonexistent Club/unregister?email=test@mergington.edu"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_not_registered(client):
    """Test unregistering when not registered"""
    response = client.delete(
        "/activities/Chess Club/unregister?email=notregistered@mergington.edu"
    )
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]


def test_signup_and_unregister_flow(client):
    """Test complete flow of signing up and then unregistering"""
    email = "flowtest@mergington.edu"
    activity = "Programming Class"
    
    # Sign up
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert email in activities[activity]["participants"]
    
    # Unregister
    response = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 200
    assert email not in activities[activity]["participants"]


def test_multiple_signups(client):
    """Test multiple students signing up for the same activity"""
    emails = [
        "student1@mergington.edu",
        "student2@mergington.edu",
        "student3@mergington.edu"
    ]
    
    for email in emails:
        response = client.post(f"/activities/Chess Club/signup?email={email}")
        assert response.status_code == 200
    
    # Verify all were added
    for email in emails:
        assert email in activities["Chess Club"]["participants"]
