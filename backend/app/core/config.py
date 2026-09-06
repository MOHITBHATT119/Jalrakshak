"""Application configuration using pydantic-settings."""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # IBM watsonx.ai
    watsonx_project_id: str = ""
    watsonx_api_key: str = ""
    watsonx_ai_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "ibm/granite-4-h-small"
    demo_mode: bool = False

    # App
    app_name: str = "JalRakshak AI 2.0"
    app_debug: bool = False

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../.env")
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def watsonx_configured(self) -> bool:
        return bool(self.watsonx_api_key and self.watsonx_project_id)

    @property
    def effective_demo_mode(self) -> bool:
        # Also check env var directly so test overrides work
        if os.environ.get("DEMO_MODE", "").lower() in ("true", "1", "yes"):
            return True
        return self.demo_mode or not self.watsonx_configured


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
