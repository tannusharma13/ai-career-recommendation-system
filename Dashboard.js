import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area
} from 'recharts';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const phaseColors = ['#7c5cfc', '#2dd4bf', '#fbbf24', '#fb7185'];

// ── tiny sub-components ──────────────────────────────────────
function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div className="card card-glow" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* background accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: `${color}18`, borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, background: `${color}22`, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? 'var(--green)' : 'var(--rose)',
            background: trend >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
            padding: '2px 8px', borderRadius: 20 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Syne', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
    </div>
  );
}

function PhaseProgressBar({ phase, completed, total, color, index }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12,
      borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1 }}>
            Phase {index + 1}
          </span>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{phase}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Syne' }}>{pct}%</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{completed}/{total} done</div>
        </div>
      </div>
      <div className="progress-bar" style={{ height: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

function CareerSwitcher({ user, updateUser }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  if (!user?.top_careers?.length) return null;

  const handleSwitch = async (career) => {
    if (career === user.selected_career) { setOpen(false); return; }
    setSwitching(true);
    try {
      await API.post('/quiz/select-career', { career });
      updateUser({ selected_career: career });
      setOpen(false);
      // navigate with replace:false so location.key changes → RoadmapWrapper remounts
      navigate('/roadmap', { replace: false, state: { career, ts: Date.now() } });
    } catch (e) { /* ignore */ }
    setSwitching(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-secondary"
        style={{ fontSize: 13, gap: 8, height: 38 }}>
        🔄 Switch Career {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, background: 'var(--surface2)',
          border: '1px solid var(--border2)', borderRadius: 12, padding: 8,
          minWidth: 220, zIndex: 100, boxShadow: 'var(--shadow-lg)'
        }}>
          {user.top_careers.map((c, i) => (
            <button key={c.career} onClick={() => handleSwitch(c.career)} style={{
              width: '100%', padding: '10px 14px', background: c.career === user.selected_career
                ? 'rgba(124,92,252,0.15)' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              color: c.career === user.selected_career ? 'var(--accent2)' : 'var(--text)',
              transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.career}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{Math.round(c.match_score)}% match</div>
              </div>
              {c.career === user.selected_career && <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── main component ───────────────────────────────────────────
export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/dashboard/stats'),
      API.get('/dashboard/activities')
    ]).then(([s, a]) => {
      setStats(s.data);
      setActivities(a.data.activities || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, user?.selected_career]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 400 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const pct = stats?.completion_percentage || 0;
  const completedCount = stats?.completed_milestones || 0;
  const totalCount = stats?.total_milestones || 0;
  const remaining = totalCount - completedCount;

  // Estimated completion (rough: 2h of study per day)
  const totalHoursLeft = remaining * 20; // avg 20h per milestone
  const daysLeft = Math.ceil(totalHoursLeft / 2);
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + daysLeft);
  const estDateStr = estDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Weekly mock activity data
  const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    hours: Math.max(0, Math.round(Math.random() * 3 + (i === 6 ? 0 : 1)))
  }));

  const selectedCareerInfo = user?.top_careers?.find(c => c.career === user?.selected_career);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, minHeight: '100vh' }}>

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text2)', fontSize: 15 }}>Currently pursuing</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)',
              borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700,
              color: 'var(--accent2)' }}>
              {selectedCareerInfo?.icon} {user?.selected_career}
            </span>
          </div>
        </div>
        <CareerSwitcher user={user} updateUser={updateUser} />
      </div>

      {/* ── STAT CARDS ───────────────────────────────────── */}
      <div className="fade-in" style={{ display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="🎯" label="Overall Progress" value={`${pct}%`}
          sub={`${completedCount} of ${totalCount} milestones`}
          color="#7c5cfc" trend={pct > 0 ? 5 : undefined} />
        <StatCard icon="🔥" label="Day Streak" value={`${stats?.streak || 7}`}
          sub="consecutive days active" color="#fbbf24" />
        <StatCard icon="📅" label="Est. Completion" value={estDateStr}
          sub={`~${daysLeft} days remaining`} color="#2dd4bf" />
        <StatCard icon="⭐" label="Career Match" value={`${Math.round(selectedCareerInfo?.match_score || 0)}%`}
          sub="AI compatibility score" color="#34d399" />
      </div>

      {/* ── ROW 2: Progress ring + Phase breakdown ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>

        {/* Radial progress */}
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, alignSelf: 'flex-start' }}>
            Completion
          </h3>
          <div style={{ height: 170, width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="58%" outerRadius="88%"
                data={[{ value: pct, fill: '#7c5cfc' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={12}
                  background={{ fill: 'var(--border)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#7c5cfc',
                fontFamily: 'Syne', lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>complete</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 18,
                fontFamily: 'Syne' }}>{completedCount}</div>
              <div style={{ color: 'var(--text3)', fontSize: 11 }}>Done</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 18,
                fontFamily: 'Syne' }}>{remaining}</div>
              <div style={{ color: 'var(--text3)', fontSize: 11 }}>Left</div>
            </div>
          </div>
        </div>

        {/* Phase breakdown */}
        <div className="card fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Phase Breakdown</h3>
          {stats?.phase_stats?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.phase_stats.map((p, i) => (
                <PhaseProgressBar key={i} phase={p.phase} completed={p.completed}
                  total={p.total} color={phaseColors[i % phaseColors.length]} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
              <p>No progress yet — head to your Roadmap to get started!</p>
              <Link to="/roadmap" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                Go to Roadmap →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Weekly Activity + Career match skills ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Weekly activity chart */}
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Weekly Activity</h3>
            <span className="badge badge-purple" style={{ fontSize: 11 }}>This Week</span>
          </div>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}h`, 'Study time']} />
                <Area type="monotone" dataKey="hours" stroke="#7c5cfc" strokeWidth={2}
                  fill="url(#areaGrad)" dot={{ fill: '#7c5cfc', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[
              { label: 'Total hrs', value: `${weekData.reduce((s, d) => s + d.hours, 0)}h` },
              { label: 'Avg/day', value: `${(weekData.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1)}h` },
              { label: 'Best day', value: weekData.reduce((a, b) => a.hours > b.hours ? a : b).day }
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px',
                background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent2)',
                  fontFamily: 'Syne' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills to gain */}
        <div className="card fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Skills to Gain</h3>
          {selectedCareerInfo?.skills_needed?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedCareerInfo.skills_needed.map((skill, i) => {
                const fakePct = Math.max(10, pct - i * 8);
                const clampedPct = Math.min(fakePct, 100);
                return (
                  <div key={skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: 'var(--text)' }}>{skill}</span>
                      <span style={{ color: phaseColors[i % phaseColors.length],
                        fontWeight: 600 }}>{clampedPct}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 5 }}>
                      <div style={{ width: `${clampedPct}%`, height: '100%', borderRadius: 4,
                        background: phaseColors[i % phaseColors.length],
                        transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Complete the quiz to see required skills.</p>
          )}
        </div>
      </div>

      {/* ── ROW 4: Quick actions + Recent activity ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Quick actions */}
        <div className="card fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/roadmap', icon: '🗺️', title: 'Continue Roadmap',
                desc: `${remaining} milestones left`, color: '#7c5cfc' },
              { to: '/resume', icon: '📄', title: 'Analyze Resume',
                desc: 'Get AI-powered feedback', color: '#2dd4bf' },
              { to: '/career-results', icon: '🔍', title: 'View Career Matches',
                desc: 'See your top 5 careers', color: '#fbbf24' },
              { to: '/quiz', icon: '🔄', title: 'Retake Quiz',
                desc: 'Update your profile', color: '#fb7185' },
            ].map((a, i) => (
              <Link key={i} to={a.to} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10,
                  border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: 36, height: 36, background: `${a.color}20`,
                    borderRadius: 9, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{a.desc}</div>
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 14 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
            <button onClick={fetchData} className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12 }}>↻ Refresh</button>
          </div>
          {activities.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activities.slice(0, 6).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0',
                  borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, background: 'var(--bg3)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                    {a.type === 'milestone' ? '✅' : a.type === 'resume' ? '📄' : '📌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{a.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {new Date(a.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 13 }}>No activity yet — start completing milestones!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: All career matches ─────────────────── */}
      {user?.top_careers?.length > 0 && (
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Your Career Matches</h3>
            <Link to="/career-results" style={{ fontSize: 13, color: 'var(--accent2)',
              textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user.top_careers.map((c, i) => {
              const isActive = c.career === user.selected_career;
              return (
                <div key={i} style={{ flex: '1 1 150px', padding: '14px 16px',
                  background: isActive ? 'rgba(124,92,252,0.1)' : 'var(--bg3)',
                  border: `1px solid ${isActive ? 'rgba(124,92,252,0.35)' : 'var(--border)'}`,
                  borderRadius: 12, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    {isActive && (
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>Active</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: isActive ? 'var(--accent2)' : 'var(--text)', marginBottom: 4 }}>
                    {c.career}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                    {Math.round(c.match_score)}% match
                  </div>
                  <div className="progress-bar" style={{ height: 3 }}>
                    <div style={{ width: `${c.match_score}%`, height: '100%', borderRadius: 2,
                      background: isActive ? 'var(--accent)' : 'var(--border2)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
