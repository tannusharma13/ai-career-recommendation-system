import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/community', icon: '👥', label: 'Community' },
  { path: '/roadmap', icon: '🗺', label: 'Roadmap' },
  { path: '/resume', icon: '📄', label: 'Resume AI' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 14px' : '20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎯</div>
          {!collapsed && <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>CareerAI</span>}
        </div>

        {/* Career badge */}
        {!collapsed && user?.selected_career && (
          <div style={{ margin: '12px 16px', padding: '10px 14px', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>YOUR CAREER PATH</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{user.selected_career}</div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px 10px' : '10px 14px',
                borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s',
                background: active ? 'rgba(124,92,252,0.15)' : 'transparent',
                color: active ? 'var(--accent2)' : 'var(--text2)',
                fontWeight: active ? 600 : 400,
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent'
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 14 }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!collapsed && (
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost" style={{ justifyContent: 'center', padding: '8px' }}>
            {collapsed ? '→' : '←'}
          </button>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 14px', gap: 8, fontSize: 14 }}>
            <span>🚪</span>{!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
