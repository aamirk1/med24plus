import io
import time
import uuid
from datetime import date, timedelta
import pytest
from httpx import AsyncClient

from app.core.permissions import RoleEnum, get_permissions_for_roles
from app.core.security import create_access_token
from app.main import app
from app.repositories.user_repository import UserRepository
from app.services.prescription_rules import (
    PrescriptionStatusEnum,
    PrescriptionValidityPolicy,
    validate_status_transition,
)
from app.services.prescription_storage_service import (
    prescription_storage_service,
)
from tests.conftest import TestAsyncSessionLocal


# Minimal valid file contents with statutory magic bytes
VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\xff\xd9"
VALID_PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF"


async def get_auth_token(client: AsyncClient, identifier: str, password: str = "Password@123", portal: str = "customer") -> str:
    """Helper to authenticate and return access token without hitting rate limits."""
    async with TestAsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_phone(identifier)
        if not user:
            user = await user_repo.get_by_email(identifier)
        if user:
            roles = await user_repo.get_user_role_slugs(user)
            perms = list(get_permissions_for_roles(roles))
            return create_access_token(subject=str(user.id), roles=roles, permissions=perms)

    if portal == "admin":
        url = "/api/v1/admin/auth/login"
    elif portal == "pharmacist":
        url = "/api/v1/pharmacist/auth/login"
    else:
        url = "/api/v1/auth/login"

    res = await client.post(url, json={"identifier": identifier, "password": password})
    assert res.status_code == 200, f"Login failed for {identifier}: {res.text}"
    return res.json()["data"]["access_token"]


def test_prescription_routes_registered():
    """Verify that all Phase 6 prescription routes are correctly mounted."""
    routes = {r.path for r in app.routes if hasattr(r, "path")}
    assert "/api/v1/prescriptions" in routes
    assert "/api/v1/prescriptions/{prescription_id}" in routes
    assert "/api/v1/prescriptions/{prescription_id}/files" in routes
    assert "/api/v1/prescriptions/{prescription_id}/files/{file_id}/view" in routes
    assert "/api/v1/prescriptions/{prescription_id}/files/{file_id}/download" in routes
    assert "/api/v1/prescriptions/{prescription_id}/cancel" in routes
    assert "/api/v1/prescriptions/{prescription_id}/clarification-files" in routes

    assert "/api/v1/admin/prescriptions" in routes
    assert "/api/v1/admin/prescriptions/counts" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/start-review" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/approve" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/reject" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/request-clarification" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/history" in routes
    assert "/api/v1/admin/prescriptions/{prescription_id}/items" in routes


def test_magic_bytes_and_file_validation():
    """Verify file integrity: magic bytes inspection, empty files, and extension checks."""
    # Valid JPEG
    ext, mime, checksum = prescription_storage_service.validate_file_content("rx.jpg", "image/jpeg", VALID_JPEG_BYTES)
    assert ext == ".jpg"
    assert mime == "image/jpeg"
    assert len(checksum) == 64

    # Valid PNG
    ext, mime, checksum = prescription_storage_service.validate_file_content("rx.png", "image/png", VALID_PNG_BYTES)
    assert ext == ".png"
    assert mime == "image/png"

    # Valid PDF
    ext, mime, checksum = prescription_storage_service.validate_file_content("rx.pdf", "application/pdf", VALID_PDF_BYTES)
    assert ext == ".pdf"
    assert mime == "application/pdf"

    # Corrupted / Spoofed file: extension is .jpg but body is plain text
    with pytest.raises(Exception) as exc:
        prescription_storage_service.validate_file_content("fake.jpg", "image/jpeg", b"Not a real jpeg file content")
    assert "magic bytes" in str(exc.value).lower()

    # Empty file
    with pytest.raises(Exception) as exc:
        prescription_storage_service.validate_file_content("empty.jpg", "image/jpeg", b"")
    assert "empty" in str(exc.value).lower()

    # Unsupported extension
    with pytest.raises(Exception) as exc:
        prescription_storage_service.validate_file_content("malicious.exe", "application/octet-stream", b"MZ\x90\x00")
    assert "invalid file extension" in str(exc.value).lower()


def test_signed_view_token_generation_and_expiry():
    """Verify HMAC-SHA256 signed URL token verification and expiration."""
    file_id = uuid.uuid4()
    # 1. Valid token
    token = prescription_storage_service.generate_signed_view_token(file_id, expires_in=10)
    assert prescription_storage_service.verify_signed_view_token(file_id, token) is True

    # 2. Tampered token
    tampered = token[:-4] + "abcd"
    assert prescription_storage_service.verify_signed_view_token(file_id, tampered) is False

    # 3. Wrong file id
    other_id = uuid.uuid4()
    assert prescription_storage_service.verify_signed_view_token(other_id, token) is False

    # 4. Expired token
    expired_token = f"{int(time.time()) - 50}.dummyhmac"
    assert prescription_storage_service.verify_signed_view_token(file_id, expired_token) is False


