import base64
from datetime import datetime
from pathlib import Path

from fastapi.testclient import TestClient


def test_upload_image(client: TestClient, tmp_path: Path):
    # Prepare a temporary image file
    image_path = tmp_path / "test_image.jpg"
    image_path.write_bytes(b"fake-image-bytes")

    with image_path.open("rb") as f:
        response = client.post(
            "/api/images/upload",
            files={"file": ("test_image.jpg", f, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["originalName"] == "test_image.jpg"
    assert data["filename"].endswith(".jpg")


def test_get_image(client: TestClient, tmp_path: Path):
    # First upload an image
    image_path = tmp_path / "test_get.jpg"
    test_image_content = b"content-for-get"
    image_path.write_bytes(test_image_content)

    with image_path.open("rb") as f:
        upload_resp = client.post(
            "/api/images/upload",
            files={"file": ("test_get.jpg", f, "image/jpeg")},
        )

    assert upload_resp.status_code == 200
    image_id = upload_resp.json()["id"]

    # Then retrieve it
    get_resp = client.get(f"/api/images/{image_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()

    # Verify all fields
    assert data["id"] == image_id
    assert data["originalName"] == "test_get.jpg"
    assert data["filename"].endswith(".jpg")
    assert data["base64Data"] == base64.b64encode(test_image_content).decode("utf-8")

    # Verify createdAt is present and is a valid ISO format datetime string
    assert "createdAt" in data
    assert isinstance(data["createdAt"], str)
    # Parse the ISO string to verify it's valid
    created_at_str = data["createdAt"]
    parsed_datetime = datetime.fromisoformat(created_at_str)
    assert isinstance(parsed_datetime, datetime)


def test_list_images(client: TestClient, tmp_path: Path):
    # Upload two images
    for idx in range(2):
        p = tmp_path / f"list_{idx}.jpg"
        p.write_bytes(b"x")
        with p.open("rb") as f:
            resp = client.post(
                "/api/images/upload",
                files={"file": (f"list_{idx}.jpg", f, "image/jpeg")},
            )
            assert resp.status_code == 200

    list_resp = client.get("/api/images")
    assert list_resp.status_code == 200
    images = list_resp.json()
    assert isinstance(images, list)
    assert len(images) >= 2


def test_delete_image(client: TestClient, tmp_path: Path):
    # Upload an image
    image_path = tmp_path / "to_delete.jpg"
    image_path.write_bytes(b"delete-me")

    with image_path.open("rb") as f:
        upload_resp = client.post(
            "/api/images/upload",
            files={"file": ("to_delete.jpg", f, "image/jpeg")},
        )

    assert upload_resp.status_code == 200
    image_id = upload_resp.json()["id"]

    # Delete it
    delete_resp = client.delete(f"/api/images/{image_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Image deleted"

    # Subsequent get should 404
    get_resp = client.get(f"/api/images/{image_id}")
    assert get_resp.status_code == 404
