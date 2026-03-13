import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register(name, email, password);
      navigate('/quiz');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)', top: '-5%', right: '5%', borderRadius: '50%', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)', bottom: '10%', left: '10%', borderRadius: '50%', filter: 'blur(40px)' }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, var(--accent), var(--teal))', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', boxShadow: '0 0 40px rgba(124,92,252,0.4)' }}>🚀</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Start your journey</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Discover the career built for you</p>
        </div>

        {/* Features preview */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['🧠 AI Career Quiz', '🗺️ Custom Roadmap', '📄 Resume Analysis'].map(f => (
            <span key={f} className="badge badge-purple" style={{ fontSize: 12 }}>{f}</span>
          ))}
        </div>

        <div className="card" style={{ background: 'var(--surface)', padding: 32 }}>
          {error && (
            <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: 'var(--rose)', fontSize: 14 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8, height: 48, fontSize: 15 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Account & Take Quiz →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
