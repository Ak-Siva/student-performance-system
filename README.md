# AI-Powered Student Performance Enhancement System

A full-stack academic intelligence platform built with **React.js**, **Flask**, **MySQL**, and **Chart.js**.

---

## 📁 Folder Structure

```
student-performance-system/
├── backend/
│   ├── app.py                  # Flask app factory + blueprint registration
│   ├── config.py               # DB URL, JWT secret, performance thresholds
│   ├── extensions.py           # Shared SQLAlchemy instance
│   ├── seed_db.py              # One-time database seeder with sample data
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   └── models.py           # ORM: User, Student, Mark, Attendance, ImprovementPlan
│   ├── routes/
│   │   ├── auth.py             # Login, register, change-password
│   │   ├── students.py         # Student CRUD + profile endpoint
│   │   ├── marks.py            # Marks CRUD + bulk insert
│   │   ├── attendance.py       # Attendance CRUD
│   │   ├── recommendations.py  # AI plan generation + status updates
│   │   ├── dashboard.py        # Aggregate stats for dashboard
│   │   └── reports.py          # PDF report generation (ReportLab)
│   └── utils/
│       └── analysis.py         # AI engine: risk scoring + recommendations
├── frontend/
│   ├── public/index.html
│   ├── package.json
│   └── src/
│       ├── index.js / index.css  # Entry + global styles
│       ├── App.js                # Router + protected routes
│       ├── utils/
│       │   ├── api.js            # Axios instance with JWT interceptors
│       │   └── AuthContext.js    # React context for auth state
│       ├── components/Common/
│       │   └── AppShell.js       # Sidebar + topbar layout
│       └── pages/
│           ├── LoginPage.js
│           ├── DashboardPage.js
│           ├── StudentsPage.js
│           ├── StudentProfilePage.js
│           ├── MarksPage.js
│           ├── AttendancePage.js
│           ├── RecommendationsPage.js
│           └── MyProfilePage.js
└── database/
    └── schema.sql              # Full MySQL schema + sample data
```

---

## ⚙️ Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| npm | 9+ |

---

## 🚀 Setup Instructions

### Step 1 — MySQL Database

```bash
# Log into MySQL
mysql -u root -p

# Create the database
CREATE DATABASE student_performance;
EXIT;
```

### Step 2 — Backend Setup

```bash
cd student-performance-system/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
.\venv\Scripts\Activate.ps1
# Install dependencies
pip install -r requirements.txt
```

**Configure the database connection** — edit `config.py`:
```python
SQLALCHEMY_DATABASE_URI = "mysql+pymysql://YOUR_USER:YOUR_PASS@localhost/student_performance"
```
Or set an environment variable:
```bash
export DATABASE_URL="mysql+pymysql://root:password@localhost/student_performance"
export JWT_SECRET_KEY="your-very-secret-key-here"
```

**Seed the database** (creates all tables + sample data):
```bash
python seed_db.py
```

**Start the backend server**:
```bash
python app.py
# → Running on http://localhost:5000
```

### Step 3 — Frontend Setup

```bash
cd ../frontend

# Install Node dependencies
npm install

# Start the development server
npm start
# → Running on http://localhost:3000
```

---

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin / Faculty | `admin` | `Admin@123` |
| Student | `CS21001` | `Student@123` |
| Student | `CS21002` | `Student@123` |

> All student accounts use roll number as username and `Student@123` as password.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns JWT) |
| GET  | `/api/auth/me` | Current user info |
| POST | `/api/auth/register` | Create user (admin only) |
| POST | `/api/auth/change-password` | Change password |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/students` | List all students with performance summary |
| GET    | `/api/students/:roll_no` | Full student profile |
| POST   | `/api/students` | Add student (admin) |
| PUT    | `/api/students/:roll_no` | Update student (admin) |
| DELETE | `/api/students/:roll_no` | Delete student (admin) |

### Marks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/marks/:roll_no` | Get marks for student |
| POST   | `/api/marks` | Add mark |
| PUT    | `/api/marks/:id` | Update mark |
| DELETE | `/api/marks/:id` | Delete mark |
| POST   | `/api/marks/bulk` | Bulk insert marks |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/attendance/:roll_no` | Get attendance |
| POST   | `/api/attendance` | Add record |
| PUT    | `/api/attendance/:id` | Update record |
| DELETE | `/api/attendance/:id` | Delete record |

### AI Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/recommendations/:roll_no` | Stored plans |
| POST   | `/api/recommendations/generate/:roll_no` | Generate AI plan |
| PATCH  | `/api/recommendations/:id/status` | Update plan status |
| DELETE | `/api/recommendations/:id` | Delete plan |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/dashboard/stats` | Aggregate stats |
| GET    | `/api/reports/:roll_no/pdf` | Download PDF report |

---

## 🤖 AI Recommendation Engine

Located in `backend/utils/analysis.py`, the engine works in three layers:

**1. Performance Summary** (`compute_performance_summary`)
- Calculates average marks and attendance per student
- Identifies weak subjects (marks < 50%) and low-attendance subjects (< 75%)
- Assigns a performance label: Excellent / Good / Average / Below Average / At Risk

**2. Risk Prediction** (`predict_risk_level`)
Multi-factor weighted scoring (0–100):
- Marks contribution: 0–40 points based on average
- Attendance contribution: 0–30 points based on average
- Weak subjects count: up to 20 points
- Low attendance subjects: up to 10 points
- Score ≥ 60 → High Risk | 30–59 → Medium | < 30 → Low

**3. Recommendation Generation** (`generate_recommendations`)
Produces targeted plans for:
- Each weak subject (study hours, exercises, mock tests)
- Each low-attendance subject (classes needed to reach 75%)
- Overall risk level (structured timetable, peer groups, mentoring)
- Study strategy improvements (active recall, spaced repetition)
- Top performer encouragement (competitions, certifications)

---

## 🎨 UI Features

- **Modern dark sidebar** with role-based navigation
- **Responsive design** — works on mobile, tablet, and desktop
- **Interactive charts** — Bar, Doughnut, and Radar charts via Chart.js
- **Progress bars** — colour-coded green/yellow/red for instant insight
- **Risk badges** — visual risk level indicators on every student row
- **Modal forms** — Add/Edit students, marks, and attendance inline
- **PDF download** — Full student report with one click
- **Tab navigation** — Profile pages organised into Overview / Marks / Attendance / Plans

---

## 🔧 Configuration Tuning

Edit `backend/config.py` to adjust thresholds:

```python
WEAK_MARK_THRESHOLD      = 50   # Marks below this → weak subject
LOW_ATTENDANCE_THRESHOLD = 75   # Attendance below this → at risk
AT_RISK_AVG_THRESHOLD    = 50   # Average marks below this → at-risk student
```

---

## 🏭 Production Deployment

### Backend (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### Frontend (Build)
```bash
npm run build
# Serve the /build folder with nginx or any static host
```

### Environment Variables (Production)
```bash
DATABASE_URL=mysql+pymysql://user:pass@db-host/student_performance
JWT_SECRET_KEY=very-long-random-string-here
SECRET_KEY=another-random-string
FLASK_DEBUG=0
```

---

## 📊 Sample Data Included

| Department | Students |
|-----------|---------|
| Computer Science (Year 3) | CS21001–CS21005 |
| Electronics (Year 2) | EC21001–EC21003 |
| Mechanical (Year 1) | ME21001–ME21002 |
| Computer Science (Year 2) | CS22001–CS22002 |

Covers a range of scenarios: top performers, at-risk students, weak subjects, and low attendance.
