# utils/analysis.py — Performance Analysis & AI Recommendation Engine
"""
Core intelligence layer:
  1. compute_performance_summary  – aggregate stats + risk level
  2. generate_recommendations     – personalised improvement plan
  3. predict_risk_level           – multi-factor risk score
"""

from config import Config

WEAK_MARK_THRESHOLD      = Config.WEAK_MARK_THRESHOLD       # default 50
LOW_ATT_THRESHOLD        = Config.LOW_ATTENDANCE_THRESHOLD  # default 75
AT_RISK_AVG_THRESHOLD    = Config.AT_RISK_AVG_THRESHOLD     # default 50


# ─────────────────────────────────────────────────────────────────────────────
# 1. compute_performance_summary
# ─────────────────────────────────────────────────────────────────────────────
def compute_performance_summary(marks, attendance):
    """
    Returns a dict with:
      avg_mark, avg_attendance, risk_level, performance_status,
      weak_subjects, low_attendance_subjects
    """
    mark_values  = [float(m.mark) for m in marks]
    att_values   = [float(a.attendance_percentage) for a in attendance]

    avg_mark       = round(sum(mark_values) / len(mark_values), 1)   if mark_values  else 0
    avg_attendance = round(sum(att_values)  / len(att_values),  1)   if att_values   else 0

    # Per-subject averages (handle multiple exam types)
    subject_marks = {}
    for m in marks:
        subject_marks.setdefault(m.subject, []).append(float(m.mark))
    subject_avg = {s: round(sum(v) / len(v), 1) for s, v in subject_marks.items()}

    weak_subjects           = [s for s, avg in subject_avg.items() if avg < WEAK_MARK_THRESHOLD]
    low_attendance_subjects = [a.subject for a in attendance if float(a.attendance_percentage) < LOW_ATT_THRESHOLD]

    risk_level         = predict_risk_level(avg_mark, avg_attendance, weak_subjects, low_attendance_subjects)
    performance_status = _performance_label(avg_mark)

    return {
        "avg_mark":                  avg_mark,
        "avg_attendance":            avg_attendance,
        "risk_level":                risk_level,
        "performance_status":        performance_status,
        "weak_subjects":             weak_subjects,
        "low_attendance_subjects":   low_attendance_subjects,
        "subject_averages":          subject_avg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. predict_risk_level
# ─────────────────────────────────────────────────────────────────────────────
def predict_risk_level(avg_mark, avg_attendance, weak_subjects, low_att_subjects):
    """
    Multi-factor risk scoring (0-100).
    High ≥ 60 | Medium 30–59 | Low < 30
    """
    score = 0

    # Mark-based risk (0-40 pts)
    if avg_mark < 40:
        score += 40
    elif avg_mark < 50:
        score += 30
    elif avg_mark < 60:
        score += 15
    elif avg_mark < 75:
        score += 5

    # Attendance-based risk (0-30 pts)
    if avg_attendance < 60:
        score += 30
    elif avg_attendance < 75:
        score += 20
    elif avg_attendance < 85:
        score += 8

    # Number of weak subjects (0-20 pts)
    score += min(len(weak_subjects) * 5, 20)

    # Low-attendance subject count (0-10 pts)
    score += min(len(low_att_subjects) * 3, 10)

    if score >= 60:
        return "high"
    elif score >= 30:
        return "medium"
    else:
        return "low"


# ─────────────────────────────────────────────────────────────────────────────
# 3. generate_recommendations
# ─────────────────────────────────────────────────────────────────────────────
def generate_recommendations(student, marks, attendance):
    """
    Returns a list of recommendation dicts:
      {weakness, recommendation, priority}
    """
    summary = compute_performance_summary(marks, attendance)
    recs    = []

    # ── Weak subject recommendations ─────────────────────────────────────────
    for subject in summary["weak_subjects"]:
        avg = summary["subject_averages"].get(subject, 0)
        priority = "high" if avg < 35 else "medium"
        recs.append({
            "weakness": f"{subject}: {avg}% marks (below {WEAK_MARK_THRESHOLD}% threshold)",
            "recommendation": _subject_study_plan(subject, avg),
            "priority": priority,
        })

    # ── Low attendance recommendations ───────────────────────────────────────
    for att in attendance:
        pct = float(att.attendance_percentage)
        if pct < LOW_ATT_THRESHOLD:
            recs.append({
                "weakness": f"{att.subject}: {pct}% attendance (below {LOW_ATT_THRESHOLD}% required)",
                "recommendation": _attendance_plan(att.subject, pct, att.total_classes, att.attended_classes),
                "priority": "high" if pct < 60 else "medium",
            })

    # ── Overall risk recommendations ─────────────────────────────────────────
    if summary["risk_level"] == "high":
        recs.append({
            "weakness": f"Overall performance at high risk — average marks {summary['avg_mark']}%",
            "recommendation": (
                "📅 Create a structured daily timetable dedicating at least 5 hours to academics. "
                "• Seek faculty mentoring sessions twice per week. "
                "• Join peer study groups for mutual support. "
                "• Complete one past-question paper per subject every weekend. "
                "• Set weekly measurable targets and track completion daily."
            ),
            "priority": "high",
        })
    elif summary["risk_level"] == "medium":
        recs.append({
            "weakness": f"Moderate performance risk — average marks {summary['avg_mark']}%",
            "recommendation": (
                "📈 Focus on weaker subjects first. "
                "• Study for at least 3 hours daily. "
                "• Take chapter-level tests weekly to track progress. "
                "• Review and revise notes within 24 hours of each lecture. "
                "• Practice time-management using the Pomodoro technique (25 min study / 5 min break)."
            ),
            "priority": "medium",
        })

    # ── Time management ───────────────────────────────────────────────────────
    if summary["avg_attendance"] >= LOW_ATT_THRESHOLD and summary["avg_mark"] < 65:
        recs.append({
            "weakness": "Good attendance but below-average marks — study strategy needs improvement",
            "recommendation": (
                "🧠 Active recall and spaced repetition are more effective than passive reading. "
                "• After each class, write a 1-page summary without looking at notes. "
                "• Use flashcards (Anki) for formulas and definitions. "
                "• Solve at least 10 practice problems per subject per week. "
                "• Form a study group to explain concepts to each other."
            ),
            "priority": "medium",
        })

    # ── Top-performer encouragement ───────────────────────────────────────────
    if summary["risk_level"] == "low" and summary["avg_mark"] >= 80:
        recs.append({
            "weakness": "Maintaining excellence",
            "recommendation": (
                "🏆 Excellent performance! To excel further: "
                "• Participate in technical competitions and hackathons. "
                "• Take on peer-tutoring roles to deepen understanding. "
                "• Explore advanced certifications in your domain. "
                "• Build projects that apply classroom knowledge practically."
            ),
            "priority": "low",
        })

    return recs


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────
def _subject_study_plan(subject, avg_mark):
    """Build a subject-specific study plan based on current score."""
    hours = 3 if avg_mark < 35 else (2 if avg_mark < 45 else 1)
    exercises = 15 if avg_mark < 35 else 10
    return (
        f"📘 {subject} Improvement Plan:\n"
        f"• Dedicate {hours} hour(s) daily to {subject}.\n"
        f"• Complete {exercises} practice problems or exercises every week.\n"
        f"• Re-study all topics where marks were below 40%.\n"
        f"• Take a timed mock test on {subject} every Saturday.\n"
        f"• Consult the faculty or use online resources (NPTEL, Khan Academy) for difficult topics.\n"
        f"• Review previous years' question papers to identify high-weightage topics."
    )


def _attendance_plan(subject, pct, total, attended):
    classes_needed = 0
    if total and pct < 75:
        # Minimum classes to reach 75%: x such that (attended+x)/(total+x) >= 0.75
        if attended / total < 0.75:
            # attended + x >= 0.75*(total + x) => x(1-0.75) >= 0.75*total - attended
            x_needed = (0.75 * total - attended) / (1 - 0.75)
            classes_needed = max(0, int(x_needed) + 1)

    plan = (
        f"🗓️ {subject} Attendance Recovery Plan:\n"
        f"• Current attendance: {pct}% — below the {LOW_ATT_THRESHOLD}% minimum.\n"
        f"• Attend ALL remaining {subject} classes without exception.\n"
    )
    if classes_needed:
        plan += f"• You need to attend at least {classes_needed} more classes to reach 75%.\n"
    plan += (
        f"• If you must miss a class, get notes from a classmate immediately.\n"
        f"• Discuss with the faculty about compensating through extra assignments.\n"
        f"• Set a phone reminder 15 minutes before every {subject} class."
    )
    return plan


def _performance_label(avg_mark):
    if avg_mark >= 85:
        return "Excellent"
    elif avg_mark >= 70:
        return "Good"
    elif avg_mark >= 55:
        return "Average"
    elif avg_mark >= 40:
        return "Below Average"
    else:
        return "At Risk"
