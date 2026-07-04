# config.py — Application configuration
import os
from datetime import timedelta

class Config:
    # ── Database ──────────────────────────────────────────────
    database_url = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:siva2505@localhost/student_performance"
    )

    # Remove unsupported Aiven parameter for PyMySQL
    if database_url:
        database_url = database_url.replace("?ssl-mode=REQUIRED", "")

    SQLALCHEMY_DATABASE_URI = database_url

    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "ssl": {}
        }
    }

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ───────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-in-production-super-secret"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # ── General ───────────────────────────────────────────────
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "flask-secret-key-change-in-prod"
    )
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # ── Thresholds (tunable) ──────────────────────────────────
    WEAK_MARK_THRESHOLD = 50
    LOW_ATTENDANCE_THRESHOLD = 75
    AT_RISK_AVG_THRESHOLD = 50