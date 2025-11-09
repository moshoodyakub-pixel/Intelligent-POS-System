from pydantic import BaseSettings, Field, SecretStr
from typing import List


class Settings(BaseSettings):
    database_url: str = Field(..., env='DATABASE_URL')
    redis_url: str = Field(..., env='REDIS_URL')
    jwt_secret: SecretStr = Field(..., env='JWT_SECRET')
    jwt_algorithm: str = Field(..., env='JWT_ALGORITHM')
    jwt_expiration_hours: int = Field(..., env='JWT_EXPIRATION_HOURS')
    paystack_public_key: SecretStr = Field(..., env='PAYSTACK_PUBLIC_KEY')
    paystack_secret_key: SecretStr = Field(..., env='PAYSTACK_SECRET_KEY')
    aws_access_key_id: SecretStr = Field(..., env='AWS_ACCESS_KEY_ID')
    aws_secret_access_key: SecretStr = Field(..., env='AWS_SECRET_ACCESS_KEY')
    smtp_host: str = Field(..., env='SMTP_HOST')
    smtp_port: int = Field(..., env='SMTP_PORT')
    smtp_user: str = Field(..., env='SMTP_USER')
    smtp_password: SecretStr = Field(..., env='SMTP_PASSWORD')
    model_paths: List[str] = Field(
        ..., env='MODEL_PATHS', description="Comma-separated paths to model files"
    )
    logging_config: dict = Field(
        ..., env='LOGGING_CONFIG', description="Logging configuration"
    )
    cors_origins: List[str] = Field(
        ..., env='CORS_ORIGINS', description="Comma-separated list of CORS origins"
    )
    rate_limiting: dict = Field(
        ..., env='RATE_LIMITING', description="Rate limiting configuration"
    )
    sentry_dsn: SecretStr = Field(..., env='SENTRY_DSN')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


settings = Settings()
