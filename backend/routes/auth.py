# routes/auth.py — Authentication endpoints
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from models.models import User, Student
from extensions import db

auth_bp = Blueprint("auth", __name__)

# ── POST /api/auth/login ──────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    user = User.query.filter_by(username=data["username"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "username": user.username,
            "role": user.role,
            "roll_no": user.roll_no
        }
    )

    student_data = None
    if user.role == "student" and user.roll_no:
        s = Student.query.get(user.roll_no)
        if s:
            student_data = s.to_dict()

    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "student": student_data
    }), 200


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    claims = get_jwt()

    return jsonify({
        "id": identity,
        "username": claims["username"],
        "role": claims["role"],
        "roll_no": claims["roll_no"]
    }), 200


# ── POST /api/auth/register ───────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
@jwt_required()
def register():
    """Admin-only: create a new user account."""
    caller = get_jwt()

    if caller["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 409

    user = User(
        username=data["username"],
        role=data.get("role", "student"),
        roll_no=data.get("roll_no")
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201


# ── POST /api/auth/change-password ────────────────────────────────────────────
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    user = User.query.get(user_id)
    if not user.check_password(data.get("current_password", "")):
        return jsonify({"error": "Current password incorrect"}), 400

    user.set_password(data["new_password"])
    db.session.commit()

    return jsonify({"message": "Password updated"}), 200