# routes/students.py — Student CRUD + profile
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.models import Student, Mark, Attendance, ImprovementPlan, User
from extensions import db
from utils.analysis import compute_performance_summary

students_bp = Blueprint("students", __name__)

# ── GET /api/students ─────────────────────────────────────────────────────────
@students_bp.route("", methods=["GET"])
@jwt_required()
def list_students():
    students = Student.query.all()
    result = []
    for s in students:
        marks = Mark.query.filter_by(roll_no=s.roll_no).all()
        attendance = Attendance.query.filter_by(roll_no=s.roll_no).all()
        summary = compute_performance_summary(marks, attendance)
        result.append({**s.to_dict(), **summary})
    return jsonify(result), 200


# ── GET /api/students/<roll_no> ───────────────────────────────────────────────
@students_bp.route("/<roll_no>", methods=["GET"])
@jwt_required()
def get_student(roll_no):
    claims = get_jwt()

    # Students can only view their own profile
    if claims["role"] == "student" and claims["roll_no"] != roll_no:
        return jsonify({"error": "Access denied"}), 403

    s = Student.query.get_or_404(roll_no)
    marks = Mark.query.filter_by(roll_no=roll_no).all()
    attendance = Attendance.query.filter_by(roll_no=roll_no).all()
    plans = ImprovementPlan.query.filter_by(roll_no=roll_no).order_by(
        ImprovementPlan.created_date.desc()
    ).all()
    summary = compute_performance_summary(marks, attendance)

    return jsonify({
        **s.to_dict(),
        **summary,
        "marks": [m.to_dict() for m in marks],
        "attendance": [a.to_dict() for a in attendance],
        "improvement_plans": [p.to_dict() for p in plans],
    }), 200


# ── POST /api/students ────────────────────────────────────────────────────────
@students_bp.route("", methods=["POST"])
@jwt_required()
def create_student():
    _require_admin()
    data = request.get_json()

    if Student.query.get(data.get("roll_no")):
        return jsonify({"error": "Roll number already exists"}), 409

    s = Student(**{
        k: data[k]
        for k in (
            "roll_no",
            "name",
            "department",
            "year",
            "email",
            "phone"
        )
        if k in data
    })

    db.session.add(s)
    db.session.commit()

    return jsonify(s.to_dict()), 201


# ── PUT /api/students/<roll_no> ───────────────────────────────────────────────
@students_bp.route("/<roll_no>", methods=["PUT"])
@jwt_required()
def update_student(roll_no):
    _require_admin()

    s = Student.query.get_or_404(roll_no)
    data = request.get_json()

    for field in ("name", "department", "year", "email", "phone"):
        if field in data:
            setattr(s, field, data[field])

    db.session.commit()

    return jsonify(s.to_dict()), 200


# ── DELETE /api/students/<roll_no> ────────────────────────────────────────────
@students_bp.route("/<roll_no>", methods=["DELETE"])
@jwt_required()
def delete_student(roll_no):
    _require_admin()

    s = Student.query.get_or_404(roll_no)

    db.session.delete(s)
    db.session.commit()

    return jsonify({"message": "Student deleted"}), 200


# ── helpers ───────────────────────────────────────────────────────────────────
def _require_admin():
    claims = get_jwt()

    if claims["role"] != "admin":
        from flask import abort
        abort(403, description="Admin access required")