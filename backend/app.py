# =============================================================
# app.py — Flask application entry point
# AI-Powered Student Performance Enhancement System
# =============================================================
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.students import students_bp
from routes.marks import marks_bp
from routes.attendance import attendance_bp
from routes.recommendations import recommendations_bp
from routes.reports import reports_bp
from routes.dashboard import dashboard_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ----------------------------
    # JWT Configuration
    # ----------------------------
    app.config["JWT_IDENTITY_CLAIM"] = "identity"

    # Extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp,            url_prefix="/api/auth")
    app.register_blueprint(students_bp,        url_prefix="/api/students")
    app.register_blueprint(marks_bp,           url_prefix="/api/marks")
    app.register_blueprint(attendance_bp,      url_prefix="/api/attendance")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")
    app.register_blueprint(reports_bp,         url_prefix="/api/reports")
    app.register_blueprint(dashboard_bp,       url_prefix="/api/dashboard")

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)