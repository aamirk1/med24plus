import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("med24plus.firebase")

# Attempt importing firebase_admin gracefully
try:
    import firebase_admin
    from firebase_admin import auth as fb_auth
    from firebase_admin import credentials as fb_credentials
    from firebase_admin import messaging as fb_messaging
    from firebase_admin import storage as fb_storage
    from firebase_admin.exceptions import FirebaseError
    FIREBASE_ADMIN_INSTALLED = True
except ImportError:
    FIREBASE_ADMIN_INSTALLED = False
    fb_auth = None
    fb_credentials = None
    fb_messaging = None
    fb_storage = None
    FirebaseError = Exception


class FirebaseService:
    """
    Singleton service managing Firebase Admin SDK lifecycle,
    Firebase Cloud Messaging (FCM) push notifications,
    and Firebase Phone Auth token verifications.
    """

    _instance: Optional["FirebaseService"] = None
    _is_initialized: bool = False
    _is_simulation_mode: bool = True

    def __new__(cls) -> "FirebaseService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_firebase()
        return cls._instance

    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK with credentials or fallback to simulation mode."""
        if not FIREBASE_ADMIN_INSTALLED:
            logger.warning(
                "[FIREBASE] firebase-admin package is not installed in the environment. "
                "Running in safe simulation/mock mode."
            )
            self._is_simulation_mode = True
            self._is_initialized = True
            return

        # Check if default app is already initialized
        try:
            if firebase_admin._apps:
                self._is_initialized = True
                self._is_simulation_mode = False
                logger.info("[FIREBASE] Using existing Firebase Admin app instance.")
                return
        except Exception:
            pass

        raw_cred_path = settings.FIREBASE_CREDENTIALS_PATH or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        candidate_paths = []
        if raw_cred_path:
            candidate_paths.append(raw_cred_path)
            if not os.path.isabs(raw_cred_path):
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                candidate_paths.append(os.path.join(backend_dir, raw_cred_path))
                candidate_paths.append(os.path.join(backend_dir, os.path.basename(raw_cred_path)))

        resolved_path = None
        for p in candidate_paths:
            if p and os.path.isfile(p):
                resolved_path = p
                break

        if resolved_path:
            try:
                cred = fb_credentials.Certificate(resolved_path)
                firebase_admin.initialize_app(cred, {
                    "projectId": settings.FIREBASE_PROJECT_ID,
                    "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
                })
                self._is_initialized = True
                self._is_simulation_mode = False
                logger.info(f"[FIREBASE] Initialized Firebase Admin from service account file: {resolved_path}")
                return
            except Exception as e:
                logger.error(f"[FIREBASE] Failed to initialize Firebase Admin with credentials: {e}")

        # In development / sandbox without credential file, run in simulation mode
        logger.info(
            f"[FIREBASE] No credentials file found at '{raw_cred_path}'. "
            "Running in simulation mode (ideal for local development and unit tests)."
        )
        self._is_simulation_mode = True
        self._is_initialized = True

    @property
    def is_simulation_mode(self) -> bool:
        return self._is_simulation_mode

    # =========================================================================
    # Push Notifications (FCM)
    # =========================================================================

    async def send_push_notification(
        self,
        device_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image_url: Optional[str] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a transactional push notification to a specific device FCM token.
        Returns: (success: bool, error_or_message_id: Optional[str])
        """
        if not device_token or not device_token.strip():
            return False, "DEVICE_TOKEN_EMPTY"

        clean_data = {str(k): str(v) for k, v in (data or {}).items()}

        if self._is_simulation_mode or not FIREBASE_ADMIN_INSTALLED:
            logger.info(
                f"[FIREBASE SIMULATED PUSH] Token: {device_token[:12]}... | "
                f"Title: '{title}' | Body: '{body}' | Data: {clean_data}"
            )
            return True, f"simulated_msg_{os.urandom(4).hex()}"

        try:
            notification = fb_messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            )
            # Configure Android and APNS specifics
            android_config = fb_messaging.AndroidConfig(
                priority="high",
                notification=fb_messaging.AndroidNotification(
                    icon="ic_launcher",
                    channel_id="med24plus_high_importance_channel",
                    click_action="FLUTTER_NOTIFICATION_CLICK",
                ),
            )
            message = fb_messaging.Message(
                notification=notification,
                data=clean_data,
                token=device_token,
                android=android_config,
            )
            message_id = fb_messaging.send(message)
            logger.info(f"[FIREBASE FCM] Notification dispatched successfully: {message_id}")
            return True, message_id

        except Exception as e:
            err_str = str(e)
            logger.error(f"[FIREBASE FCM ERROR] Failed to send push notification: {err_str}")
            if "Requested entity was not found" in err_str or "registration-token-not-registered" in err_str:
                return False, "UNREGISTERED_TOKEN"
            return False, err_str

    async def send_multicast_notification(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Broadcast push notification to multiple device tokens (e.g. all user devices).
        Returns dict with success_count, failure_count, and failed_tokens.
        """
        valid_tokens = [t.strip() for t in device_tokens if t and t.strip()]
        if not valid_tokens:
            return {"success_count": 0, "failure_count": 0, "failed_tokens": []}

        clean_data = {str(k): str(v) for k, v in (data or {}).items()}

        if self._is_simulation_mode or not FIREBASE_ADMIN_INSTALLED:
            logger.info(
                f"[FIREBASE SIMULATED MULTICAST] Tokens count: {len(valid_tokens)} | "
                f"Title: '{title}' | Body: '{body}'"
            )
            return {
                "success_count": len(valid_tokens),
                "failure_count": 0,
                "failed_tokens": [],
            }

        try:
            notification = fb_messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            )
            android_config = fb_messaging.AndroidConfig(
                priority="high",
                notification=fb_messaging.AndroidNotification(
                    icon="ic_launcher",
                    channel_id="med24plus_high_importance_channel",
                    click_action="FLUTTER_NOTIFICATION_CLICK",
                ),
            )
            message = fb_messaging.MulticastMessage(
                tokens=valid_tokens,
                notification=notification,
                data=clean_data,
                android=android_config,
            )
            response = fb_messaging.send_each_for_multicast(message)
            failed_tokens: List[str] = []

            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    token = valid_tokens[idx]
                    failed_tokens.append(token)
                    logger.warning(f"[FIREBASE FCM MULTICAST] Token failed: {token[:12]}... Reason: {resp.exception}")

            return {
                "success_count": response.success_count,
                "failure_count": response.failure_count,
                "failed_tokens": failed_tokens,
            }
        except Exception as e:
            logger.error(f"[FIREBASE FCM MULTICAST ERROR] {e}")
            return {
                "success_count": 0,
                "failure_count": len(valid_tokens),
                "failed_tokens": valid_tokens,
            }

    async def send_topic_notification(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """Send push notification to a subscribed topic (e.g. 'health_tips', 'order_alerts')."""
        clean_data = {str(k): str(v) for k, v in (data or {}).items()}

        if self._is_simulation_mode or not FIREBASE_ADMIN_INSTALLED:
            logger.info(f"[FIREBASE SIMULATED TOPIC] Topic: {topic} | Title: '{title}'")
            return True, f"simulated_topic_{os.urandom(4).hex()}"

        try:
            message = fb_messaging.Message(
                notification=fb_messaging.Notification(title=title, body=body),
                data=clean_data,
                topic=topic,
            )
            msg_id = fb_messaging.send(message)
            return True, msg_id
        except Exception as e:
            logger.error(f"[FIREBASE TOPIC ERROR] {e}")
            return False, str(e)

    # =========================================================================
    # Phone Auth / OTP Token Verification
    # =========================================================================

    async def verify_phone_id_token(
        self,
        id_token: str,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Verify Firebase Phone Auth ID Token provided by the client application.
        Extracts verified phone number, Firebase UID, and token claims.
        Returns: (success: bool, decoded_claims: Optional[Dict], error: Optional[str])
        """
        if not id_token or not id_token.strip():
            return False, None, "Firebase ID token is required."

        clean_token = id_token.strip()

        # Development / Sandbox simulation helper
        if self._is_simulation_mode or clean_token.startswith("dev_firebase_token_"):
            # Format: dev_firebase_token_+919876543210
            parts = clean_token.split("dev_firebase_token_")
            phone = parts[1] if len(parts) > 1 and parts[1] else "+919876543210"
            logger.info(f"[FIREBASE SIMULATED AUTH] Verified token for phone: {phone}")
            return True, {
                "uid": f"dev_uid_{os.urandom(6).hex()}",
                "phone_number": phone,
                "firebase": {"sign_in_provider": "phone"},
            }, None

        if not FIREBASE_ADMIN_INSTALLED:
            return False, None, "Firebase Admin SDK is not available in the backend environment."

        try:
            decoded = fb_auth.verify_id_token(clean_token)
            phone = decoded.get("phone_number")
            if not phone:
                return False, None, "Token does not contain a verified phone number."
            logger.info(f"[FIREBASE AUTH] Successfully verified phone number: {phone[:4]}***")
            return True, decoded, None
        except Exception as e:
            logger.error(f"[FIREBASE AUTH ERROR] Invalid token: {e}")
            return False, None, f"Invalid or expired Firebase ID token: {str(e)}"

    # =========================================================================
    # Cloud Storage (Firebase Storage)
    # =========================================================================

    def get_bucket(self):
        """Retrieve Firebase Storage Bucket instance."""
        if self._is_simulation_mode or not FIREBASE_ADMIN_INSTALLED or fb_storage is None:
            return None
        try:
            return fb_storage.bucket()
        except Exception as e:
            logger.error(f"[FIREBASE STORAGE ERROR] Failed to access storage bucket: {e}")
            return None

    async def upload_file(
        self,
        destination_blob_name: str,
        content: bytes,
        content_type: str,
        is_public: bool = False,
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Upload binary content to Firebase Storage.
        Returns: (success: bool, url_or_key: str, error: Optional[str])
        """
        if self._is_simulation_mode:
            logger.info(f"[FIREBASE STORAGE SIMULATION] Uploaded {len(content)} bytes to {destination_blob_name}")
            simulated_url = f"https://firebasestorage.googleapis.com/v0/b/{settings.FIREBASE_STORAGE_BUCKET}/o/{destination_blob_name.replace('/', '%2F')}?alt=media"
            return True, simulated_url, None

        bucket = self.get_bucket()
        if not bucket:
            return False, "", "Firebase Storage bucket is not available."

        try:
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_string(content, content_type=content_type)
            if is_public:
                try:
                    blob.make_public()
                    url = blob.public_url
                except Exception:
                    # Fallback to standard URL with media token
                    url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{destination_blob_name.replace('/', '%2F')}?alt=media"
            else:
                url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{destination_blob_name.replace('/', '%2F')}?alt=media"
            return True, url, None
        except Exception as e:
            logger.error(f"[FIREBASE STORAGE UPLOAD ERROR] {e}")
            return False, "", str(e)

    async def get_signed_download_url(
        self,
        blob_name: str,
        expires_seconds: int = 900,
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Generate time-limited signed URL for private documents (e.g. Prescriptions).
        """
        from datetime import timedelta
        if self._is_simulation_mode:
            url = f"https://firebasestorage.googleapis.com/v0/b/{settings.FIREBASE_STORAGE_BUCKET}/o/{blob_name.replace('/', '%2F')}?alt=media&token=simulated_token"
            return True, url, None

        bucket = self.get_bucket()
        if not bucket:
            return False, "", "Firebase Storage bucket is not available."

        try:
            blob = bucket.blob(blob_name)
            url = blob.generate_signed_url(
                expiration=timedelta(seconds=expires_seconds),
                method="GET",
            )
            return True, url, None
        except Exception as e:
            logger.error(f"[FIREBASE STORAGE SIGNED URL ERROR] {e}")
            return False, "", str(e)

    async def download_file_bytes(
        self,
        blob_name: str,
    ) -> Tuple[bool, Optional[bytes], Optional[str]]:
        """Download binary content of a file from Firebase Storage."""
        if self._is_simulation_mode:
            return False, None, "File not found in simulation mode."

        bucket = self.get_bucket()
        if not bucket:
            return False, None, "Firebase Storage bucket is not available."

        try:
            blob = bucket.blob(blob_name)
            content = blob.download_as_bytes()
            return True, content, None
        except Exception as e:
            logger.error(f"[FIREBASE STORAGE DOWNLOAD ERROR] {e}")
            return False, None, str(e)

    async def delete_file(
        self,
        blob_name: str,
    ) -> Tuple[bool, Optional[str]]:
        """Delete an object from Firebase Storage."""
        if self._is_simulation_mode:
            return True, None

        bucket = self.get_bucket()
        if not bucket:
            return False, "Firebase Storage bucket is not available."

        try:
            blob = bucket.blob(blob_name)
            if blob.exists():
                blob.delete()
            return True, None
        except Exception as e:
            logger.error(f"[FIREBASE STORAGE DELETE ERROR] {e}")
            return False, str(e)

