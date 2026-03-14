import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CareerResults() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (user?.top_careers?.length) {
      setTimeout(() => { setCareers(user.top_careers); setRevealed(true); }, 300);
    } else {
      API.get('/auth/me').then(r => {
        setCareers(r.data.top_careers || []);
        setTimeout(() => setRevealed(true), 300);
      });
    }
  }, [user]);

  const handleSelect = async (career) => {
    setSelected(career); setLoading(true);
    try {
      await API.post('/quiz/select-career', { career });
      updateUser({ selected_career: career });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (e) { setLoading(false); }
  };

  const rankColors = ['var(--gold)', 'var(--text2)', '#cd7f32', 'var(--accent2)', 'var(--teal)'];
  const rankLabels = ['🥇 Top Match', '🥈 2nd Match', '🥉 3rd Match', '4th Match', '5th Match'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔮</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Your Career Matches</h1>
          <p style={{ color: 'var(--text2)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Our AI analyzed your quiz responses and found your top career paths. Select one to begin your personalized journey.
          </p>
        </div>

        {!revealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 120, background: 'var(--surface)', borderRadius: 20, animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {careers.map((c, i) => {
              const isSelected = selected === c.career;
              return (
                <div key={c.career} className="fade-in card" style={{
                  animationDelay: `${i * 0.1}s`, padding: '24px 28px',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(124,92,252,0.08)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: isSelected ? '0 0 30px rgba(124,92,252,0.2)' : 'none',
                  transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                }} onClick={() => !loading && handleSelect(c.career)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Rank */}
                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{c.icon}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rankColors[i] }}>{rankLabels[i]}</span>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700 }}>{c.career}</h3>
                        {i === 0 && <span className="badge badge-purple" style={{ fontSize: 11 }}>Best Match</span>}
                      </div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>{c.description}</p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)' }}>
                        <span>💰 Avg: <strong style={{ color: 'var(--green)' }}>{c.avg_salary}</strong></span>
                        <span>📈 Growth: <strong style={{ color: 'var(--teal)' }}>{c.growth_rate}</strong></span>
                        <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>"{c.match_reason}"</span>
                      </div>
                    </div>

                    {/* Match score */}
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        border: `3px solid ${rankColors[i]}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 20px ${rankColors[i]}40`
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: rankColors[i], lineHeight: 1 }}>{Math.round(c.match_score)}</span>
                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>match</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ fontSize: 20, color: isSelected ? 'var(--accent)' : 'var(--border2)' }}>
                      {isSelected && loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : '→'}
                    </div>
                  </div>

                  {/* Skills */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(c.skills_needed || []).map(s => (
                      <span key={s} className="tag">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && !loading && (
          <div className="fade-in" style={{ textAlign: 'center', marginTop: 32, color: 'var(--green)', fontSize: 16, fontWeight: 600 }}>
            ✅ Great choice! Building your roadmap...
          </div>
        )}
      </div>
    </div>
  );
}
