# routes/recommendations.py — AI Recommendation Engine API
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.models import Student, Mark, Attendance, ImprovementPlan
from extensions import db
from utils.analysis import generate_recommendations

recommendations_bp = Blueprint("recommendations", __name__)

@recommendations_bp.route("/<roll_no>", methods=["GET"])
@jwt_required()
def get_recommendations(roll_no):
    """Return stored improvement plans for a student."""
    claims = get_jwt()

    if claims["role"] == "student" and claims["roll_no"] != roll_no:
        return jsonify({"error": "Access denied"}), 403

    plans = ImprovementPlan.query.filter_by(roll_no=roll_no).order_by(
        ImprovementPlan.created_date.desc()
    ).all()

    return jsonify([p.to_dict() for p in plans]), 200


@recommendations_bp.route("/generate/<roll_no>", methods=["POST"])
@jwt_required()
def generate_and_save(roll_no):
    """
    AI engine: analyse student data and persist personalised recommendations.
    Admin can generate for any student; students only for themselves.
    """
    claims = get_jwt()

    if claims["role"] == "student" and claims["roll_no"] != roll_no:
        return jsonify({"error": "Access denied"}), 403

    student = Student.query.get_or_404(roll_no)
    marks = Mark.query.filter_by(roll_no=roll_no).all()
    att = Attendance.query.filter_by(roll_no=roll_no).all()

    recs = generate_recommendations(student, marks, att)

    # Persist generated plans
    created = []
    for r in recs:
        plan = ImprovementPlan(
            roll_no=roll_no,
            weakness=r["weakness"],
            recommendation=r["recommendation"],
            priority=r["priority"],
        )
        db.session.add(plan)
        created.append(plan)

    db.session.commit()

    return jsonify([p.to_dict() for p in created]), 201


@recommendations_bp.route("/<int:plan_id>/status", methods=["PATCH"])
@jwt_required()
def update_plan_status(plan_id):
    """Student marks a recommendation as in_progress / completed."""
    plan = ImprovementPlan.query.get_or_404(plan_id)
    data = request.get_json()

    plan.status = data.get("status", plan.status)

    db.session.commit()

    return jsonify(plan.to_dict()), 200


@recommendations_bp.route("/<int:plan_id>", methods=["DELETE"])
@jwt_required()
def delete_plan(plan_id):
    claims = get_jwt()

    if claims["role"] != "admin":
        return jsonify({"error": "Admin only"}), 403

    plan = ImprovementPlan.query.get_or_404(plan_id)

    db.session.delete(plan)
    db.session.commit()

    return jsonify({"message": "Plan deleted"}), 200