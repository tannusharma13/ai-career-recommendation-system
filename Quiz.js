import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  'Thinking Style': '#7c5cfc',
  'Motivation':     '#2dd4bf',
  'Core Drive':     '#fbbf24',
  'Working Style':  '#fb7185',
  'Ambition':       '#f97316',
  'Curiosity':      '#a78bfa',
  'Environment':    '#60a5fa',
  'Values':         '#34d399',
  'Skills':         '#e879f9',
  'Impact':         '#4ade80',
};

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const { updateUser }            = useAuth();
  const navigate                  = useNavigate();

  useEffect(() => {
    API.get('/quiz/questions')
      .then(r => { setQuestions(r.data.questions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const q        = questions[current];
  const total    = questions.length;
  const answered = Object.keys(answers).length;
  const progress = total ? (answered / total) * 100 : 0;
  const isLast   = current === total - 1;
  const catColor = q ? (CATEGORY_COLORS[q.category] || '#7c5cfc') : '#7c5cfc';

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);
    // Auto-advance after short delay
    if (current < total - 1) setTimeout(() => setCurrent(c => c + 1), 320);
  };

  const handleSubmit = async () => {
    if (answered < total) { setError('Please answer all questions first.'); return; }
    setSubmitting(true); setError('');
    try {
      const r = await API.post('/quiz/submit', { answers });
      updateUser({ quiz_completed: true, top_careers: r.data.top_careers });
      navigate('/career-results');
    } catch {
      setError('Analysis failed — please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', background:'var(--bg)', gap:16 }}>
      <div className="spinner" style={{ width:48, height:48 }} />
      <p style={{ color:'var(--text2)' }}>Preparing your quiz...</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'40px 20px',
      position:'relative', overflow:'hidden' }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%',
        background:`radial-gradient(circle, ${catColor}12 0%, transparent 70%)`,
        top:'-15%', right:'-10%', filter:'blur(60px)', pointerEvents:'none',
        transition:'background 0.5s' }} />

      <div style={{ maxWidth:620, margin:'0 auto', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:38, marginBottom:10 }}>🎯</div>
          <h1 style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Career Discovery</h1>
          <p style={{ color:'var(--text2)', fontSize:13 }}>
            {total} focused questions · AI analysis · ~3 minutes
          </p>
        </div>

        {/* Progress bar + dots */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            fontSize:12, color:'var(--text3)', marginBottom:6 }}>
            <span>Question {Math.min(current+1, total)} / {total}</span>
            <span style={{ color:catColor, fontWeight:700 }}>{Math.round(progress)}% complete</span>
          </div>
          <div className="progress-bar" style={{ height:5 }}>
            <div style={{ width:`${progress}%`, height:'100%', borderRadius:3,
              background:`linear-gradient(90deg, var(--accent), ${catColor})`,
              transition:'width 0.4s ease' }} />
          </div>
          <div style={{ display:'flex', gap:4, marginTop:8, justifyContent:'center', flexWrap:'wrap' }}>
            {questions.map((qu, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: i===current ? 20 : 7, height:7, borderRadius:4, border:'none',
                cursor:'pointer', transition:'all 0.25s', padding:0,
                background: answers[qu.id] !== undefined
                  ? 'var(--accent)'
                  : i === current ? catColor : 'var(--border)'
              }} />
            ))}
          </div>
        </div>

        {/* Question card */}
        {q && (
          <div key={`q-${current}`} className="fade-in">
            <div className="card" style={{ padding:'28px 26px', marginBottom:14,
              borderTop:`3px solid ${catColor}` }}>

              <div style={{ marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:0.8,
                  color:catColor, background:`${catColor}18`,
                  padding:'3px 10px', borderRadius:20 }}>
                  {q.category}
                </span>
              </div>

              <h2 style={{ fontSize:18, fontWeight:700, lineHeight:1.5,
                marginBottom:24, color:'var(--text)' }}>
                {q.question}
              </h2>

              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {q.options.map((opt) => {
                  const sel = answers[q.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => handleAnswer(opt.value)} style={{
                      padding:'13px 16px', borderRadius:11, cursor:'pointer',
                      border:`2px solid ${sel ? catColor : 'var(--border)'}`,
                      background: sel ? `${catColor}15` : 'var(--bg3)',
                      color: sel ? catColor : 'var(--text)',
                      fontFamily:'DM Sans,sans-serif', fontSize:14,
                      textAlign:'left', transition:'all 0.18s',
                      display:'flex', alignItems:'center', gap:12,
                      transform: sel ? 'scale(1.01)' : 'scale(1)',
                    }}>
                      <div style={{
                        width:20, height:20, borderRadius:'50%', flexShrink:0,
                        border:`2px solid ${sel ? catColor : 'var(--border2)'}`,
                        background: sel ? catColor : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:11, fontWeight:800, transition:'all 0.18s'
                      }}>
                        {sel ? '✓' : ''}
                      </div>
                      <span style={{ lineHeight:1.45 }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(251,113,133,0.1)',
                border:'1px solid rgba(251,113,133,0.3)', borderRadius:10,
                padding:'11px 16px', marginBottom:12, color:'var(--rose)', fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <button className="btn btn-secondary" onClick={() => setCurrent(c => Math.max(0,c-1))}
                disabled={current===0} style={{ minWidth:90 }}>
                ← Back
              </button>

              <span style={{ fontSize:12, color:'var(--text3)' }}>
                {answered}/{total} answered
              </span>

              {!isLast ? (
                <button className="btn btn-primary"
                  onClick={() => setCurrent(c => c+1)}
                  disabled={answers[q.id] === undefined}
                  style={{ minWidth:100 }}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit}
                  disabled={submitting || answered < total}
                  style={{ minWidth:180,
                    background:'linear-gradient(135deg, var(--accent), var(--teal))',
                    opacity: answered < total ? 0.5 : 1 }}>
                  {submitting
                    ? <><span className="spinner" style={{width:16,height:16,marginRight:8}}/>Analysing...</>
                    : '🔮 Get My Results'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
