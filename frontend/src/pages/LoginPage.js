// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function LoginPage() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await login(form.username, form.password);
      navigate(data.user.role === 'admin' ? '/' : '/my-profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ username: 'admin', password: 'Admin@123' });
    else setForm({ username: 'CS21001', password: 'Student@123' });
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-hero-icon">🎓</div>
        <h1 className="login-hero-title">AI-Powered Student<br />Performance System</h1>
        <p style={{ opacity: .8, fontSize: 15, maxWidth: 400, lineHeight: 1.7 }}>
          Empower every student with personalised insights, smart recommendations,
          and data-driven progress tracking.
        </p>
        <div className="login-features">
          {[
            ['📊', 'Real-time Performance Analytics'],
            ['🤖', 'AI-Generated Study Plans'],
            ['📈', 'Progress Tracking & Trends'],
            ['📄', 'Downloadable PDF Reports'],
          ].map(([icon, text]) => (
            <div className="login-feature" key={text}>
              <div className="login-feature-icon">{icon}</div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to access your dashboard</p>

          {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" />{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username / Roll Number</label>
              <input
                className="form-control"
                placeholder="admin or CS21001"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? <><span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div style={{ marginTop: 24, padding: '16px', background: '#f8faff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Demo Accounts</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => fillDemo('admin')}>
                <i className="fas fa-user-shield" /> Admin
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={() => fillDemo('student')}>
                <i className="fas fa-user-graduate" /> Student
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: '#718096', marginTop: 8, textAlign:'center' }}>
              Admin: admin / Admin@123 &nbsp;|&nbsp; Student: CS21001 / Student@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