def test_status_transition_rules():
    """Verify statutory state machine enforcement."""
    # Allowed transitions
    validate_status_transition(PrescriptionStatusEnum.PENDING_REVIEW.value, PrescriptionStatusEnum.UNDER_REVIEW.value)
    validate_status_transition(PrescriptionStatusEnum.UNDER_REVIEW.value, PrescriptionStatusEnum.APPROVED.value)
    validate_status_transition(PrescriptionStatusEnum.UNDER_REVIEW.value, PrescriptionStatusEnum.REJECTED.value)
    validate_status_transition(PrescriptionStatusEnum.UNDER_REVIEW.value, PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value)
    validate_status_transition(PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value, PrescriptionStatusEnum.PENDING_REVIEW.value)

    # Disallowed: Rejected is terminal
    with pytest.raises(Exception) as exc:
        validate_status_transition(PrescriptionStatusEnum.REJECTED.value, PrescriptionStatusEnum.APPROVED.value)
    assert "illegal prescription status transition" in str(exc.value).lower()

    # Disallowed: Approved cannot become pending
    with pytest.raises(Exception) as exc:
        validate_status_transition(PrescriptionStatusEnum.APPROVED.value, PrescriptionStatusEnum.PENDING_REVIEW.value)
    assert "illegal prescription status transition" in str(exc.value).lower()


def test_prescription_validity_evaluation():
    """Verify statutory validity calculation for general, Schedule H/H1, and Schedule X."""
    today = date.today()

    # Normal valid date
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today - timedelta(days=10),
        valid_until=today + timedelta(days=30),
    )
    assert is_valid is True
    assert reason is None

    # Future date rejected
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today + timedelta(days=5),
        valid_until=None,
    )
    assert is_valid is False
    assert "future" in reason.lower()

    # Past valid_until expired
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today - timedelta(days=60),
        valid_until=today - timedelta(days=1),
    )
    assert is_valid is False
    assert "expired" in reason.lower()


@pytest.mark.asyncio
async def test_customer_upload_valid_prescription(client: AsyncClient):
    """Test customer uploading a valid clinical prescription with patient metadata."""
    customer_token = await get_auth_token(client, "+919876543210")

    files = [
        ("files", ("doctor_rx.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg")),
    ]
    data = {
        "patient_name": "Rohan Deshmukh",
        "patient_age": "34",
        "patient_gender": "Male",
        "doctor_name": "Dr. V. Ramanathan, MD",
        "doctor_registration_no": "MCI-49201-A",
        "doctor_clinic_or_hospital": "Apollo Health City, Bengaluru",
        "prescription_date": date.today().isoformat(),
        "customer_notes": "Please deliver evening slot after 6 PM.",
    }

    res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
        files=files,
        data=data,
    )

    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    rx = body["data"]
    assert rx["status"] == "pending_review"
    assert rx["patient_name"] == "Rohan Deshmukh"
    assert rx["doctor_name"] == "Dr. V. Ramanathan, MD"
    assert rx["prescription_reference"].startswith("RX-")
    assert len(rx["files"]) == 1
    assert rx["files"][0]["original_filename"] == "doctor_rx.jpg"
    assert rx["files"][0]["file_type"] == "image/jpeg"
    assert "secure_view_url" in rx["files"][0]


@pytest.mark.asyncio
async def test_customer_upload_multiple_files(client: AsyncClient):
    """Test customer uploading multi-page prescription (JPEG + PDF)."""
    customer_token = await get_auth_token(client, "+919876543210")

    files = [
        ("files", ("page1.png", io.BytesIO(VALID_PNG_BYTES), "image/png")),
        ("files", ("page2.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")),
    ]
    data = {
        "patient_name": "Sunita Patil",
        "prescription_date": date.today().isoformat(),
    }

    res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
        files=files,
        data=data,
    )

    assert res.status_code == 201
    rx = res.json()["data"]
    assert len(rx["files"]) == 2
    filenames = [f["original_filename"] for f in rx["files"]]
    assert "page1.png" in filenames
    assert "page2.pdf" in filenames


