# routes/reports.py — PDF Report generation
from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models.models import Student, Mark, Attendance, ImprovementPlan
from utils.analysis import compute_performance_summary
import io, textwrap
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/<roll_no>/pdf", methods=["GET"])
@jwt_required()
def generate_pdf(roll_no):
    claims = get_jwt()

    if claims["role"] == "student" and claims["roll_no"] != roll_no:
        return jsonify({"error": "Access denied"}), 403

    student = Student.query.get_or_404(roll_no)
    marks   = Mark.query.filter_by(roll_no=roll_no).all()
    att     = Attendance.query.filter_by(roll_no=roll_no).all()
    plans   = ImprovementPlan.query.filter_by(roll_no=roll_no).all()
    summary = compute_performance_summary(marks, att)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles  = getSampleStyleSheet()
    heading = ParagraphStyle(
        "Heading1Custom",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#1a73e8"),
        spaceAfter=6
    )
    sub = ParagraphStyle(
        "Sub",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#2d3748"),
        spaceAfter=4
    )
    body = styles["BodyText"]
    body.fontSize = 10

    story = []

    # ── Title ─────────────────────────────────────────────────────────────────
    story.append(Paragraph("Student Performance Report", heading))
    story.append(Paragraph("AI-Powered Student Performance Enhancement System", body))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1a73e8")))
    story.append(Spacer(1, 12))

    # ── Personal Details ──────────────────────────────────────────────────────
    story.append(Paragraph("Personal Details", sub))
    personal_data = [
        ["Roll No", student.roll_no, "Name", student.name],
        ["Department", student.department, "Year", f"Year {student.year}"],
        ["Email", student.email, "Phone", student.phone or "—"],
    ]

    pt = Table(personal_data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f0fe")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#e8f0fe")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(pt)
    story.append(Spacer(1, 12))

    # ── Performance Summary ───────────────────────────────────────────────────
    story.append(Paragraph("Performance Summary", sub))

    risk_color = {
        "low": "#38a169",
        "medium": "#d69e2e",
        "high": "#e53e3e"
    }[summary["risk_level"]]

    summary_data = [
        [
            "Average Marks",
            f"{summary['avg_mark']}%",
            "Average Attendance",
            f"{summary['avg_attendance']}%"
        ],
        [
            "Performance Status",
            summary["performance_status"],
            "Risk Level",
            summary["risk_level"].upper()
        ],
    ]

    st = Table(summary_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 4*cm])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f0fe")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#e8f0fe")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(st)
    story.append(Spacer(1, 12))

    # ── Marks Table ───────────────────────────────────────────────────────────
    if marks:
        story.append(Paragraph("Subject-wise Marks", sub))

        mark_data = [["Subject", "Exam Type", "Marks", "Status"]]

        for m in marks:
            status = "✓ Pass" if float(m.mark) >= 50 else "✗ Weak"
            mark_data.append([
                m.subject,
                m.exam_type.capitalize(),
                f"{float(m.mark):.1f}",
                status
            ])

        mt = Table(mark_data, colWidths=[6*cm, 3.5*cm, 2.5*cm, 3*cm])
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a73e8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f7fafc")]),
        ]))
        story.append(mt)
        story.append(Spacer(1, 12))

    # ── Attendance Table ──────────────────────────────────────────────────────
    if att:
        story.append(Paragraph("Attendance Records", sub))

        att_data = [["Subject", "Attendance %", "Classes Attended", "Total Classes", "Status"]]

        for a in att:
            pct = float(a.attendance_percentage)
            status = "✓ OK" if pct >= 75 else "⚠ Low"
            att_data.append([
                a.subject,
                f"{pct:.1f}%",
                str(a.attended_classes),
                str(a.total_classes),
                status
            ])

        at = Table(att_data, colWidths=[5*cm, 2.5*cm, 3*cm, 2.5*cm, 2*cm])
        at.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a73e8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f7fafc")]),
        ]))
        story.append(at)
        story.append(Spacer(1, 12))

    # ── Improvement Plans ─────────────────────────────────────────────────────
    if plans:
        story.append(Paragraph("Personalised Improvement Plans", sub))

        for i, plan in enumerate(plans, 1):
            story.append(Paragraph(f"<b>{i}. {plan.weakness}</b>", body))
            story.append(
                Paragraph(
                    plan.recommendation.replace("\n", "<br/>"),
                    body
                )
            )
            story.append(Spacer(1, 6))

    doc.build(story)

    buf.seek(0)
    filename = f"report_{roll_no}.pdf"

    return send_file(
        buf,
        as_attachment=True,
        download_name=filename,
        mimetype="application/pdf"
    )