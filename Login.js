import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.quiz_completed) navigate('/quiz');
      else if (!user.selected_career) navigate('/career-results');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Bg orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)', top: '10%', left: '10%', borderRadius: '50%', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)', bottom: '20%', right: '15%', borderRadius: '50%', filter: 'blur(40px)' }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, background: 'var(--accent)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', boxShadow: '0 0 40px rgba(124,92,252,0.4)' }}>🎯</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Sign in to continue your career journey</p>
        </div>

        <div className="card" style={{ background: 'var(--surface)', padding: 32 }}>
          {error && (
            <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: 'var(--rose)', fontSize: 14 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8, height: 48 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Sign In →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>Get started free</Link>
        </p>
      </div>
    </div>
  );
}
