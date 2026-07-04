// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading dashboard…</span></div>;
  if (!stats) return <div className="alert alert-danger">Failed to load dashboard data.</div>;

  const dist = stats.performance_distribution || {};

  const doughnutData = {
    labels: Object.keys(dist),
    datasets: [{
      data: Object.values(dist),
      backgroundColor: ['#34a853','#1a73e8','#f9ab00','#ff7043','#ea4335'],
      borderWidth: 0,
    }]
  };

  const deptLabels = Object.keys(stats.department_stats || {});
  const barData = {
    labels: deptLabels,
    datasets: [{
      label: 'Average Marks',
      data: deptLabels.map(d => stats.department_stats[d]),
      backgroundColor: '#1a73e8',
      borderRadius: 6,
    }]
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Overview of academic performance across all students</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-6">
        <StatCard icon="fa-users" color="blue" value={stats.total_students} label="Total Students" />
        <StatCard icon="fa-chart-line" color="green" value={`${stats.avg_mark}%`} label="Average Marks" />
        <StatCard icon="fa-calendar-check" color="cyan" value={`${stats.avg_attendance}%`} label="Average Attendance" />
        <StatCard icon="fa-triangle-exclamation" color="red" value={stats.at_risk_count} label="Students at Risk" />
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-6">
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Performance Distribution</h3>
          <div style={{ maxWidth:280, margin:'0 auto' }}>
            <Doughnut data={doughnutData} options={{ plugins: { legend: { position:'bottom' } }, cutout:'65%' }} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Department-wise Average Marks</h3>
          <Bar data={barData} options={{
            plugins: { legend: { display:false } },
            scales: { y: { beginAtZero:true, max:100 } },
            responsive: true,
          }} />
        </div>
      </div>

      {/* At-risk and top performers */}
      <div className="grid-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize:15 }}>⚠️ Students at Risk</h3>
            <span className="badge badge-danger">{stats.at_risk_count}</span>
          </div>
          {stats.at_risk_students?.length === 0
            ? <p className="text-muted text-sm">No at-risk students.</p>
            : stats.at_risk_students?.map(s => (
              <StudentRow key={s.roll_no} student={s} onClick={() => navigate(`/students/${s.roll_no}`)} />
            ))
          }
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize:15 }}>🏆 Top Performers</h3>
            <span className="badge badge-success">{stats.top_performers?.length}</span>
          </div>
          {stats.top_performers?.length === 0
            ? <p className="text-muted text-sm">No top performers yet.</p>
            : stats.top_performers?.map(s => (
              <StudentRow key={s.roll_no} student={s} onClick={() => navigate(`/students/${s.roll_no}`)} />
            ))
          }
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><i className={`fas ${icon}`} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function StudentRow({ student, onClick }) {
  const riskColor = { high:'badge-danger', medium:'badge-warning', low:'badge-success' };
  return (
    <div
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
      onClick={onClick}
    >
      <div>
        <div style={{ fontWeight:600, fontSize:13.5 }}>{student.name}</div>
        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{student.roll_no} · {student.department}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{student.avg_mark}%</div>
        <span className={`badge ${riskColor[student.risk_level]}`}>{student.risk_level}</span>
      </div>
    </div>
  );
}
