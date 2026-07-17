import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import apiService from '../services/apiService';
import toast from '../services/toastService';

// ─── Stripe Init ──────────────────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  container: {
    maxWidth: 900,
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
  },
  expertPanel: {
    background: 'linear-gradient(160deg, #1a1040 0%, #2d1b69 100%)',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid rgba(255,255,255,0.07)',
  },
  paymentPanel: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    padding: '48px 40px',
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    padding: 3,
    marginBottom: 24,
    boxShadow: '0 0 40px rgba(168,85,247,0.5)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
  },
  expertName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    textAlign: 'center',
  },
  expertTitle: {
    color: 'rgba(168,85,247,0.9)',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 6,
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 99,
    padding: '5px 14px',
    fontSize: 12,
    color: '#d8b4fe',
    marginTop: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    margin: '28px 0',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    width: '100%',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(168,85,247,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  priceBox: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 16,
    padding: '20px 24px',
    textAlign: 'center',
    marginTop: 12,
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    margin: '0 0 8px 0',
  },
  priceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1,
  },
  priceSub: {
    color: '#d8b4fe',
    fontSize: 13,
    marginTop: 4,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  panelSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    margin: '0 0 32px 0',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 20,
    transition: 'all 0.2s ease',
    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  secureNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
};

// ─── Stripe Payment Form Component ────────────────────────────────────────────
const PaymentForm = ({ onSuccess, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin + '/book-session',
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
        setPaying(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await onSuccess(paymentIntent.id);
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,58,237,0.5) !important; }
        .pay-btn:active:not(:disabled) { transform: translateY(0); }
        .pay-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <PaymentElement
        options={{
          layout: 'tabs',
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#a855f7',
              colorBackground: 'rgba(255,255,255,0.04)',
              colorText: '#ffffff',
              colorDanger: '#f87171',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '10px',
            },
          },
        }}
      />

      <button
        type="submit"
        disabled={!stripe || paying}
        className="pay-btn"
        style={styles.payBtn}
      >
        {paying ? (
          <>
            <div style={styles.spinner} />
            Processing...
          </>
        ) : (
          <>
            🔒 Pay $30 & Start Session
          </>
        )}
      </button>

      <div style={styles.secureNote}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
        </svg>
        Secured by Stripe. Your payment info is never stored.
      </div>
    </form>
  );
};

// ─── Main BookSession Page ─────────────────────────────────────────────────────
const BookSession = () => {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    initPaymentIntent();
  }, []);

  const initPaymentIntent = async () => {
    try {
      setLoading(true);
      const res = await apiService.createVideoPaymentIntent();
      const data = res?.data ?? res;
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      toast.error('Failed to initialize payment. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (stripePaymentIntentId) => {
    setCreatingSession(true);
    try {
      toast.info('✅ Payment confirmed! Creating your session...');
      const res = await apiService.createVideoSession(stripePaymentIntentId);
      const session = res?.data ?? res;

      if (!session?.sessionId && !session?.SessionId) {
        throw new Error('Session creation failed — no session ID returned.');
      }

      const sessionId = session.sessionId ?? session.SessionId;
      const roomUrl   = session.roomUrl   ?? session.RoomUrl;
      const expiresAt = session.expiresAt ?? session.ExpiresAt;

      toast.success('🎉 Session started! Joining video call...');
      navigate(`/video-call?sessionId=${sessionId}&roomUrl=${encodeURIComponent(roomUrl)}&expiresAt=${encodeURIComponent(expiresAt)}`);
    } catch (err) {
      toast.error('Payment succeeded but session creation failed. Contact support.');
      console.error(err);
      setCreatingSession(false);
    }
  };

  const features = [
    { icon: '🎥', text: '15-minute HD video call' },
    { icon: '🐾', text: 'Expert pet wellness advice' },
    { icon: '📋', text: 'Personalized recommendations' },
    { icon: '🔁', text: 'Pay again for another session anytime' },
  ];

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: { theme: 'night' },
      }
    : undefined;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media (max-width: 768px) {
          .session-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.container} className="session-grid">
        {/* ── Left: Expert Profile ── */}
        <div style={styles.expertPanel}>
          <div style={styles.avatarRing}>
            <div style={styles.avatar}>🐶</div>
          </div>

          <h2 style={styles.expertName}>Dr. Sarah Mitchell</h2>
          <p style={styles.expertTitle}>Pet Wellness Expert · Certified Veterinarian</p>

          <div style={styles.badge}>
            <span style={{ color: '#4ade80' }}>●</span>
            Available Now
          </div>

          <div style={styles.divider} />

          <ul style={styles.featureList}>
            {features.map((f, i) => (
              <li key={i} style={styles.featureItem}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div style={styles.priceBox}>
            <p style={styles.priceLabel}>One-time session fee</p>
            <div style={styles.priceAmount}>$30</div>
            <p style={styles.priceSub}>per 15-minute consultation</p>
          </div>
        </div>

        {/* ── Right: Payment Panel ── */}
        <div style={styles.paymentPanel}>
          <h2 style={styles.panelTitle}>Complete Your Booking</h2>
          <p style={styles.panelSub}>Enter your payment details to start the session.</p>

          {loading || creatingSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 16 }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid rgba(168,85,247,0.2)',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                {creatingSession ? 'Creating your session...' : 'Loading payment form...'}
              </p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentForm onSuccess={handlePaymentSuccess} paymentIntentId={paymentIntentId} />
            </Elements>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <p style={{ color: '#f87171', fontSize: 14 }}>Failed to load payment. Please refresh the page.</p>
              <button
                onClick={initPaymentIntent}
                style={{ ...styles.payBtn, width: 'auto', padding: '12px 24px', marginTop: 16 }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookSession;
