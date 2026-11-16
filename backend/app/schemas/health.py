from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", examples=["ok"])
    application: str = Field(default="online-pharmacy-api", examples=["online-pharmacy-api"])
    version: str = Field(default="1.0.0", examples=["1.0.0"])

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "ok",
                "application": "online-pharmacy-api",
                "version": "1.0.0",
            }
        }
    }
