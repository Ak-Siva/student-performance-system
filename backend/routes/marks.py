# routes/marks.py — Marks CRUD
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Mark
from extensions import db

marks_bp = Blueprint("marks", __name__)

@marks_bp.route("/<roll_no>", methods=["GET"])
@jwt_required()
def get_marks(roll_no):
    marks = Mark.query.filter_by(roll_no=roll_no).all()
    return jsonify([m.to_dict() for m in marks]), 200

@marks_bp.route("", methods=["POST"])
@jwt_required()
def add_mark():
    _require_admin()
    data = request.get_json()
    mark = Mark(
        roll_no=data["roll_no"],
        subject=data["subject"],
        mark=data["mark"],
        exam_type=data.get("exam_type", "final"),
    )
    db.session.add(mark)
    db.session.commit()
    return jsonify(mark.to_dict()), 201

@marks_bp.route("/<int:mark_id>", methods=["PUT"])
@jwt_required()
def update_mark(mark_id):
    _require_admin()
    mark = Mark.query.get_or_404(mark_id)
    data = request.get_json()
    for field in ("subject", "mark", "exam_type"):
        if field in data:
            setattr(mark, field, data[field])
    db.session.commit()
    return jsonify(mark.to_dict()), 200

@marks_bp.route("/<int:mark_id>", methods=["DELETE"])
@jwt_required()
def delete_mark(mark_id):
    _require_admin()
    mark = Mark.query.get_or_404(mark_id)
    db.session.delete(mark)
    db.session.commit()
    return jsonify({"message": "Mark deleted"}), 200

@marks_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_add_marks():
    """Add multiple marks at once for a student."""
    _require_admin()
    data = request.get_json()  # list of {roll_no, subject, mark, exam_type}
    created = []
    for item in data:
        m = Mark(**item)
        db.session.add(m)
        created.append(m)
    db.session.commit()
    return jsonify([m.to_dict() for m in created]), 201

def _require_admin():
    identity = get_jwt_identity()
    if identity["role"] != "admin":
        from flask import abort
        abort(403)
