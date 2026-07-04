// src/pages/RecommendationsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function RecommendationsPage() {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState({});
  const [message, setMessage]     = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students')
      .then(r => setStudents(r.data))
      .finally(() => setLoading(false));
  }, []);

  const generateForStudent = async (rollNo) => {
    setGenerating(g => ({ ...g, [rollNo]: true }));
    setMessage(m => ({ ...m, [rollNo]: '' }));
    try {
      const r = await api.post(`/recommendations/generate/${rollNo}`);
      setMessage(m => ({ ...m, [rollNo]: `✅ ${r.data.length} recommendation(s) generated` }));
    } catch {
      setMessage(m => ({ ...m, [rollNo]: '❌ Generation failed' }));
    } finally {
      setGenerating(g => ({ ...g, [rollNo]: false }));
    }
  };

  const generateAll = async () => {
    for (const s of students) {
      await generateForStudent(s.roll_no);
    }
  };

  const riskBadge = { high:'badge-danger', medium:'badge-warning', low:'badge-success' };
  const statusColor = { Excellent:'badge-success', Good:'badge-success', Average:'badge-info', 'Below Average':'badge-warning', 'At Risk':'badge-danger' };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const atRisk = students.filter(s => s.risk_level === 'high');
  const medium = students.filter(s => s.risk_level === 'medium');
  const good   = students.filter(s => s.risk_level === 'low');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>AI Recommendations Engine</h1>
          <p>Generate personalised improvement plans using AI-driven performance analysis</p>
        </div>
        <button className="btn btn-primary" onClick={generateAll}>
          <i className="fas fa-wand-magic-sparkles" /> Generate All Plans
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }}>
        <div style={{ background:'#fce8e6', color:'#c62828', borderRadius:12, padding:'10px 18px', fontWeight:600, fontSize:13 }}>
          <i className="fas fa-triangle-exclamation" style={{ marginRight:7 }} />High Risk: {atRisk.length}
        </div>
        <div style={{ background:'#fef7e0', color:'#b06000', borderRadius:12, padding:'10px 18px', fontWeight:600, fontSize:13 }}>
          <i className="fas fa-circle-exclamation" style={{ marginRight:7 }} />Medium Risk: {medium.length}
        </div>
        <div style={{ background:'#e6f4ea', color:'#1e7e34', borderRadius:12, padding:'10px 18px', fontWeight:600, fontSize:13 }}>
          <i className="fas fa-check-circle" style={{ marginRight:7 }} />Low Risk: {good.length}
        </div>
      </div>

      {/* Priority groups */}
      {[
        { label: '🔴 High Risk Students', list: atRisk, color: '#fce8e6' },
        { label: '🟡 Medium Risk Students', list: medium, color: '#fef7e0' },
        { label: '🟢 Low Risk / Good Students', list: good, color: '#e6f4ea' },
      ].map(group => group.list.length > 0 && (
        <div key={group.label} className="card mb-4">
          <h3 style={{ fontSize:14, marginBottom:16 }}>{group.label}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {group.list.map(s => (
              <div key={s.roll_no} style={{
                display:'flex', alignItems:'center', gap:16,
                padding:'14px 16px', borderRadius:10,
                background: group.color, flexWrap:'wrap'
              }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.roll_no} · {s.department} · Year {s.year}</div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:13 }}>Marks: <strong>{s.avg_mark}%</strong></span>
                  <span style={{ fontSize:13 }}>Attendance: <strong>{s.avg_attendance}%</strong></span>
                  <span className={`badge ${riskBadge[s.risk_level]}`}>{s.risk_level} risk</span>
                  <span className={`badge ${statusColor[s.performance_status] || 'badge-gray'}`}>{s.performance_status}</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {message[s.roll_no] && (
                    <span style={{ fontSize:12, color: message[s.roll_no].startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>
                      {message[s.roll_no]}
                    </span>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => generateForStudent(s.roll_no)}
                    disabled={generating[s.roll_no]}
                  >
                    <i className="fas fa-wand-magic-sparkles" />
                    {generating[s.roll_no] ? 'Generating…' : 'Generate Plan'}
                  </button>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/students/${s.roll_no}?tab=plans`)}>
                    <i className="fas fa-eye" /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
