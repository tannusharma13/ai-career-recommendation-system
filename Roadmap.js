import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

function CareerDropdown({ user, updateUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user?.top_careers?.length || user.top_careers.length < 2) return null;

  const handleSwitch = async (career) => {
    if (career === user.selected_career) { setOpen(false); return; }
    try {
      await API.post('/quiz/select-career', { career });
      updateUser({ selected_career: career });
      setOpen(false);
      // navigate with new state so location.key changes → Roadmap remounts via App.js key
      navigate('/roadmap', { replace: false, state: { career, ts: Date.now() } });
    } catch {}
  };

  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o=>!o)} className="btn btn-secondary"
        style={{ fontSize:13, gap:8 }}>
        🔄 Switch Career {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ position:'absolute', top:42, right:0, background:'var(--surface2)',
          border:'1px solid var(--border2)', borderRadius:12, padding:6,
          minWidth:210, zIndex:200, boxShadow:'var(--shadow-lg)' }}>
          {user.top_careers.map((c) => (
            <button key={c.career} onClick={() => handleSwitch(c.career)} style={{
              width:'100%', padding:'9px 12px',
              background: c.career===user.selected_career ? 'rgba(124,92,252,0.15)' : 'transparent',
              border:'none', borderRadius:8, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, textAlign:'left',
              color: c.career===user.selected_career ? 'var(--accent2)' : 'var(--text)',
            }}>
              <span>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{c.career}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{Math.round(c.match_score)}% match</div>
              </div>
              {c.career===user.selected_career && <span style={{ color:'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Roadmap() {
  const { user, updateUser } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [noteInput, setNoteInput] = useState({});
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  // Track previous career so we can detect changes
  const prevCareerRef = useRef(null);
  const career = user?.selected_career || 'Software Engineer';

  useEffect(() => {
    // If career changed, reset phase and progress state first
    if (prevCareerRef.current && prevCareerRef.current !== career) {
      setActivePhase(0);
      setCompleted([]);
      setNotes({});
      setNoteInput({});
      setRoadmap(null);
    }
    prevCareerRef.current = career;

    setLoading(true);
    Promise.all([
      API.get(`/roadmap/get/${encodeURIComponent(career)}`),
      API.get('/roadmap/progress')
    ])
      .then(([r1, r2]) => {
        setRoadmap(r1.data.roadmap);
        setCompleted(r2.data.completed_milestones || []);
        setNotes(r2.data.notes || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [career]);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 2500);
  };

  const toggleMilestone = async (mid) => {
    const isCompleted = completed.includes(mid);
    const optimistic = isCompleted
      ? completed.filter(m => m !== mid)
      : [...completed, mid];
    setCompleted(optimistic);

    try {
      await API.post('/roadmap/progress', { milestone_id: mid, completed: !isCompleted });
      // Log activity
      await API.post('/dashboard/activity', {
        type: 'milestone',
        description: isCompleted
          ? `Unchecked a milestone`
          : `Completed a milestone in Phase ${activePhase + 1}`
      }).catch(() => {});
      showToast(isCompleted ? 'Milestone unchecked' : '✅ Milestone completed!');
    } catch {
      setCompleted(completed); // rollback
      showToast('Failed to save — please try again', 'error');
    }
  };

  const saveNote = async (mid) => {
    const note = noteInput[mid] || '';
    setNotes(prev => ({ ...prev, [mid]: note }));
    try {
      await API.post('/roadmap/progress', {
        milestone_id: mid, note, completed: completed.includes(mid)
      });
      showToast('📝 Note saved!');
    } catch {
      showToast('Failed to save note', 'error');
    }
    setNoteInput(prev => ({ ...prev, [mid]: undefined }));
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 400, gap: 16 }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
      <p style={{ color: 'var(--text2)', fontSize: 14 }}>Loading {career} roadmap...</p>
    </div>
  );

  if (!roadmap) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
      <p>Roadmap not available. Please select a career first.</p>
    </div>
  );

  // ── Derived values ────────────────────────────────────────
  const phaseColors = ['#7c5cfc', '#2dd4bf', '#fbbf24', '#fb7185'];
  const totalMilestones = roadmap.phases.reduce((s, p) => s + p.milestones.length, 0);
  const completedCount = completed.length;
  const pct = totalMilestones ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const currentPhase = roadmap.phases[activePhase];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="fade-in" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>{career} Roadmap</h1>
              <span className="badge badge-purple" style={{ fontSize: 11 }}>
                {roadmap.total_duration}
              </span>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              {roadmap.phases.length} phases · {totalMilestones} milestones ·
              Track your progress below
            </p>
          </div>
          <CareerDropdown user={user} updateUser={updateUser} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#7c5cfc',
              fontFamily: 'Syne', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {completedCount}/{totalMilestones} done
            </div>
          </div>
        </div>

        {/* Master progress bar */}
        <div style={{ position: 'relative' }}>
          <div className="progress-bar" style={{ height: 12, borderRadius: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, borderRadius: 6 }} />
          </div>
          {/* Phase markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            marginTop: 6, paddingLeft: 2 }}>
            {roadmap.phases.map((p, i) => {
              const phaseEndPct = ((i + 1) / roadmap.phases.length) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: i === 0 ? 'flex-start' : i === roadmap.phases.length - 1
                    ? 'flex-end' : 'center', flex: 1 }}>
                  <span style={{ fontSize: 10, color: phaseColors[i], fontWeight: 600 }}>
                    Phase {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PHASE TABS ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {roadmap.phases.map((phase, i) => {
          const pc = phase.milestones.filter(m => completed.includes(m.id)).length;
          const pt = phase.milestones.length;
          const done = pc === pt;
          const active = activePhase === i;
          const col = phaseColors[i];
          return (
            <button key={i} onClick={() => setActivePhase(i)} style={{
              padding: '10px 18px', borderRadius: 10,
              border: `2px solid ${active ? col : done ? col + '60' : 'var(--border)'}`,
              background: active ? `${col}18` : done ? `${col}0a` : 'var(--surface)',
              color: active ? col : done ? col : 'var(--text2)',
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {/* Phase status dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                background: done ? col : active ? col : 'var(--border2)' }} />
              <span>{phase.title}</span>
              <span style={{
                background: active ? `${col}30` : 'var(--bg3)',
                borderRadius: 20, padding: '2px 8px', fontSize: 11,
                color: active ? col : done ? col : 'var(--text3)'
              }}>
                {pc}/{pt}
              </span>
              {done && <span style={{ fontSize: 12 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* ── CURRENT PHASE ──────────────────────────────── */}
      {currentPhase && (
        <div key={`phase-${activePhase}-${career}`} className="fade-in">

          {/* Phase header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
            padding: '16px 20px', background: `${phaseColors[activePhase]}10`,
            border: `1px solid ${phaseColors[activePhase]}30`, borderRadius: 14 }}>
            <div style={{ width: 48, height: 48,
              background: `${phaseColors[activePhase]}25`,
              border: `2px solid ${phaseColors[activePhase]}`,
              borderRadius: 13, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, fontWeight: 800,
              color: phaseColors[activePhase], fontFamily: 'Syne', flexShrink: 0 }}>
              {activePhase + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                Phase {activePhase + 1}: {currentPhase.title}
              </h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)' }}>
                <span>⏱ {currentPhase.duration}</span>
                <span>📋 {currentPhase.milestones.length} milestones</span>
                <span>✅ {currentPhase.milestones.filter(m => completed.includes(m.id)).length} completed</span>
              </div>
            </div>
            {/* Phase mini progress */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {(() => {
                const pc = currentPhase.milestones.filter(m => completed.includes(m.id)).length;
                const pp = Math.round((pc / currentPhase.milestones.length) * 100);
                return (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800,
                      color: phaseColors[activePhase], fontFamily: 'Syne' }}>{pp}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>this phase</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentPhase.milestones.map((m, mi) => {
              const done = completed.includes(m.id);
              const showNoteInput = noteInput[m.id] !== undefined;
              const col = phaseColors[activePhase];

              return (
                <div key={m.id} className="card" style={{
                  padding: '20px 22px',
                  border: `1px solid ${done ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
                  background: done ? 'rgba(52,211,153,0.04)' : 'var(--surface)',
                  transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
                }}>
                  {/* Done stripe */}
                  {done && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: 4, background: 'var(--green)', borderRadius: '14px 0 0 14px' }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleMilestone(m.id)} style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
                      background: done ? 'var(--green)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15, color: 'white',
                      transition: 'all 0.25s', marginTop: 1,
                      boxShadow: done ? '0 0 12px rgba(52,211,153,0.4)' : 'none'
                    }}>
                      {done ? '✓' : ''}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center',
                        gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700,
                          color: col, background: `${col}18`,
                          padding: '2px 8px', borderRadius: 20 }}>
                          {mi + 1}/{currentPhase.milestones.length}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0,
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? 'var(--text3)' : 'var(--text)', flex: 1 }}>
                          {m.title}
                        </h4>
                        {done && (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>
                            ✅ Done
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: 'var(--text3)',
                          background: 'var(--bg3)', padding: '2px 8px',
                          borderRadius: 6, flexShrink: 0 }}>
                          ~{m.est_hours}h
                        </span>
                      </div>

                      <p style={{ color: 'var(--text2)', fontSize: 13,
                        lineHeight: 1.55, marginBottom: 12 }}>
                        {m.description}
                      </p>

                      {/* Resources */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: notes[m.id] ? 10 : 0 }}>
                        {m.resources.map(r => (
                          <span key={r} className="tag" style={{ fontSize: 12 }}>📚 {r}</span>
                        ))}
                      </div>

                      {/* Saved note */}
                      {notes[m.id] && !showNoteInput && (
                        <div style={{ background: 'rgba(251,191,36,0.07)',
                          border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8,
                          padding: '8px 12px', fontSize: 13, color: 'var(--gold)',
                          marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span>📝</span>
                          <span>{notes[m.id]}</span>
                        </div>
                      )}

                      {/* Note input */}
                      {showNoteInput && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <input className="input" value={noteInput[m.id] || ''}
                            onChange={e => setNoteInput(prev => ({
                              ...prev, [m.id]: e.target.value
                            }))}
                            placeholder="Add a note or resource link..."
                            style={{ fontSize: 13 }}
                            onKeyDown={e => e.key === 'Enter' && saveNote(m.id)}
                            autoFocus />
                          <button className="btn btn-primary"
                            onClick={() => saveNote(m.id)}
                            style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
                            Save
                          </button>
                          <button className="btn btn-secondary"
                            onClick={() => setNoteInput(prev => ({
                              ...prev, [m.id]: undefined
                            }))}
                            style={{ padding: '8px 12px', fontSize: 13, flexShrink: 0 }}>
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Note toggle button */}
                    <button onClick={() => setNoteInput(prev => ({
                      ...prev, [m.id]: prev[m.id] !== undefined ? undefined : (notes[m.id] || '')
                    }))} className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 16, flexShrink: 0,
                        color: notes[m.id] ? 'var(--gold)' : 'var(--text3)' }}
                      title={notes[m.id] ? 'Edit note' : 'Add note'}>
                      📝
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phase navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 24 }}>
            <button className="btn btn-secondary"
              onClick={() => setActivePhase(p => Math.max(0, p - 1))}
              disabled={activePhase === 0}>
              ← Previous Phase
            </button>

            {/* Phase dots */}
            <div style={{ display: 'flex', gap: 8 }}>
              {roadmap.phases.map((_, i) => (
                <button key={i} onClick={() => setActivePhase(i)} style={{
                  width: i === activePhase ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === activePhase ? phaseColors[i] : 'var(--border2)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0
                }} />
              ))}
            </div>

            <button className="btn btn-primary"
              onClick={() => setActivePhase(p => Math.min(roadmap.phases.length - 1, p + 1))}
              disabled={activePhase === roadmap.phases.length - 1}>
              Next Phase →
            </button>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toastType}`}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderLeft: `4px solid ${toastType === 'success' ? 'var(--green)' : 'var(--rose)'}` }}>
          {toast}
        </div>
      )}
    </div>
  );
}
