// src/pages/MyProfilePage.js — Student self-service view
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend);

export default function MyProfilePage() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/" replace />;
  if (!user?.roll_no) {
    return (
      <div className="card" style={{ textAlign:'center', padding:'48px 24px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
        <h2>Profile Not Linked</h2>
        <p className="text-muted mt-2">Your account is not linked to a student record. Please contact the administrator.</p>
      </div>
    );
  }
  return <StudentSelfProfile rollNo={user.roll_no} />;
}

function StudentSelfProfile({ rollNo }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/students/${rollNo}`).then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [rollNo]);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/reports/${rollNo}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `report_${rollNo}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } finally { setPdfLoading(false); }
  };

  const updatePlanStatus = async (planId, status) => {
    await api.patch(`/recommendations/${planId}/status`, { status });
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading your profile…</span></div>;
  if (!data)   return <div className="alert alert-danger">Could not load your profile.</div>;

  const initials   = data.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const subjects   = Object.keys(data.subject_averages || {});
  const markValues = subjects.map(s => data.subject_averages[s]);

  const barData = {
    labels: subjects,
    datasets: [{ label:'Marks (%)', data: markValues,
      backgroundColor: markValues.map(m => m >= 70 ? '#34a853' : m >= 50 ? '#f9ab00' : '#ea4335'),
      borderRadius: 6 }]
  };
  const radarData = {
    labels: subjects,
    datasets: [{ label:'Performance', data: markValues,
      backgroundColor:'rgba(26,115,232,.2)', borderColor:'#1a73e8', pointBackgroundColor:'#1a73e8' }]
  };

  return (
    <div>
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
        <button className="btn btn-success btn-sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
          <i className="fas fa-file-pdf" /> {pdfLoading ? 'Generating…' : 'Download Report'}
        </button>
      </div>

      <div className="grid-4 mb-6">
        {[
          { icon:'fa-chart-line',       color:'blue',   value:`${data.avg_mark}%`,      label:'Average Marks' },
          { icon:'fa-calendar-check',   color:'green',  value:`${data.avg_attendance}%`, label:'Avg Attendance' },
          { icon:'fa-circle-exclamation',color:'red',   value:data.weak_subjects?.length, label:'Weak Subjects' },
          { icon:'fa-shield-halved',
            color: data.risk_level==='high' ? 'red' : data.risk_level==='medium' ? 'yellow' : 'green',
            value: data.risk_level?.toUpperCase(), label:'Risk Level' },
        ].map(c => (
          <div className="stat-card" key={c.label}>
            <div className={`stat-icon ${c.color}`}><i className={`fas ${c.icon}`} /></div>
            <div><div className="stat-value" style={{ fontSize:18 }}>{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['overview','Overview'],['marks','My Marks'],['attendance','Attendance'],['plans','Improvement Plans']].map(([t,l]) => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Subject Performance</h3>
            {subjects.length > 0
              ? <Bar data={barData} options={{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}}, responsive:true }} />
              : <p className="text-muted text-sm">No marks recorded yet.</p>}
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:16 }}>Radar Chart</h3>
            {subjects.length > 0
              ? <Radar data={radarData} options={{ scales:{r:{beginAtZero:true,max:100}}, plugins:{legend:{display:false}} }} />
              : <p className="text-muted text-sm">No marks recorded yet.</p>}
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:12 }}>Risk Assessment</h3>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:48 }}>{data.risk_level==='high'?'🔴':data.risk_level==='medium'?'🟡':'🟢'}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:18, textTransform:'capitalize' }}>{data.risk_level} Risk</div>
                <div style={{ color:'var(--text-muted)', fontSize:13 }}>
                  {data.risk_level==='high' ? 'Immediate attention needed. Follow your improvement plan closely.' :
                   data.risk_level==='medium' ? 'Some areas need improvement. Stay consistent and focused.' :
                   'Excellent! Keep maintaining this performance level.'}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize:14, marginBottom:12 }}>Subjects to Focus On</h3>
            {data.weak_subjects?.length === 0
              ? <div className="alert alert-success"><i className="fas fa-check" /> No weak subjects! Great job.</div>
              : data.weak_subjects?.map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontWeight:600 }}>{s}</span>
                  <span className="badge badge-danger">{data.subject_averages[s]}%</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab==='marks' && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Subject</th><th>Exam Type</th><th>Mark</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                {data.marks?.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight:500 }}>{m.subject}</td>
                    <td><span className="badge badge-info">{m.exam_type}</span></td>
                    <td style={{ fontWeight:700, fontSize:16 }}>{m.mark}%</td>
                    <td><span className={`badge ${m.mark>=70?'badge-success':m.mark>=50?'badge-warning':'badge-danger'}`}>
                      {m.mark>=70?'Good':m.mark>=50?'Average':'Weak'}
                    </span></td>
                    <td style={{ minWidth:140 }}>
                      <div className="progress-bar-wrap">
                        <div className={`progress-bar-fill ${m.mark>=70?'green':m.mark>=50?'yellow':'red'}`} style={{ width:`${m.mark}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='attendance' && (
        <div className="card">
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
                        <div className={`progress-bar-fill ${a.attendance_percentage>=75?'green':a.attendance_percentage>=60?'yellow':'red'}`}
                          style={{ width:`${a.attendance_percentage}%` }} />
                      </div>
                    </td>
                    <td><span className={`badge ${a.attendance_percentage>=75?'badge-success':a.attendance_percentage>=60?'badge-warning':'badge-danger'}`}>
                      {a.attendance_percentage>=75?'Sufficient':a.attendance_percentage>=60?'Low':'Critical'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='plans' && (
        <div>
          {!data.improvement_plans?.length ? (
            <div className="card" style={{ textAlign:'center', padding:'40px 24px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
              <h3>No improvement plans yet</h3>
              <p className="text-muted text-sm mt-2">Ask your faculty to generate a personalised improvement plan.</p>
            </div>
          ) : data.improvement_plans.map(plan => (
            <div key={plan.id} className={`rec-card priority-${plan.priority}`}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div className="rec-weakness">⚠️ {plan.weakness}</div>
                  <div className="rec-body">{plan.recommendation}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', flexShrink:0 }}>
                  <span className={`badge ${plan.priority==='high'?'badge-danger':plan.priority==='medium'?'badge-warning':'badge-success'}`}>
                    {plan.priority} priority
                  </span>
                  <select className="form-control form-select"
                    style={{ fontSize:12, padding:'4px 28px 4px 8px', width:'auto' }}
                    value={plan.status}
                    onChange={e => updatePlanStatus(plan.id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
