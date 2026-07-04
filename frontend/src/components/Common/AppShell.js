// src/components/Common/AppShell.js — Sidebar + topbar shell
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

export default function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminNav = [
    { to: '/',               icon: 'fa-gauge-high',    label: 'Dashboard' },
    { to: '/students',       icon: 'fa-users',          label: 'Students' },
    { to: '/marks',          icon: 'fa-star',           label: 'Marks' },
    { to: '/attendance',     icon: 'fa-calendar-check', label: 'Attendance' },
    { to: '/recommendations',icon: 'fa-lightbulb',      label: 'AI Recommendations' },
  ];

  const studentNav = [
    { to: '/my-profile', icon: 'fa-user-graduate', label: 'My Profile' },
  ];

  const navItems = isAdmin ? adminNav : studentNav;
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="fas fa-graduation-cap" /></div>
          <div className="brand-title">Student Performance</div>
          <div className="brand-sub">AI Enhancement System</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon"><i className={`fas ${item.icon}`} /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Admin / Faculty' : 'Student'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button
              className="btn btn-ghost btn-icon"
              style={{ display:'none' }}
              id="hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars" />
            </button>
            <PageTitle />
          </div>
          <div className="topbar-actions">
            <span className="badge badge-info" style={{ fontSize:12 }}>
              <i className="fas fa-circle" style={{ fontSize:7, marginRight:5 }} />
              {user?.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const map = {
    '/':               'Dashboard',
    '/students':       'Student Management',
    '/marks':          'Marks Management',
    '/attendance':     'Attendance Management',
    '/recommendations':'AI Recommendations',
    '/my-profile':     'My Profile',
  };
  const path = location.pathname;
  if (path.startsWith('/students/')) return <span className="topbar-title">Student Profile</span>;
  return <span className="topbar-title">{map[path] || 'Student Performance System'}</span>;
}
