# models/models.py — SQLAlchemy ORM models
from extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# ── User ──────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum("admin", "student"), nullable=False, default="student")
    roll_no       = db.Column(db.String(20), db.ForeignKey("students.roll_no"), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username, "role": self.role, "roll_no": self.roll_no}


# ── Student ───────────────────────────────────────────────────────────────────
class Student(db.Model):
    __tablename__ = "students"

    roll_no    = db.Column(db.String(20), primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    year       = db.Column(db.Integer, nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    phone      = db.Column(db.String(15))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    marks             = db.relationship("Mark",            backref="student", lazy=True, cascade="all, delete-orphan")
    attendance_records = db.relationship("Attendance",     backref="student", lazy=True, cascade="all, delete-orphan")
    improvement_plans = db.relationship("ImprovementPlan", backref="student", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "roll_no":    self.roll_no,
            "name":       self.name,
            "department": self.department,
            "year":       self.year,
            "email":      self.email,
            "phone":      self.phone,
        }


# ── Mark ──────────────────────────────────────────────────────────────────────
class Mark(db.Model):
    __tablename__ = "marks"

    id          = db.Column(db.Integer, primary_key=True)
    roll_no     = db.Column(db.String(20), db.ForeignKey("students.roll_no"), nullable=False)
    subject     = db.Column(db.String(100), nullable=False)
    mark        = db.Column(db.Numeric(5, 2), nullable=False)
    exam_type   = db.Column(db.Enum("internal1", "internal2", "final"), default="final")
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "roll_no":     self.roll_no,
            "subject":     self.subject,
            "mark":        float(self.mark),
            "exam_type":   self.exam_type,
            "recorded_at": self.recorded_at.isoformat(),
        }


# ── Attendance ────────────────────────────────────────────────────────────────
class Attendance(db.Model):
    __tablename__ = "attendance"

    id                    = db.Column(db.Integer, primary_key=True)
    roll_no               = db.Column(db.String(20), db.ForeignKey("students.roll_no"), nullable=False)
    subject               = db.Column(db.String(100), nullable=False)
    attendance_percentage = db.Column(db.Numeric(5, 2), nullable=False)
    total_classes         = db.Column(db.Integer, default=0)
    attended_classes      = db.Column(db.Integer, default=0)
    updated_at            = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id":                    self.id,
            "roll_no":               self.roll_no,
            "subject":               self.subject,
            "attendance_percentage": float(self.attendance_percentage),
            "total_classes":         self.total_classes,
            "attended_classes":      self.attended_classes,
        }


# ── ImprovementPlan ───────────────────────────────────────────────────────────
class ImprovementPlan(db.Model):
    __tablename__ = "improvement_plans"

    id             = db.Column(db.Integer, primary_key=True)
    roll_no        = db.Column(db.String(20), db.ForeignKey("students.roll_no"), nullable=False)
    weakness       = db.Column(db.Text, nullable=False)
    recommendation = db.Column(db.Text, nullable=False)
    priority       = db.Column(db.Enum("low", "medium", "high"), default="medium")
    status         = db.Column(db.Enum("pending", "in_progress", "completed"), default="pending")
    created_date   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":             self.id,
            "roll_no":        self.roll_no,
            "weakness":       self.weakness,
            "recommendation": self.recommendation,
            "priority":       self.priority,
            "status":         self.status,
            "created_date":   self.created_date.isoformat(),
        }
