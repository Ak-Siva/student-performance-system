-- ============================================================
-- AI-Powered Student Performance Enhancement System
-- Database Schema + Sample Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_performance;
USE student_performance;

-- --------------------------------------------------------
-- Users table (admin/faculty and students share auth here)
-- --------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    roll_no VARCHAR(20) NULL,                  -- links student user to students table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Students table
-- --------------------------------------------------------
CREATE TABLE students (
    roll_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 4),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Marks table (one row per student per subject)
-- --------------------------------------------------------
CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    mark DECIMAL(5,2) NOT NULL CHECK (mark BETWEEN 0 AND 100),
    exam_type ENUM('internal1', 'internal2', 'final') DEFAULT 'final',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Attendance table
-- --------------------------------------------------------
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL CHECK (attendance_percentage BETWEEN 0 AND 100),
    total_classes INT DEFAULT 0,
    attended_classes INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Improvement Plans table
-- --------------------------------------------------------
CREATE TABLE improvement_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) NOT NULL,
    weakness TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_marks_roll ON marks(roll_no);
CREATE INDEX idx_attendance_roll ON attendance(roll_no);
CREATE INDEX idx_plans_roll ON improvement_plans(roll_no);
CREATE INDEX idx_users_roll ON users(roll_no);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (username, password_hash, role) VALUES
('admin', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'admin');

-- Students
INSERT INTO students (roll_no, name, department, year, email, phone) VALUES
('CS21001', 'Arjun Sharma',      'Computer Science', 3, 'arjun.sharma@college.edu',   '9876543210'),
('CS21002', 'Priya Nair',        'Computer Science', 3, 'priya.nair@college.edu',      '9876543211'),
('CS21003', 'Rahul Verma',       'Computer Science', 3, 'rahul.verma@college.edu',     '9876543212'),
('CS21004', 'Sneha Patel',       'Computer Science', 3, 'sneha.patel@college.edu',     '9876543213'),
('CS21005', 'Vikram Rajan',      'Computer Science', 3, 'vikram.rajan@college.edu',    '9876543214'),
('EC21001', 'Divya Menon',       'Electronics',      2, 'divya.menon@college.edu',     '9876543215'),
('EC21002', 'Kiran Reddy',       'Electronics',      2, 'kiran.reddy@college.edu',     '9876543216'),
('EC21003', 'Ananya Singh',      'Electronics',      2, 'ananya.singh@college.edu',    '9876543217'),
('ME21001', 'Rohan Kumar',       'Mechanical',       1, 'rohan.kumar@college.edu',     '9876543218'),
('ME21002', 'Lakshmi Iyer',      'Mechanical',       1, 'lakshmi.iyer@college.edu',    '9876543219'),
('CS22001', 'Aditya Rao',        'Computer Science', 2, 'aditya.rao@college.edu',      '9876543220'),
('CS22002', 'Meera Krishnan',    'Computer Science', 2, 'meera.krishnan@college.edu',  '9876543221');

-- Student user accounts (password for all: Student@123 — replace hash at runtime)
INSERT INTO users (username, password_hash, role, roll_no) VALUES
('CS21001', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'student', 'CS21001'),
('CS21002', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'student', 'CS21002'),
('CS21003', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'student', 'CS21003'),
('CS21004', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'student', 'CS21004'),
('CS21005', 'pbkdf2:sha256:260000$dummy_hash_replace_at_runtime', 'student', 'CS21005');

