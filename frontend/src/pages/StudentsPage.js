// src/pages/StudentsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const EMPTY_FORM = { roll_no:'', name:'', department:'', year:1, email:'', phone:'' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/students').then(r => { setStudents(r.data); setFiltered(r.data); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.roll_no.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    ));
  }, [search, students]);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(''); setModal('add'); };
  const openEdit = (s)  => { setForm({ ...s }); setError(''); setModal('edit'); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/students', form);
      else await api.put(`/students/${form.roll_no}`, form);
      load(); closeModal();
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (rollNo) => {
    if (!window.confirm(`Delete student ${rollNo}? This cannot be undone.`)) return;
    await api.delete(`/students/${rollNo}`);
    load();
  };

  const riskColor = { high:'badge-danger', medium:'badge-warning', low:'badge-success' };
  const statusColor = { Excellent:'badge-success', Good:'badge-success', Average:'badge-info', 'Below Average':'badge-warning', 'At Risk':'badge-danger' };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Students</h1>
          <p>Manage all enrolled students and view academic profiles</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fas fa-plus" /> Add Student
        </button>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <div className="search-bar" style={{ flex:1, minWidth:220 }}>
            <i className="fas fa-search search-icon" />
            <input
              className="form-control" placeholder="Search by name, roll no, department…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="badge badge-info" style={{ alignSelf:'center', padding:'6px 14px' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th><th>Name</th><th>Department</th><th>Year</th>
                  <th>Avg Marks</th><th>Attendance</th><th>Status</th><th>Risk</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.roll_no}>
                    <td><code style={{ fontSize:12, background:'var(--bg)', padding:'2px 6px', borderRadius:4 }}>{s.roll_no}</code></td>
                    <td>
                      <button
                        style={{ background:'none', border:'none', fontWeight:600, color:'var(--primary)', cursor:'pointer', fontSize:14, padding:0 }}
                        onClick={() => navigate(`/students/${s.roll_no}`)}
                      >{s.name}</button>
                    </td>
                    <td>{s.department}</td>
                    <td>Year {s.year}</td>
                    <td>
                      <span style={{ fontWeight:700 }}>{s.avg_mark}%</span>
                      <div className="progress-bar-wrap mt-2" style={{ width:80 }}>
                        <div className={`progress-bar-fill ${s.avg_mark >= 70 ? 'green' : s.avg_mark >= 50 ? 'yellow' : 'red'}`} style={{ width:`${s.avg_mark}%` }} />
                      </div>
                    </td>
                    <td>{s.avg_attendance}%</td>
                    <td><span className={`badge ${statusColor[s.performance_status] || 'badge-gray'}`}>{s.performance_status}</span></td>
                    <td><span className={`badge ${riskColor[s.risk_level]}`}>{s.risk_level}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/students/${s.roll_no}`)}>
                          <i className="fas fa-eye" />
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.roll_no)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add New Student' : 'Edit Student'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><i className="fas fa-xmark" /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="form-control" value={form.roll_no}
                    onChange={e => setForm(f => ({ ...f, roll_no: e.target.value }))}
                    disabled={modal === 'edit'} placeholder="CS21001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Arjun Sharma" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control form-select" value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Select…</option>
                    {['Computer Science','Electronics','Mechanical','Civil','Electrical'].map(d =>
                      <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="form-control form-select" value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@college.edu" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
