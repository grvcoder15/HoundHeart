import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: '56px 48px',
    maxWidth: 520,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
    animation: 'fadeUp 0.5s ease',
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
    border: '2px solid rgba(168,85,247,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 44,
    margin: '0 auto 28px',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 800,
    margin: '0 0 12px 0',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    margin: '0 0 36px 0',
    lineHeight: 1.6,
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 36,
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '18px 12px',
  },
  statValue: {
    color: '#a855f7',
    fontSize: 26,
    fontWeight: 800,
    display: 'block',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '0 0 32px 0',
  },
  primaryBtn: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 12,
    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
    transition: 'all 0.2s ease',
  },
  secondaryBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  note: {
    marginTop: 24,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    lineHeight: 1.5,
  },
};

const SessionEnded = () => {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const sessionId      = params.get('sessionId');
  const durationStr    = params.get('duration'); // minutes used
  const hasAnimated    = useRef(false);

  const durationUsed   = parseInt(durationStr) || 15;
  const durationLeft   = Math.max(0, 15 - durationUsed);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,58,237,0.5) !important; }
        .secondary-btn:hover { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.85) !important; }
      `}</style>

      <div style={styles.card}>
        {/* Icon */}
        <div style={{ ...styles.iconRing, animation: 'bounce 2s infinite' }}>
          🐾
        </div>

        <h1 style={styles.title}>Session Complete!</h1>
        <p style={styles.subtitle}>
          Your 15-minute consultation with <strong style={{ color: '#d8b4fe' }}>Dr. Sarah Mitchell</strong> has ended.
          We hope it was helpful for you and your furry friend!
        </p>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <span style={styles.statValue}>{durationUsed} min</span>
            <span style={styles.statLabel}>Time used</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statValue}>$30</span>
            <span style={styles.statLabel}>Amount paid</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: durationLeft > 0 ? '#4ade80' : '#f87171' }}>
              {durationLeft > 0 ? `${durationLeft} min` : '0 min'}
            </span>
            <span style={styles.statLabel}>Remaining</span>
          </div>
        </div>

        <div style={styles.divider} />

        {/* CTA Buttons */}
        <button
          id="book-again-btn"
          className="primary-btn"
          style={styles.primaryBtn}
          onClick={() => navigate('/book-session')}
        >
          🔄 Continue for $30 — Book Another Session
        </button>

        <button
          id="go-dashboard-btn"
          className="secondary-btn"
          style={styles.secondaryBtn}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>

        <p style={styles.note}>
          Each session is $30 for 15 minutes. Your previous session ended{' '}
          {sessionId ? `(ID: ${sessionId.slice(0, 8)}...)` : ''}.
          <br />
          Payments are non-refundable once a session has started.
        </p>
      </div>
    </div>
  );
};

export default SessionEnded;