-- Marks - CS 3rd year
INSERT INTO marks (roll_no, subject, mark, exam_type) VALUES
-- Arjun Sharma (good performer)
('CS21001', 'Data Structures',         78, 'internal1'),
('CS21001', 'Data Structures',         82, 'final'),
('CS21001', 'Operating Systems',       85, 'final'),
('CS21001', 'Database Management',     90, 'final'),
('CS21001', 'Programming',             35, 'final'),   -- weak subject
('CS21001', 'Computer Networks',       72, 'final'),
-- Priya Nair (top performer)
('CS21002', 'Data Structures',         95, 'final'),
('CS21002', 'Operating Systems',       92, 'final'),
('CS21002', 'Database Management',     88, 'final'),
('CS21002', 'Programming',             96, 'final'),
('CS21002', 'Computer Networks',       91, 'final'),
-- Rahul Verma (at-risk)
('CS21003', 'Data Structures',         42, 'final'),
('CS21003', 'Operating Systems',       38, 'final'),
('CS21003', 'Database Management',     55, 'final'),
('CS21003', 'Programming',             30, 'final'),
('CS21003', 'Computer Networks',       48, 'final'),
-- Sneha Patel (average)
('CS21004', 'Data Structures',         65, 'final'),
('CS21004', 'Operating Systems',       70, 'final'),
('CS21004', 'Database Management',     68, 'final'),
('CS21004', 'Programming',             72, 'final'),
('CS21004', 'Computer Networks',       40, 'final'),   -- weak subject
-- Vikram Rajan (improving)
('CS21005', 'Data Structures',         58, 'internal1'),
('CS21005', 'Data Structures',         75, 'final'),
('CS21005', 'Operating Systems',       80, 'final'),
('CS21005', 'Database Management',     62, 'final'),
('CS21005', 'Programming',             45, 'final'),
('CS21005', 'Computer Networks',       78, 'final'),
-- Electronics students
('EC21001', 'Circuit Theory',          88, 'final'),
('EC21001', 'Digital Electronics',     92, 'final'),
('EC21001', 'Signals & Systems',       35, 'final'),
('EC21002', 'Circuit Theory',          55, 'final'),
('EC21002', 'Digital Electronics',     48, 'final'),
('EC21002', 'Signals & Systems',       60, 'final'),
('EC21003', 'Circuit Theory',          78, 'final'),
('EC21003', 'Digital Electronics',     82, 'final'),
('EC21003', 'Signals & Systems',       75, 'final'),
-- Mechanical students
('ME21001', 'Engineering Mechanics',   65, 'final'),
('ME21001', 'Thermodynamics',          72, 'final'),
('ME21001', 'Material Science',        58, 'final'),
('ME21002', 'Engineering Mechanics',   90, 'final'),
('ME21002', 'Thermodynamics',          85, 'final'),
('ME21002', 'Material Science',        88, 'final'),
-- CS 2nd year
('CS22001', 'C Programming',           55, 'final'),
('CS22001', 'Mathematics',             48, 'final'),
('CS22001', 'Physics',                 70, 'final'),
('CS22002', 'C Programming',           82, 'final'),
('CS22002', 'Mathematics',             91, 'final'),
('CS22002', 'Physics',                 78, 'final');

-- Attendance
INSERT INTO attendance (roll_no, subject, attendance_percentage, total_classes, attended_classes) VALUES
('CS21001', 'Data Structures',         88, 50, 44),
('CS21001', 'Operating Systems',       92, 50, 46),
('CS21001', 'Database Management',     95, 50, 47),
('CS21001', 'Programming',             68, 50, 34),   -- low attendance
('CS21001', 'Computer Networks',       85, 50, 42),
('CS21002', 'Data Structures',         98, 50, 49),
('CS21002', 'Operating Systems',       96, 50, 48),
('CS21002', 'Database Management',     100, 50, 50),
('CS21002', 'Programming',             98, 50, 49),
('CS21002', 'Computer Networks',       94, 50, 47),
('CS21003', 'Data Structures',         62, 50, 31),
('CS21003', 'Operating Systems',       58, 50, 29),
('CS21003', 'Database Management',     70, 50, 35),
('CS21003', 'Programming',             55, 50, 27),
('CS21003', 'Computer Networks',       65, 50, 32),
('CS21004', 'Data Structures',         80, 50, 40),
('CS21004', 'Operating Systems',       85, 50, 42),
('CS21004', 'Database Management',     78, 50, 39),
('CS21004', 'Programming',             88, 50, 44),
('CS21004', 'Computer Networks',       72, 50, 36),
('CS21005', 'Data Structures',         75, 50, 37),
('CS21005', 'Operating Systems',       82, 50, 41),
('CS21005', 'Database Management',     90, 50, 45),
('CS21005', 'Programming',             70, 50, 35),
('CS21005', 'Computer Networks',       88, 50, 44),
('EC21001', 'Circuit Theory',          90, 40, 36),
('EC21001', 'Digital Electronics',     95, 40, 38),
('EC21001', 'Signals & Systems',       65, 40, 26),
('EC21002', 'Circuit Theory',          72, 40, 29),
('EC21002', 'Digital Electronics',     68, 40, 27),
('EC21002', 'Signals & Systems',       75, 40, 30),
('EC21003', 'Circuit Theory',          88, 40, 35),
('EC21003', 'Digital Electronics',     92, 40, 37),
('EC21003', 'Signals & Systems',       85, 40, 34),
('ME21001', 'Engineering Mechanics',   78, 45, 35),
('ME21001', 'Thermodynamics',          82, 45, 37),
('ME21001', 'Material Science',        70, 45, 31),
('ME21002', 'Engineering Mechanics',   95, 45, 43),
('ME21002', 'Thermodynamics',          92, 45, 41),
('ME21002', 'Material Science',        90, 45, 40),
('CS22001', 'C Programming',           70, 40, 28),
('CS22001', 'Mathematics',             65, 40, 26),
('CS22001', 'Physics',                 80, 40, 32),
('CS22002', 'C Programming',           95, 40, 38),
('CS22002', 'Mathematics',             90, 40, 36),
('CS22002', 'Physics',                 88, 40, 35);
