# routes/attendance.py — Attendance CRUD
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Attendance
from extensions import db

attendance_bp = Blueprint("attendance", __name__)

@attendance_bp.route("/<roll_no>", methods=["GET"])
@jwt_required()
def get_attendance(roll_no):
    records = Attendance.query.filter_by(roll_no=roll_no).all()
    return jsonify([r.to_dict() for r in records]), 200

@attendance_bp.route("", methods=["POST"])
@jwt_required()
def add_attendance():
    _require_admin()
    data = request.get_json()
    # Calculate percentage if raw counts provided
    if "total_classes" in data and "attended_classes" in data and data["total_classes"] > 0:
        data["attendance_percentage"] = round(
            (data["attended_classes"] / data["total_classes"]) * 100, 2
        )
    record = Attendance(
        roll_no=data["roll_no"],
        subject=data["subject"],
        attendance_percentage=data["attendance_percentage"],
        total_classes=data.get("total_classes", 0),
        attended_classes=data.get("attended_classes", 0),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201

@attendance_bp.route("/<int:att_id>", methods=["PUT"])
@jwt_required()
def update_attendance(att_id):
    _require_admin()
    record = Attendance.query.get_or_404(att_id)
    data = request.get_json()
    for field in ("subject", "attendance_percentage", "total_classes", "attended_classes"):
        if field in data:
            setattr(record, field, data[field])
    if record.total_classes and record.total_classes > 0:
        record.attendance_percentage = round(
            (record.attended_classes / record.total_classes) * 100, 2
        )
    db.session.commit()
    return jsonify(record.to_dict()), 200

@attendance_bp.route("/<int:att_id>", methods=["DELETE"])
@jwt_required()
def delete_attendance(att_id):
    _require_admin()
    record = Attendance.query.get_or_404(att_id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200

def _require_admin():
    identity = get_jwt_identity()
    if identity["role"] != "admin":
        from flask import abort
        abort(403)
