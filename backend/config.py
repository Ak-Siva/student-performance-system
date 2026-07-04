# config.py — Application configuration
import os
from datetime import timedelta

class Config:
    # ── Database ──────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:siva2505@localhost/student_performance"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ───────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production-super-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # ── General ───────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "flask-secret-key-change-in-prod")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # ── Thresholds (tunable) ──────────────────────────────────
    WEAK_MARK_THRESHOLD = 50          # marks below this → weak subject
    LOW_ATTENDANCE_THRESHOLD = 75     # attendance below this → at risk
    AT_RISK_AVG_THRESHOLD = 50        # avg marks below this → at-risk student
