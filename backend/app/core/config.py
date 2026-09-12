"""Application configuration using pydantic-settings."""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


def _find_env_files() -> tuple:
    """Find .env file from project root, backend root, or working directory."""
    candidates = []
    if os.environ.get("ENV_FILE"):
        candidates.append(os.environ["ENV_FILE"])
    here = os.path.dirname(os.path.abspath(__file__))
    candidates.extend([
        os.path.normpath(os.path.join(here, "../../../.env")),  # workspace root
        os.path.normpath(os.path.join(here, "../../.env")),     # backend root
        os.path.normpath(os.path.join(here, "../.env")),
        os.path.join(os.getcwd(), ".env"),
    ])
    existing = [p for p in dict.fromkeys(candidates) if os.path.isfile(p)]
    return tuple(existing) if existing else (".env",)


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

    # Admin auth — declared here so pydantic-settings doesn't reject them
    admin_username: str = "admin"
    admin_password: str = "jalrakshak2024"
    admin_password_hash: str = ""
    jwt_secret_key: str = "CHANGE_ME_IN_PROD_jalrakshak_2024_secret"

    model_config = SettingsConfigDict(
        env_file=_find_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

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
