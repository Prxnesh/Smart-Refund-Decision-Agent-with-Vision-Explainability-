from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart Refund Decision Agent"
    api_prefix: str = "/api"

    # Supabase Postgres connection string
    # Format: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
    database_url: str

    frontend_url: str = "http://localhost:5173"

    # Admin credentials (store securely in env, never commit)
    admin_user: str
    admin_pass: str

    # Secret used to sign/verify admin JWTs — generate with: openssl rand -hex 32
    jwt_secret: str

    # Local Ollama settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # Supabase project credentials (service_role key for server-side usage)
    supabase_url: str = ""
    supabase_service_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


def default_policy() -> dict:
    return {
        "refund_window_days": 30,
        "partial_window_days": 60,
        "partial_refund_percent": 0.5,
        "sentiment_threshold": 0.6,
        "fraud_threshold": 0.7,
    }
