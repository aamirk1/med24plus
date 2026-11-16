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
    POSTGRES_DB: str = "online_pharmacy_db"
    DATABASE_URL: Union[str, None] = None
    SYNC_DATABASE_URL: Union[str, None] = None

    # Redis
    REDIS_URL: str = "redis://:redis_dev_secret_2026@localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "change_me_super_secret_jwt_key_at_least_32_chars_long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # Storage (S3 / R2 / MinIO)
    STORAGE_ENDPOINT: str = "https://s3.ap-south-1.amazonaws.com"
    STORAGE_BUCKET: str = "med24plus-private-prescriptions"
    STORAGE_ACCESS_KEY: str = "placeholder_key"
    STORAGE_SECRET_KEY: str = "placeholder_secret"

    # Indian Payment & SMS Gateways
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "rzp_secret_placeholder"
    MSG91_AUTH_KEY: str = "msg91_auth_placeholder"

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
        db = data.get("POSTGRES_DB", "online_pharmacy_db")
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
        db = data.get("POSTGRES_DB", "online_pharmacy_db")
        return f"postgresql+psycopg2://{user}:{password}@{server}:{port}/{db}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

