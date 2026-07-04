// src/pages/MarksPage.js
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const EMPTY_FORM = { roll_no:'', subject:'', mark:'', exam_type:'final' };

export default function MarksPage() {
  const [students, setStudents] = useState([]);
  const [marks, setMarks]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [selectedRoll, setSelectedRoll] = useState('');

  const loadStudents = () => api.get('/students').then(r => setStudents(r.data));

  const loadMarks = (roll) => {
    if (!roll) { setMarks([]); setFiltered([]); return; }
    setLoading(true);
    api.get(`/marks/${roll}`).then(r => { setMarks(r.data); setFiltered(r.data); }).finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { loadMarks(selectedRoll); }, [selectedRoll]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(marks.filter(m => m.subject.toLowerCase().includes(q) || m.exam_type.includes(q)));
  }, [search, marks]);

  const openAdd  = () => { setForm({ ...EMPTY_FORM, roll_no: selectedRoll }); setError(''); setModal('add'); };
  const openEdit = (m) => { setForm({ ...m }); setError(''); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/marks', form);
      else await api.put(`/marks/${form.id}`, form);
      loadMarks(selectedRoll);
      setModal(null);
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mark record?')) return;
    await api.delete(`/marks/${id}`);
    loadMarks(selectedRoll);
  };

  const markColor = (m) => m >= 70 ? 'badge-success' : m >= 50 ? 'badge-warning' : 'badge-danger';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Marks Management</h1>
          <p>Record and manage subject-wise marks for each student</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={!selectedRoll}>
          <i className="fas fa-plus" /> Add Mark
        </button>
      </div>

      {/* Student selector */}
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

      {/* Marks table */}
      {selectedRoll && (
        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
              <i className="fas fa-star" style={{ fontSize:32, opacity:.3, marginBottom:12, display:'block' }} />
              No marks recorded for this student yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Exam Type</th><th>Mark</th><th>Grade</th><th>Progress</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight:500 }}>{m.subject}</td>
                      <td><span className="badge badge-info">{m.exam_type}</span></td>
                      <td><span style={{ fontWeight:700, fontSize:16 }}>{m.mark}</span><span style={{ color:'var(--text-muted)', fontSize:12 }}>/100</span></td>
                      <td><span className={`badge ${markColor(m.mark)}`}>{m.mark >= 70 ? 'Good' : m.mark >= 50 ? 'Average' : 'Weak'}</span></td>
                      <td style={{ minWidth:120 }}>
                        <div className="progress-bar-wrap">
                          <div className={`progress-bar-fill ${m.mark >= 70 ? 'green' : m.mark >= 50 ? 'yellow' : 'red'}`}
                            style={{ width:`${m.mark}%` }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{m.mark}%</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}><i className="fas fa-edit" /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}><i className="fas fa-trash" /></button>
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

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add Mark' : 'Edit Mark'}</h2>
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-control" value={form.subject} placeholder="e.g. Data Structures"
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-control form-select" value={form.exam_type}
                    onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))}>
                    <option value="internal1">Internal 1</option>
                    <option value="internal2">Internal 2</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mark (0–100)</label>
                <input type="number" min="0" max="100" className="form-control" value={form.mark}
                  onChange={e => setForm(f => ({ ...f, mark: e.target.value }))} placeholder="e.g. 75" />
              </div>
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