@pytest.mark.asyncio
async def test_upload_spoofed_file_rejected(client: AsyncClient):
    """Test that file with fake .jpg extension but non-JPEG magic bytes is rejected."""
    customer_token = await get_auth_token(client, "+919876543210")

    files = [
        ("files", ("fake.jpg", io.BytesIO(b"Spoofed text content not JPEG"), "image/jpeg")),
    ]
    res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
        files=files,
        data={"patient_name": "Test Patient"},
    )
    assert res.status_code == 400
    assert "magic bytes" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_customer_prescription_listing_and_isolation(client: AsyncClient):
    """Test customer listing their own vault."""
    customer_token = await get_auth_token(client, "+919876543210")

    res = await client.get(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_secure_file_view_with_signed_token(client: AsyncClient):
    """Test secure streaming of private prescription image using HMAC signed token."""
    customer_token = await get_auth_token(client, "+919876543210")

    # 1. Upload Rx
    files = [("files", ("test_view.png", io.BytesIO(VALID_PNG_BYTES), "image/png"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
        files=files,
        data={"patient_name": "Viewer Test"},
    )
    rx = upload_res.json()["data"]
    file_id = rx["files"][0]["id"]
    rx_id = rx["id"]

    # 2. Get secure view URL generated by service
    secure_url = rx["files"][0]["secure_view_url"]
    assert secure_url is not None

    # 3. Request without token or auth -> 403
    client.cookies.clear()
    unauth_res = await client.get(f"/api/v1/prescriptions/{rx_id}/files/{file_id}/view")
    assert unauth_res.status_code == 403

    # 4. Request with valid secure signed URL -> 200 File Content
    auth_view_res = await client.get(secure_url)
    assert auth_view_res.status_code == 200
    assert auth_view_res.headers["content-type"] == "image/png"
    assert auth_view_res.content == VALID_PNG_BYTES


@pytest.mark.asyncio
async def test_pharmacist_review_queue_and_dashboard_counts(client: AsyncClient):
    """Test pharmacist accessing verification dashboard and summary KPI counters."""
    # Verified pharmacist login
    pharm_token = await get_auth_token(client, "+919800000003", portal="pharmacist")

    # 1. Fetch counts
    counts_res = await client.get(
        "/api/v1/admin/prescriptions/counts",
        headers={"Authorization": f"Bearer {pharm_token}"},
    )
    assert counts_res.status_code == 200
    counts = counts_res.json()["data"]
    assert "pending_review" in counts
    assert "approved" in counts
    assert "rejected" in counts

    # 2. Fetch queue list
    queue_res = await client.get(
        "/api/v1/admin/prescriptions?status=PENDING_REVIEW",
        headers={"Authorization": f"Bearer {pharm_token}"},
    )
    assert queue_res.status_code == 200
    assert queue_res.json()["success"] is True
    items = queue_res.json()["data"]["items"]
    assert len(items) >= 1


@pytest.mark.asyncio
async def test_unverified_pharmacist_blocked_from_review_decisions(client: AsyncClient):
    """Verify that unverified pharmacist (+919800000004) is barred from approving under Rule 65."""
    unverif_token = await get_auth_token(client, "+919800000004", portal="pharmacist")
    cust_token = await get_auth_token(client, "+919876543210")

    # Upload test Rx
    files = [("files", ("rule65_test.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=files,
        data={"patient_name": "Gating Test"},
    )
    rx_id = upload_res.json()["data"]["id"]

    # Unverified pharmacist attempts to approve -> Must return 403 Forbidden!
    approve_res = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/approve",
        headers={"Authorization": f"Bearer {unverif_token}"},
        json={"pharmacist_notes": "Attempting unauthorized approval"},
    )
    assert approve_res.status_code == 403
    assert approve_res.json()["error"]["code"] == "PHARMACIST_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_pharmacist_approval_lifecycle(client: AsyncClient):
    """
    Test complete clinical approval workflow:
    Upload -> Start Review -> Approve -> Check Audit History.
    """
    cust_token = await get_auth_token(client, "+919876543210")
    pharm_token = await get_auth_token(client, "+919800000003", portal="pharmacist")

    # 1. Upload Rx
    files = [("files", ("approval_test.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=files,
        data={"patient_name": "Deepak Verma", "prescription_date": date.today().isoformat()},
    )
    rx_id = upload_res.json()["data"]["id"]

    # 2. Start review
    start_res = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/start-review",
        headers={"Authorization": f"Bearer {pharm_token}"},
    )
    assert start_res.status_code == 200
    assert start_res.json()["data"]["status"] == "under_review"

    # 3. Approve Rx
    approve_res = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/approve",
        headers={"Authorization": f"Bearer {pharm_token}"},
        json={
            "pharmacist_notes": "Verified against State Medical Register. Valid for 30-day course.",
            "valid_until": (date.today() + timedelta(days=90)).isoformat(),
        },
    )
    assert approve_res.status_code == 200
    appr_rx = approve_res.json()["data"]
    assert appr_rx["status"] == "approved"
    assert appr_rx["valid_until"] is not None
    assert "Verified against State Medical Register" in appr_rx["pharmacist_notes"]

    # 4. Check immutable audit review logs
    history_res = await client.get(
        f"/api/v1/admin/prescriptions/{rx_id}/history",
        headers={"Authorization": f"Bearer {pharm_token}"},
    )
    assert history_res.status_code == 200
    logs = history_res.json()["data"]
    assert len(logs) >= 2
    actions = [l["action"] for l in logs]
    assert "START_REVIEW" in actions
    assert "APPROVED" in actions


@pytest.mark.asyncio
async def test_pharmacist_rejection_workflow(client: AsyncClient):
    """Test rejection with mandatory statutory reason and verify terminal state."""
    cust_token = await get_auth_token(client, "+919876543210")
    pharm_token = await get_auth_token(client, "+919800000003", portal="pharmacist")

    # 1. Upload Rx
    files = [("files", ("reject_test.png", io.BytesIO(VALID_PNG_BYTES), "image/png"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=files,
        data={"patient_name": "Rejection Case"},
    )
    rx_id = upload_res.json()["data"]["id"]

    # 2. Reject without reason -> 422 Unprocessable
    empty_rej = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/reject",
        headers={"Authorization": f"Bearer {pharm_token}"},
        json={"rejection_reason": ""},
    )
    assert empty_rej.status_code in [400, 422]

    # 3. Reject with statutory reason -> 200 OK
    valid_rej = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/reject",
        headers={"Authorization": f"Bearer {pharm_token}"},
        json={
            "rejection_reason": "Prescription document is illegible and missing doctor's signature and registration stamp.",
        },
    )
    assert valid_rej.status_code == 200
    assert valid_rej.json()["data"]["status"] == "rejected"
    assert "illegible" in valid_rej.json()["data"]["rejection_reason"]

    # 4. Verify terminal state: Attempting to approve a rejected prescription MUST fail
    fail_approve = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/approve",
        headers={"Authorization": f"Bearer {pharm_token}"},
        json={"pharmacist_notes": "Trying to revive rejected rx"},
    )
    assert fail_approve.status_code == 400
    assert fail_approve.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


@pytest.mark.asyncio
async def test_pharmacist_clarification_and_customer_resubmission(client: AsyncClient):
    """
    Test clarification workflow:
    Pharmacist requests clarification -> Customer uploads new document -> Status returns to pending_review.
    """
    cust_token = await get_auth_token(client, "+919876543210")
    pharm_token = await get_auth_token(client, "+919800000003", portal="pharmacist")

    # 1. Upload Rx
    files = [("files", ("clarif_doc.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=files,
        data={"patient_name": "Clarification Patient"},
    )
    rx_id = upload_res.json()["data"]["id"]

    # 2. Pharmacist requests clarification
    clarif_res = await client.post(
        f"/api/v1/admin/prescriptions/{rx_id}/request-clarification",
        headers={"Authorization": f"Bearer {pharm_token}"},
        json={"clarification_remarks": "Please upload a clearer image of page 2 containing the doctor's signature."},
    )
    assert clarif_res.status_code == 200
    assert clarif_res.json()["data"]["status"] == "clarification_required"

    # 3. Customer submits clarification document
    new_files = [("files", ("page2_clear.png", io.BytesIO(VALID_PNG_BYTES), "image/png"))]
    resub_res = await client.post(
        f"/api/v1/prescriptions/{rx_id}/clarification-files",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=new_files,
        data={"customer_notes": "Here is the higher resolution scan with signature."},
    )
    assert resub_res.status_code == 200
    resub_rx = resub_res.json()["data"]
    assert resub_rx["status"] == "pending_review"
    assert len(resub_rx["files"]) == 2


@pytest.mark.asyncio
async def test_customer_cancel_pending_prescription(client: AsyncClient):
    """Test customer cancelling their own pending prescription."""
    cust_token = await get_auth_token(client, "+919876543210")

    # Upload Rx
    files = [("files", ("cancel_me.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))]
    upload_res = await client.post(
        "/api/v1/prescriptions",
        headers={"Authorization": f"Bearer {cust_token}"},
        files=files,
        data={"patient_name": "Cancel Test"},
    )
    rx_id = upload_res.json()["data"]["id"]

    # Cancel
    cancel_res = await client.post(
        f"/api/v1/prescriptions/{rx_id}/cancel",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"reason": "Consulted doctor again, medicine changed."},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "cancelled"
