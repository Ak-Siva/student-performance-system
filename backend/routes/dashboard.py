# routes/dashboard.py — Dashboard statistics API
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.models import Student, Mark, Attendance
from utils.analysis import compute_performance_summary, predict_risk_level

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    students = Student.query.all()
    total = len(students)
    if total == 0:
        return jsonify({"total_students": 0}), 200

    all_avgs_mark = []
    all_avgs_att  = []
    at_risk       = []
    top_performers = []

    for s in students:
        marks = Mark.query.filter_by(roll_no=s.roll_no).all()
        att   = Attendance.query.filter_by(roll_no=s.roll_no).all()
        summary = compute_performance_summary(marks, att)

        all_avgs_mark.append(summary["avg_mark"])
        all_avgs_att.append(summary["avg_attendance"])

        if summary["risk_level"] == "high":
            at_risk.append({**s.to_dict(), **summary})
        if summary["avg_mark"] >= 80:
            top_performers.append({**s.to_dict(), **summary})

    overall_avg_mark = round(sum(all_avgs_mark) / total, 1)
    overall_avg_att  = round(sum(all_avgs_att)  / total, 1)

    # Department-wise breakdown
    dept_map = {}
    for s, avg in zip(students, all_avgs_mark):
        dept_map.setdefault(s.department, []).append(avg)
    dept_stats = {dept: round(sum(v) / len(v), 1) for dept, v in dept_map.items()}

    return jsonify({
        "total_students":     total,
        "avg_mark":           overall_avg_mark,
        "avg_attendance":     overall_avg_att,
        "at_risk_count":      len(at_risk),
        "at_risk_students":   at_risk[:5],
        "top_performers":     sorted(top_performers, key=lambda x: x["avg_mark"], reverse=True)[:5],
        "department_stats":   dept_stats,
        "performance_distribution": _grade_distribution(all_avgs_mark),
    }), 200


def _grade_distribution(avgs):
    dist = {"Excellent": 0, "Good": 0, "Average": 0, "Below Average": 0, "At Risk": 0}
    for avg in avgs:
        if avg >= 85:   dist["Excellent"]     += 1
        elif avg >= 70: dist["Good"]          += 1
        elif avg >= 55: dist["Average"]       += 1
        elif avg >= 40: dist["Below Average"] += 1
        else:           dist["At Risk"]       += 1
    return dist
