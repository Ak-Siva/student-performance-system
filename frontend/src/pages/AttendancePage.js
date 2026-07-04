// src/pages/AttendancePage.js
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const EMPTY_FORM = { roll_no:'', subject:'', attendance_percentage:'', total_classes:'', attended_classes:'' };

export default function AttendancePage() {
  const [students, setStudents]     = useState([]);
  const [records, setRecords]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [selectedRoll, setSelectedRoll] = useState('');

  useEffect(() => { api.get('/students').then(r => setStudents(r.data)); }, []);

  const loadRecords = (roll) => {
    if (!roll) { setRecords([]); setFiltered([]); return; }
    setLoading(true);
    api.get(`/attendance/${roll}`).then(r => { setRecords(r.data); setFiltered(r.data); }).finally(() => setLoading(false));
  };

  useEffect(() => { loadRecords(selectedRoll); }, [selectedRoll]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => r.subject.toLowerCase().includes(q)));
  }, [search, records]);

  // Auto-calculate percentage from counts
  const handleCountChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const total    = Number(updated.total_classes);
    const attended = Number(updated.attended_classes);
    if (total > 0 && attended >= 0) {
      updated.attendance_percentage = Math.min(100, ((attended / total) * 100).toFixed(2));
    }
    setForm(updated);
  };

  const openAdd  = () => { setForm({ ...EMPTY_FORM, roll_no: selectedRoll }); setError(''); setModal('add'); };
  const openEdit = (r) => { setForm({ ...r }); setError(''); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/attendance', form);
      else await api.put(`/attendance/${form.id}`, form);
      loadRecords(selectedRoll);
      setModal(null);
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    await api.delete(`/attendance/${id}`);
    loadRecords(selectedRoll);
  };

  const attColor = (p) => p >= 75 ? 'green' : p >= 60 ? 'yellow' : 'red';
  const attBadge = (p) => p >= 75 ? 'badge-success' : p >= 60 ? 'badge-warning' : 'badge-danger';
  const attLabel = (p) => p >= 75 ? 'Sufficient' : p >= 60 ? 'Low' : 'Critical';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Attendance Management</h1>
          <p>Track and manage subject-wise attendance records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={!selectedRoll}>
          <i className="fas fa-plus" /> Add Record
        </button>
      </div>

      <div className="card mb-4">
        <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="form-group" style={{ flex:1, minWidth:200, marginBottom:0 }}>
            <label className="form-label">Select Student</label>
            <select className="form-control form-select" value={selectedRoll}
              onChange={e => setSelectedRoll(e.target.value)}>
              <option value="">— Choose a student —</option>
              {students.map(s => <option key={s.roll_no} value={s.roll_no}>{s.roll_no} — {s.name}</option>)}
            </select>
          </div>
          {selectedRoll && (
            <div className="search-bar" style={{ flex:1, minWidth:200, marginBottom:0 }}>
              <i className="fas fa-search search-icon" />
              <input className="form-control" placeholder="Filter by subject…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {selectedRoll && (
        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
              <i className="fas fa-calendar-xmark" style={{ fontSize:32, opacity:.3, marginBottom:12, display:'block' }} />
              No attendance records for this student yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Attended</th><th>Total Classes</th><th>Percentage</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:500 }}>{r.subject}</td>
                      <td>{r.attended_classes}</td>
                      <td>{r.total_classes}</td>
                      <td>
                        <span style={{ fontWeight:700, fontSize:15 }}>{r.attendance_percentage}%</span>
                        <div className="progress-bar-wrap mt-2" style={{ width:120 }}>
                          <div className={`progress-bar-fill ${attColor(r.attendance_percentage)}`}
                            style={{ width:`${r.attendance_percentage}%` }} />
                        </div>
                      </td>
                      <td><span className={`badge ${attBadge(r.attendance_percentage)}`}>{attLabel(r.attendance_percentage)}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}><i className="fas fa-edit" /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}><i className="fas fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add Attendance' : 'Edit Attendance'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><i className="fas fa-xmark" /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-control form-select" value={form.roll_no}
                  onChange={e => setForm(f => ({ ...f, roll_no: e.target.value }))} disabled={modal === 'edit'}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.roll_no} value={s.roll_no}>{s.roll_no} — {s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-control" value={form.subject} placeholder="e.g. Data Structures"
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Classes</label>
                  <input type="number" min="0" className="form-control" value={form.total_classes}
                    onChange={e => handleCountChange('total_classes', e.target.value)} placeholder="50" />
                </div>
                <div className="form-group">
                  <label className="form-label">Classes Attended</label>
                  <input type="number" min="0" className="form-control" value={form.attended_classes}
                    onChange={e => handleCountChange('attended_classes', e.target.value)} placeholder="42" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Attendance % (auto-calculated)</label>
                <input type="number" min="0" max="100" className="form-control" value={form.attendance_percentage}
                  onChange={e => setForm(f => ({ ...f, attendance_percentage: e.target.value }))} placeholder="84" />
              </div>
              {form.attendance_percentage && (
                <div className={`alert ${Number(form.attendance_percentage) >= 75 ? 'alert-success' : Number(form.attendance_percentage) >= 60 ? 'alert-warning' : 'alert-danger'}`}>
                  <i className={`fas ${Number(form.attendance_percentage) >= 75 ? 'fa-check' : 'fa-triangle-exclamation'}`} />
                  {Number(form.attendance_percentage) >= 75 ? 'Sufficient attendance.' : `Below 75% threshold. ${Math.ceil((0.75 * Number(form.total_classes) - Number(form.attended_classes)) / 0.25)} more classes needed to reach 75%.`}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
