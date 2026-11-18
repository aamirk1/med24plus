import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Med24Plus"
    APPLICATION_NAME: str = "online-pharmacy-api"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "pharmacy_user"
    POSTGRES_PASSWORD: str = "pharmacy_secure_dev_pass_2026"
    POSTGRES_DB: str = "med24plus_db"
    DATABASE_URL: Union[str, None] = None
    SYNC_DATABASE_URL: Union[str, None] = None

    # Redis
    REDIS_URL: str = "redis://:redis_dev_secret_2026@localhost:6379/0"

    # JWT & Session
    JWT_SECRET_KEY: str = "change_me_super_secret_jwt_key_at_least_32_chars_long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OTP Configuration
    OTP_EXPIRE_MINUTES: int = 5
    OTP_COOLDOWN_SECONDS: int = 60
    OTP_MAX_ATTEMPTS: int = 5

    # Account Protection & Lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # Cookie Security
    AUTH_COOKIE_NAME: str = "med24_access_token"
    REFRESH_COOKIE_NAME: str = "med24_refresh_token"
    COOKIE_DOMAIN: Union[str, None] = None
    COOKIE_SECURE: bool = False  # Set True in production
    COOKIE_SAMESITE: str = "lax"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3024",
        "http://localhost:3025",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # Storage Configuration (Amazon S3 commented out in favor of Firebase Cloud Storage)
    # STORAGE_ENDPOINT: str = "https://s3.ap-south-1.amazonaws.com"
    # STORAGE_BUCKET: str = "med24plus-private-prescriptions"
    # STORAGE_ACCESS_KEY: str = "placeholder_key"
    # STORAGE_SECRET_KEY: str = "placeholder_secret"
    STORAGE_PROVIDER: str = "firebase"
    FIREBASE_STORAGE_BUCKET: str = "med24plus.firebasestorage.app"

    # Indian Payment Gateway (Razorpay) & Financial Management (Phase 9)
    PAYMENT_PROVIDER: str = "razorpay"
    PAYMENT_MODE: str = "sandbox"
    PAYMENT_CURRENCY: str = "INR"
    PAYMENT_ENABLED: bool = True
    PAYMENT_TIMEOUT_SECONDS: int = 900  # 15 minutes session expiry
    RESERVATION_EXPIRY_MINUTES: int = 30  # 30 minutes reservation release window
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "rzp_secret_placeholder"
    RAZORPAY_WEBHOOK_SECRET: str = "rzp_webhook_secret_placeholder"
    RAZORPAY_BASE_URL: str = "https://api.razorpay.com/v1"

    # Third-party SMS Service Provider credentials (commented out in favor of Firebase Phone Auth & OTP)
    # MSG91_AUTH_KEY: str = "msg91_auth_placeholder"
    # FAST2SMS_API_KEY: str = "fast2sms_api_key_placeholder"

    # Firebase Admin SDK, Push Notifications (FCM) & Cloud Storage
    FIREBASE_CREDENTIALS_PATH: Union[str, None] = None
    FIREBASE_PROJECT_ID: str = "med24plus"

    @property
    def is_live_payment_configured(self) -> bool:
        """Determines if valid live or registered sandbox credentials are set."""
        return (
            bool(self.RAZORPAY_KEY_ID)
            and not self.RAZORPAY_KEY_ID.startswith("rzp_test_placeholder")
            and bool(self.RAZORPAY_KEY_SECRET)
            and not self.RAZORPAY_KEY_SECRET.startswith("rzp_secret_placeholder")
        )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        if isinstance(v, str) and v.strip():
            return v
        data = info.data
        user = data.get("POSTGRES_USER", "pharmacy_user")
        password = data.get("POSTGRES_PASSWORD", "pharmacy_secure_dev_pass_2026")
        server = data.get("POSTGRES_SERVER", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "med24plus_db")
        return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def assemble_sync_db_connection(cls, v: Union[str, None], info) -> str:
        if isinstance(v, str) and v.strip():
            return v
        data = info.data
        user = data.get("POSTGRES_USER", "pharmacy_user")
        password = data.get("POSTGRES_PASSWORD", "pharmacy_secure_dev_pass_2026")
        server = data.get("POSTGRES_SERVER", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "med24plus_db")
        return f"postgresql+psycopg2://{user}:{password}@{server}:{port}/{db}"

    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"),
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

