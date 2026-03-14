import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const ScoreRing = ({ score, label, color = 'var(--accent)' }) => {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="Syne">{score}</text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
    </div>
  );
};

export default function ResumeAnalysis() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [targetCareer, setTargetCareer] = useState(user?.selected_career || '');
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setError(''); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxSize: 5 * 1024 * 1024, maxFiles: 1
  });

  const handleAnalyze = async () => {
    if (mode === 'upload' && !file) { setError('Please upload a file first'); return; }
    if (mode === 'paste' && pastedText.trim().length < 50) { setError('Please paste your resume text (min 50 characters)'); return; }
    setLoading(true); setError(''); setAnalysis(null);
    try {
      let res;
      if (mode === 'upload') {
        const form = new FormData();
        form.append('file', file);
        if (targetCareer) form.append('target_career', targetCareer);
        res = await API.post('/resume/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await API.post('/resume/analyze', { resume_text: pastedText, target_career: targetCareer }, { headers: { 'Content-Type': 'application/json' } });
      }
      setAnalysis(res.data.analysis);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--gold)' : 'var(--rose)';
  const priorityColor = { high: 'var(--rose)', medium: 'var(--gold)', low: 'var(--teal)' };

  const radarData = analysis ? Object.entries(analysis.sections).map(([k, v]) => ({
    subject: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: v.score,
    fullMark: 100
  })) : [];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <div className="fade-in" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Resume Analyzer 📄</h1>
        <p style={{ color: 'var(--text2)' }}>Upload your resume and get AI-powered feedback to stand out to recruiters</p>
      </div>

      {!analysis && (
        <div className="fade-in card" style={{ marginBottom: 24, padding: 28 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['upload', 'paste'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`} style={{ height: 38, fontSize: 13, padding: '0 18px' }}>
                {m === 'upload' ? '📁 Upload File' : '📋 Paste Text'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border2)'}`,
              borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'rgba(124,92,252,0.05)' : file ? 'rgba(52,211,153,0.05)' : 'var(--bg3)',
              transition: 'all 0.2s', marginBottom: 20
            }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '✅' : '☁️'}</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ color: 'var(--text3)', fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB • Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop your resume here or click to browse</div>
                  <div style={{ color: 'var(--text3)', fontSize: 13 }}>Supports PDF, TXT, MD • Max 5MB</div>
                </div>
              )}
            </div>
          ) : (
            <textarea className="input" value={pastedText} onChange={e => setPastedText(e.target.value)}
              placeholder="Paste your full resume text here..."
              style={{ minHeight: 200, resize: 'vertical', fontFamily: 'DM Sans', fontSize: 13, marginBottom: 20 }} />
          )}

          {/* Target career */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Target Career (optional)</label>
            <input className="input" value={targetCareer} onChange={e => setTargetCareer(e.target.value)}
              placeholder={`e.g. ${user?.selected_career || 'Software Engineer'}`} />
          </div>

          {error && <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'var(--rose)', fontSize: 14 }}>{error}</div>}

          <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading} style={{ width: '100%', height: 48, fontSize: 15 }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Analyzing with AI...</> : '🔍 Analyze My Resume'}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="fade-in">
          {/* Overall score banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(45,212,191,0.1))', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'Syne', color: scoreColor(analysis.overall_score), lineHeight: 1 }}>{analysis.overall_score}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Overall Score</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-green">ATS Score: {analysis.ats_score}/100</span>
                {targetCareer && <span className="badge badge-purple">Optimized for {targetCareer}</span>}
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{analysis.summary}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Section scores */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Section Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {Object.entries(analysis.sections).map(([k, v]) => (
                  <ScoreRing key={k} score={v.score} label={k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ').slice(0, 2).join(' ')} color={scoreColor(v.score)} />
                ))}
              </div>
            </div>

            {/* Radar */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Profile Radar</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Strengths */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✨ Strengths</h3>
              {analysis.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < analysis.strengths.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                  <span style={{ color: 'var(--text2)', fontSize: 14 }}>{s}</span>
                </div>
              ))}
            </div>

            {/* Missing keywords */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔍 Missing Keywords</h3>
              <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Add these to improve ATS scoring:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {analysis.keywords_missing.map(k => (
                  <span key={k} style={{ padding: '6px 12px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--rose)' }}>+ {k}</span>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 10, fontSize: 13, color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--teal)' }}>ATS Tip:</strong> {analysis.ats_feedback}
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛠️ Improvement Suggestions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.improvements.map((imp, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12, borderLeft: `3px solid ${priorityColor[imp.priority]}` }}>
                  <span className="badge" style={{ background: `${priorityColor[imp.priority]}20`, color: priorityColor[imp.priority], fontSize: 11, flexShrink: 0, alignSelf: 'flex-start', marginTop: 1 }}>{imp.priority}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{imp.issue}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 13 }}>💡 {imp.suggestion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section feedback */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Section Feedback</h3>
            <div className="grid-2">
              {Object.entries(analysis.sections).map(([k, v]) => (
                <div key={k} style={{ padding: '14px', background: 'var(--bg3)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span style={{ color: scoreColor(v.score), fontSize: 13, fontWeight: 700 }}>{v.score}/100</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4, marginBottom: 8 }}>
                    <div style={{ width: `${v.score}%`, height: '100%', background: scoreColor(v.score), borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                  <p style={{ color: 'var(--text3)', fontSize: 12 }}>{v.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={() => setAnalysis(null)} style={{ width: '100%' }}>
            🔄 Analyze Another Resume
          </button>
        </div>
      )}
    </div>
  );
}
