import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { ArrowLeft, Video, VideoOff } from 'lucide-react';
import apiService from '../services/apiService';

// Helper: safe sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AdminVideoCallPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const url = searchParams.get('url');
    const scheduledTimeParam = searchParams.get('scheduledTime');
    const sessionId = searchParams.get('sessionId');

    // Calculate initial time based on scheduledTime if available
    let initialTimeLeft = 15 * 60;
    if (scheduledTimeParam) {
        const scheduledTime = new Date(scheduledTimeParam);
        const expiryTime = new Date(scheduledTime.getTime() + 30 * 60000);
        const remainingSeconds = Math.floor((expiryTime.getTime() - Date.now()) / 1000);
        initialTimeLeft = Math.min(15 * 60, Math.max(0, remainingSeconds));
    }

    const callFrameRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const intentionalEndSignalReceivedAt = useRef(null);
    const isEndingRef = useRef(false); // guard against double-end

    const [callStatus, setCallStatus] = useState('checking'); // checking, initializing, joined, left, error, ended
    const [errorMsg, setErrorMsg] = useState('');
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [timerRunning, setTimerRunning] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const showToast = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4500);
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
        const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Safe destroy helper ─────────────────────────────────────────
    const destroyCallFrame = useCallback(() => {
        const frame = callFrameRef.current;
        if (!frame) return;
        callFrameRef.current = null; // null out FIRST to prevent any stale-ref calls
        try { frame.leave(); } catch (_) {}
        try { frame.destroy(); } catch (_) {}
    }, []);

    // ── Navigate back ───────────────────────────────────────────────
    const goBack = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        destroyCallFrame();
        navigate(-1);
    }, [destroyCallFrame, navigate]);

    // ── End Session click (CORRECT ORDER) ──────────────────────────
    const handleEndSessionClick = useCallback(async () => {
        if (isEndingRef.current) return; // prevent double-click
        isEndingRef.current = true;

        // STEP 1: Call backend FIRST, await it
        if (sessionId) {
            try {
                await apiService.endExpertSession({ sessionId, endedBy: 'admin' });
            } catch (err) {
                console.error('Error marking session ended in DB:', err);
                showToast('⚠️ Could not update session status, but leaving call.');
            }
        }

        // STEP 2: Send intentional-end signal to the other participant
        if (callFrameRef.current) {
            try {
                callFrameRef.current.sendAppMessage(
                    { type: 'session-ended-intentionally', endedBy: 'admin' }, '*'
                );
            } catch (e) {
                console.warn('sendAppMessage failed (call may already be closing):', e);
            }
        }

        // STEP 3: Wait for message to propagate, then destroy and navigate
        await sleep(500);

        if (timerRef.current) clearInterval(timerRef.current);
        destroyCallFrame();
        navigate(-1);
    }, [sessionId, showToast, destroyCallFrame, navigate]);

    // ── Session status pre-check & Daily.co setup ──────────────────
    useEffect(() => {
        if (!url) {
            setErrorMsg('Meeting URL is missing.');
            setCallStatus('error');
            return;
        }

        let isActive = true;

        const init = async () => {
            // Pre-check: if sessionId exists, verify the session is not already ended
            if (sessionId) {
                try {
                    const res = await apiService.getExpertSessionStatus(sessionId);
                    const status = res?.data?.status ?? res?.status;
                    if (status === 'Ended') {
                        if (isActive) setCallStatus('ended');
                        return;
                    }
                } catch (err) {
                    // Non-fatal: if status check fails just proceed to join
                    console.warn('Session status check failed, proceeding to join:', err);
                }
            }

            if (!isActive) return;
            setCallStatus('initializing');

            try {
                // Clean up any lingering Daily instance (Strict Mode, hot-reload, rejoin)
                const existing = DailyIframe.getCallInstance();
                if (existing) {
                    try { await existing.leave(); } catch (_) {}
                    try { existing.destroy(); } catch (_) {}
                }

                if (!isActive) return;

                const callFrame = DailyIframe.createFrame(containerRef.current, {
                    url,
                    iframeStyle: {
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: '0', borderRadius: '12px',
                    },
                    showLeaveButton: true,
                    showFullscreenButton: true,
                    allowMultipleCallInstances: false,
                });

                callFrameRef.current = callFrame;

                const checkParticipants = () => {
                    try {
                        const p = callFrameRef.current?.participants();
                        if (p && Object.keys(p).length >= 2) setTimerRunning(true);
                    } catch (_) {}
                };

                const onJoined = () => {
                    if (isActive) setCallStatus('joined');
                    checkParticipants();
                };

                const onParticipantLeft = () => {
                    const now = Date.now();
                    const timeSinceSignal = intentionalEndSignalReceivedAt.current
                        ? now - intentionalEndSignalReceivedAt.current
                        : Infinity;
                    if (timeSinceSignal > 3000) {
                        showToast('Connection lost. The other participant may have disconnected unexpectedly.');
                    }
                };

                const onAppMessage = (event) => {
                    if (event.data?.type === 'session-ended-intentionally') {
                        intentionalEndSignalReceivedAt.current = Date.now();
                        if (event.data.endedBy === 'user') {
                            showToast('User has ended the session');
                        } else {
                            showToast('The other person has ended the session');
                        }
                        setTimeout(() => {
                            if (isActive) {
                                if (timerRef.current) clearInterval(timerRef.current);
                                destroyCallFrame();
                                navigate(-1);
                            }
                        }, 2000);
                    }
                };

                const onLeftMeeting = () => {
                    // Only navigate if we didn't trigger the leave ourselves (isEndingRef)
                    if (isActive && !isEndingRef.current) {
                        goBack();
                    }
                };

                const onError = (e) => {
                    console.error('Daily.co error:', e);
                    if (isActive) {
                        setErrorMsg(e?.errorMsg || 'Failed to load the meeting.');
                        setCallStatus('error');
                    }
                };

                callFrame.on('joined-meeting', onJoined);
                callFrame.on('participant-joined', checkParticipants);
                callFrame.on('participant-left', onParticipantLeft);
                callFrame.on('app-message', onAppMessage);
                callFrame.on('left-meeting', onLeftMeeting);
                callFrame.on('error', onError);

                await callFrame.join({ url });
            } catch (err) {
                console.error('Error joining Daily.co call:', err);
                if (isActive) {
                    setErrorMsg(err.message || 'Failed to initialize video call.');
                    setCallStatus('error');
                }
            }
        };

        init();

        return () => {
            isActive = false;
            if (timerRef.current) clearInterval(timerRef.current);
            // Null out ref first, then destroy, to prevent any in-flight handlers firing
            const frame = callFrameRef.current;
            callFrameRef.current = null;
            if (frame) {
                try { frame.leave(); } catch (_) {}
                try { frame.destroy(); } catch (_) {}
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, sessionId]);

    // ── Timer countdown ─────────────────────────────────────────────
    useEffect(() => {
        if (!timerRunning) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(timerRef.current);
                    handleEndSessionClick();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerRunning, handleEndSessionClick]);

    // ── "Session already ended" screen ──────────────────────────────
    if (callStatus === 'ended') {
        return (
            <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 9999 }}>
                <Typography sx={{ fontSize: '3rem' }}>🔒</Typography>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>This session has already ended</Typography>
                <Typography sx={{ color: '#94a3b8' }}>The session was marked as ended. You cannot rejoin.</Typography>
                <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 2, color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    Return to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
            {/* Header */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 2,
                bgcolor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        onClick={goBack}
                        startIcon={<ArrowLeft size={18} />}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        Back
                    </Button>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Video size={20} color="#8b5cf6" />
                        Admin Video Session
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* Timer */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: 'rgba(255,255,255,0.05)', px: 2, py: 0.5, borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: timeLeft <= 300 ? '#ef4444' : '#22c55e',
                            animation: 'pulse 1.5s infinite'
                        }} />
                        <Typography sx={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem',
                            color: timeLeft <= 300 ? '#ef4444' : '#fff'
                        }}>
                            {formatTime(timeLeft)}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleEndSessionClick}
                        disabled={isEndingRef.current}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        End Session
                    </Button>
                </Box>
            </Box>

            {/* Video Container */}
            <Box sx={{ flex: 1, position: 'relative', p: 2 }}>
                {(callStatus === 'checking' || callStatus === 'initializing') && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <CircularProgress sx={{ color: '#8b5cf6' }} />
                        <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            {callStatus === 'checking' ? 'Verifying session...' : 'Connecting to secure session...'}
                        </Typography>
                    </Box>
                )}

                {callStatus === 'error' && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 3, border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <VideoOff size={48} color="#ef4444" />
                        <Typography sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem' }}>Connection Failed</Typography>
                        <Typography sx={{ color: '#94a3b8' }}>{errorMsg}</Typography>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            sx={{ mt: 2, color: '#ef4444', borderColor: '#ef4444' }}
                        >
                            Return to Dashboard
                        </Button>
                    </Box>
                )}

                <Box
                    ref={containerRef}
                    sx={{
                        position: 'absolute', inset: 16,
                        opacity: callStatus === 'joined' ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        borderRadius: '12px', overflow: 'hidden', bgcolor: '#000'
                    }}
                />
            </Box>

            {/* Custom Toast */}
            {toastMsg && (
                <Box sx={{
                    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                    bgcolor: '#1e293b', color: '#fff', px: 3, py: 1.5, borderRadius: 3,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #475569',
                    zIndex: 10001, display: 'flex', alignItems: 'center', gap: 2,
                    minWidth: 280, maxWidth: 480
                }}>
                    <Typography sx={{ fontSize: '1.25rem' }}>ℹ️</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{toastMsg}</Typography>
                </Box>
            )}
        </Box>
    );
};

export default AdminVideoCallPage;
