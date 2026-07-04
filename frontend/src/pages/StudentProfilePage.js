// src/pages/StudentProfilePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function StudentProfilePage() {
  const { rollNo } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/students/${rollNo}`).then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [rollNo]);

  const handleGenerateRecs = async () => {
    setGenerating(true); setGenMsg('');
    try {
      await api.post(`/recommendations/generate/${rollNo}`);
      setGenMsg('✅ Recommendations generated!');
      load();
    } catch { setGenMsg('❌ Generation failed.'); }
    finally { setGenerating(false); }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/reports/${rollNo}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a'); a.href = url; a.download = `report_${rollNo}.pdf`;
      a.click(); window.URL.revokeObjectURL(url);
    } finally { setPdfLoading(false); }
  };

  const updatePlanStatus = async (planId, status) => {
    await api.patch(`/recommendations/${planId}/status`, { status });
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading profile…</span></div>;
  if (!data) return <div className="alert alert-danger">Student not found.</div>;

  const riskBadge = { high:'badge-danger', medium:'badge-warning', low:'badge-success' };
  const initials = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Build per-subject mark averages for charts
  const subjects = Object.keys(data.subject_averages || {});
  const marksForChart = subjects.map(s => data.subject_averages[s]);

  const barData = {
    labels: subjects,
    datasets: [{
      label: 'Marks (%)',
      data: marksForChart,
      backgroundColor: marksForChart.map(m => m >= 70 ? '#34a853' : m >= 50 ? '#f9ab00' : '#ea4335'),
      borderRadius: 6,
    }]
  };

  const radarData = {
    labels: subjects,
    datasets: [{
      label: 'Performance',
      data: marksForChart,
      backgroundColor: 'rgba(26,115,232,.2)',
      borderColor: '#1a73e8',
      pointBackgroundColor: '#1a73e8',
    }]
  };

  const attSubjects = data.attendance?.map(a => a.subject) || [];
  const attValues   = data.attendance?.map(a => a.attendance_percentage) || [];

  return (
    <div>
      {/* Back button */}
      {isAdmin && (
        <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/students')}>
          <i className="fas fa-arrow-left" /> Back to Students
        </button>
      )}

      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div style={{ flex:1 }}>
          <h1>{data.name}</h1>
          <div className="profile-meta">
            <span className="profile-meta-item"><i className="fas fa-id-badge" />{data.roll_no}</span>
            <span className="profile-meta-item"><i className="fas fa-building-columns" />{data.department}</span>
            <span className="profile-meta-item"><i className="fas fa-layer-group" />Year {data.year}</span>
            <span className="profile-meta-item"><i className="fas fa-envelope" />{data.email}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
          <button className="btn btn-success btn-sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
            <i className="fas fa-file-pdf" /> {pdfLoading ? 'Generating…' : 'PDF Report'}
          </button>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={handleGenerateRecs} disabled={generating}>
              <i className="fas fa-lightbulb" /> {generating ? 'Analysing…' : 'Generate AI Plan'}
            </button>
          )}
        </div>
      </div>
      {genMsg && <div className="alert alert-info mb-4">{genMsg}</div>}

      {/* Summary cards */}
      <div className="grid-4 mb-6">
        <MiniStat icon="fa-chart-line" color="blue" value={`${data.avg_mark}%`} label="Avg Marks" />
        <MiniStat icon="fa-calendar-check" color="green" value={`${data.avg_attendance}%`} label="Avg Attendance" />
        <MiniStat icon="fa-circle-exclamation" color="red" value={data.weak_subjects?.length} label="Weak Subjects" />
        <div className="stat-card">
          <div className={`stat-icon ${data.risk_level === 'high' ? 'red' : data.risk_level === 'medium' ? 'yellow' : 'green'}`}>
            <i className="fas fa-shield-halved" />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize:18, textTransform:'capitalize' }}>{data.risk_level}</div>
            <div className="stat-label">Risk Level</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview','marks','attendance','plans'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ overview:'Overview', marks:'Marks', attendance:'Attendance', plans:'Improvement Plans' }[t]}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Subject Performance</h3>
            {subjects.length > 0
              ? <Bar data={barData} options={{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}}, responsive:true }} />
              : <p className="text-muted text-sm">No marks recorded.</p>}
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Performance Radar</h3>
            {subjects.length > 0
              ? <Radar data={radarData} options={{ scales:{r:{beginAtZero:true,max:100}}, plugins:{legend:{display:false}} }} />
              : <p className="text-muted text-sm">No marks recorded.</p>}
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Personal Information</h3>
            <div className="info-grid">
              {[['Roll No', data.roll_no], ['Name', data.name], ['Department', data.department],
                ['Year', `Year ${data.year}`], ['Email', data.email], ['Phone', data.phone || '—']
              ].map(([lbl, val]) => (
                <div className="info-item" key={lbl}>
                  <span className="info-label">{lbl}</span>
                  <span className="info-value">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Weak Subjects</h3>
            {data.weak_subjects?.length === 0
              ? <div className="alert alert-success"><i className="fas fa-check" /> No weak subjects! Great performance.</div>
              : data.weak_subjects?.map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <i className="fas fa-triangle-exclamation" style={{ color:'var(--danger)' }} />
                  <span style={{ fontWeight:600 }}>{s}</span>
                  <span className="badge badge-danger" style={{ marginLeft:'auto' }}>{data.subject_averages[s]}%</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Tab: Marks */}
      {tab === 'marks' && (
        <div className="card">
          <h3 style={{ fontSize:14, marginBottom:16 }}>All Marks</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                {data.marks?.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight:500 }}>{m.subject}</td>
                    <td><span className="badge badge-info">{m.exam_type}</span></td>
                    <td style={{ fontWeight:700, fontSize:15 }}>{m.mark}%</td>
                    <td>
                      <span className={`badge ${m.mark >= 70 ? 'badge-success' : m.mark >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                        {m.mark >= 70 ? 'Good' : m.mark >= 50 ? 'Average' : 'Weak'}
                      </span>
                    </td>
                    <td style={{ minWidth:120 }}>
                      <div className="progress-bar-wrap">
                        <div className={`progress-bar-fill ${m.mark >= 70 ? 'green' : m.mark >= 50 ? 'yellow' : 'red'}`} style={{ width:`${m.mark}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {tab === 'attendance' && (
        <div className="card">
          <h3 style={{ fontSize:14, marginBottom:16 }}>Attendance Records</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Subject</th><th>Attended</th><th>Total</th><th>Percentage</th><th>Status</th></tr></thead>
              <tbody>
                {data.attendance?.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight:500 }}>{a.subject}</td>
                    <td>{a.attended_classes}</td>
                    <td>{a.total_classes}</td>
                    <td>
                      <span style={{ fontWeight:700 }}>{a.attendance_percentage}%</span>
                      <div className="progress-bar-wrap mt-2" style={{ width:100 }}>
                        <div className={`progress-bar-fill ${a.attendance_percentage >= 75 ? 'green' : a.attendance_percentage >= 60 ? 'yellow' : 'red'}`}
                          style={{ width:`${a.attendance_percentage}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${a.attendance_percentage >= 75 ? 'badge-success' : a.attendance_percentage >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {a.attendance_percentage >= 75 ? 'Sufficient' : a.attendance_percentage >= 60 ? 'Low' : 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Improvement Plans */}
      {tab === 'plans' && (
        <div>
          {data.improvement_plans?.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'40px 24px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
              <h3>No improvement plans yet</h3>
              <p className="text-muted text-sm mt-2">
                {isAdmin ? 'Click "Generate AI Plan" above to create personalized recommendations.' : 'Ask your faculty to generate an improvement plan.'}
              </p>
            </div>
          ) : (
            data.improvement_plans.map(plan => (
              <div key={plan.id} className={`rec-card priority-${plan.priority}`}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div className="rec-weakness">⚠️ {plan.weakness}</div>
                    <div className="rec-body">{plan.recommendation}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', flexShrink:0 }}>
                    <span className={`badge ${plan.priority === 'high' ? 'badge-danger' : plan.priority === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                      {plan.priority} priority
                    </span>
                    <span className={`badge ${plan.status === 'completed' ? 'badge-success' : plan.status === 'in_progress' ? 'badge-info' : 'badge-gray'}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                    <select
                      className="form-control form-select"
                      style={{ fontSize:12, padding:'4px 28px 4px 8px', width:'auto' }}
                      value={plan.status}
                      onChange={e => updatePlanStatus(plan.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><i className={`fas ${icon}`} /></div>
      <div>
        <div className="stat-value" style={{ fontSize:22 }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
