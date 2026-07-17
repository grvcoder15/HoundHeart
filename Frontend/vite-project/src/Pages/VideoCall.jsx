import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import apiService from '../services/apiService';
import toast from '../services/toastService';

const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes
const WARNING_THRESHOLD = 5 * 60;          // warn at 5 min remaining

// ─── Helper: Format seconds → MM:SS ──────────────────────────────────────────
const formatTime = (secs) => {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── Inline Styles ────────────────────────────────────────────────────────────
const styles = {
  page: {
    position: 'fixed',
    inset: 0,
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    zIndex: 10,
    flexShrink: 0,
  },
  logo: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  timerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 99,
    padding: '8px 20px',
    transition: 'all 0.3s ease',
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4ade80',
    animation: 'pulse 1.5s infinite',
  },
  timerText: {
    fontWeight: 700,
    fontSize: 20,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 1,
    color: '#fff',
  },
  endBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 10,
    border: '1px solid rgba(239,68,68,0.4)',
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s ease',
  },
  iframeContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 5,
  },
  spinner: {
    width: 56,
    height: 56,
    border: '4px solid rgba(168,85,247,0.2)',
    borderTopColor: '#a855f7',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  warningModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  warningCard: {
    background: 'linear-gradient(135deg, #1a0a3d, #2d1040)',
    border: '1px solid rgba(251,191,36,0.3)',
    borderRadius: 20,
    padding: '40px 48px',
    textAlign: 'center',
    maxWidth: 420,
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.3s ease',
  },
  warningEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  warningText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    margin: '0 0 28px 0',
    lineHeight: 1.6,
  },
  warningBtn: {
    padding: '14px 36px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#000',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const VideoCall = () => {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const sessionId  = params.get('sessionId');
  const roomUrl    = params.get('roomUrl')    ? decodeURIComponent(params.get('roomUrl'))    : null;
  const expiresAtP = params.get('expiresAt') ? decodeURIComponent(params.get('expiresAt')) : null;

  const callContainerRef  = useRef(null);
  const callFrameRef      = useRef(null);
  const timerRef          = useRef(null);
  const endCalledRef      = useRef(false);

  const [timeLeft,       setTimeLeft]       = useState(SESSION_DURATION_SECONDS);
  const [callJoined,     setCallJoined]     = useState(false);
  const [showWarning,    setShowWarning]    = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [sessionValid,   setSessionValid]   = useState(null); // null=loading, true, false

  // ── Compute initial timeLeft from server expiresAt ──────────────────────────
  useEffect(() => {
    if (expiresAtP) {
      const expiry = new Date(expiresAtP).getTime();
      const now    = Date.now();
      const diff   = Math.floor((expiry - now) / 1000);
      setTimeLeft(Math.max(0, diff));
    }
  }, [expiresAtP]);

  // ── Verify session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !roomUrl) {
      setSessionValid(false);
      return;
    }
    apiService.getVideoSessionStatus(sessionId)
      .then((res) => {
        const d = res?.data ?? res;
        if (d?.isActive || d?.IsActive) {
          setSessionValid(true);
          if (d.remainingSeconds || d.RemainingSeconds) {
            setTimeLeft(d.remainingSeconds ?? d.RemainingSeconds);
          }
        } else {
          setSessionValid(false);
        }
      })
      .catch(() => setSessionValid(false));
  }, [sessionId, roomUrl]);

  // ── Build Daily.co call frame once session verified ──────────────────────────
  useEffect(() => {
    if (!sessionValid || !roomUrl || !callContainerRef.current || callFrameRef.current) return;

    const frame = DailyIframe.createFrame(callContainerRef.current, {
      url: roomUrl,
      iframeStyle: {
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        border: 'none',
      },
      showLeaveButton: false,
      showFullscreenButton: true,
    });

    callFrameRef.current = frame;

    frame
      .on('joined-meeting', () => {
        setCallJoined(true);
      })
      .on('error', (e) => {
        console.error('Daily.co error:', e);
        toast.error('Video call error. Please rejoin.');
      });

    frame.join({ url: roomUrl });

    return () => {
      frame.destroy();
      callFrameRef.current = null;
    };
  }, [sessionValid, roomUrl]);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  const handleEnd = useCallback(async (auto = false) => {
    if (endCalledRef.current) return;
    endCalledRef.current = true;

    clearInterval(timerRef.current);

    // Destroy Daily frame
    if (callFrameRef.current) {
      try { callFrameRef.current.destroy(); } catch (_) {}
      callFrameRef.current = null;
    }

    // Tell backend
    try {
      if (sessionId) await apiService.endVideoSession(sessionId);
    } catch (_) {}

    if (auto) toast.info('⏰ Your 15-minute session has ended.');
    else      toast.info('Call ended.');

    const used = SESSION_DURATION_SECONDS - Math.max(timeLeft, 0);
    navigate(`/session-ended?sessionId=${sessionId}&duration=${Math.floor(used / 60)}`);
  }, [sessionId, timeLeft, navigate]);

  useEffect(() => {
    if (!sessionValid) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;

        // 5-minute warning
        if (next === WARNING_THRESHOLD && !warningDismissed) {
          setShowWarning(true);
        }

        // Auto-end
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleEnd(true);
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [sessionValid, warningDismissed, handleEnd]);

  // ── Timer color ──────────────────────────────────────────────────────────────
  const timerColor = timeLeft <= WARNING_THRESHOLD
    ? timeLeft <= 60 ? '#f87171' : '#fbbf24'
    : '#4ade80';

  // ── Loading / Invalid ────────────────────────────────────────────────────────
  if (sessionValid === null) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 16 }}>Verifying session...</p>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>⚠️</div>
          <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 12 }}>Session Not Found</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
            This session has expired or is invalid.
          </p>
          <button
            onClick={() => navigate('/book-session')}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15,
            }}
          >
            Book a New Session — $30
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .end-btn:hover { background: rgba(239,68,68,0.25) !important; border-color: rgba(239,68,68,0.7) !important; }
        .dismiss-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={styles.topBar}>
        <div style={styles.logo}>
          <span>🐾</span> Hound Heart
        </div>

        {/* Timer */}
        <div style={{ ...styles.timerBox, borderColor: `${timerColor}44` }}>
          <div style={{ ...styles.timerDot, background: timerColor }} />
          <span style={{ ...styles.timerText, color: timerColor }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>remaining</span>
        </div>

        {/* End call button */}
        <button
          className="end-btn"
          style={styles.endBtn}
          onClick={() => handleEnd(false)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          End Call
        </button>
      </div>

      {/* ── Daily.co iframe container ── */}
      <div style={styles.iframeContainer}>
        {!callJoined && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Connecting to your session...</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Allow camera and microphone access when prompted.
            </p>
          </div>
        )}
        <div
          ref={callContainerRef}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        />
      </div>

      {/* ── 5-min Warning Modal ── */}
      {showWarning && (
        <div style={styles.warningModal}>
          <div style={styles.warningCard}>
            <div style={styles.warningEmoji}>⏰</div>
            <h2 style={styles.warningTitle}>5 Minutes Remaining</h2>
            <p style={styles.warningText}>
              Your consultation session will end in <strong>5 minutes</strong>.
              Wrap up your conversation or book another session afterwards.
            </p>
            <button
              className="dismiss-btn"
              style={styles.warningBtn}
              onClick={() => {
                setShowWarning(false);
                setWarningDismissed(true);
              }}
            >
              Got it, continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
