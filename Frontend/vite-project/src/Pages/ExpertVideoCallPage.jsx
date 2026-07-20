import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import apiService from '../services/apiService';

// Helper: safe sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ExpertVideoCallPage = () => {
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
    const [showWarning, setShowWarning] = useState(false);
    const [warningDismissed, setWarningDismissed] = useState(false);
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
        callFrameRef.current = null; // null out FIRST
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
                await apiService.endExpertSession({ sessionId, endedBy: 'user' });
            } catch (err) {
                console.error('Error marking session ended in DB:', err);
                showToast('⚠️ Could not update session status, but leaving call.');
            }
        }

        // STEP 2: Send intentional-end signal to the other participant
        if (callFrameRef.current) {
            try {
                callFrameRef.current.sendAppMessage(
                    { type: 'session-ended-intentionally', endedBy: 'user' }, '*'
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
                // Clean up any lingering Daily instance
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
                        if (event.data.endedBy === 'admin') {
                            showToast('Admin has ended the session');
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
                if (next === 5 * 60 && !warningDismissed) {
                    setShowWarning(true);
                }
                if (next <= 0) {
                    clearInterval(timerRef.current);
                    handleEndSessionClick();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerRunning, warningDismissed, handleEndSessionClick]);

    const timerColor = timeLeft <= 5 * 60
        ? timeLeft <= 60 ? 'text-red-500' : 'text-yellow-500'
        : 'text-green-400';
    const timerDotColor = timeLeft <= 5 * 60
        ? timeLeft <= 60 ? 'bg-red-500' : 'bg-yellow-500'
        : 'bg-green-400';

    // ── "Session already ended" screen ──────────────────────────────
    if (callStatus === 'ended') {
        return (
            <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-[9999]">
                <span className="text-6xl">🔒</span>
                <h2 className="text-white text-2xl font-bold">This session has already ended</h2>
                <p className="text-slate-400">This session was marked as ended. You cannot rejoin.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-6 py-2 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-semibold rounded-lg transition"
                >
                    Return to My Sessions
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col z-[9999]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBack}
                        className="flex items-center text-slate-400 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-white font-bold text-lg flex items-center gap-2">
                        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Expert Video Session
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    {/* Timer */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 shadow-inner">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${timerDotColor}`}></div>
                        <span className={`font-bold tabular-nums tracking-wide text-lg ${timerColor}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">left</span>
                    </div>

                    <button
                        onClick={handleEndSessionClick}
                        disabled={isEndingRef.current}
                        className="px-5 py-2 bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg shadow-red-500/20"
                    >
                        End Session
                    </button>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative p-4">
                {(callStatus === 'checking' || callStatus === 'initializing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-semibold">
                            {callStatus === 'checking' ? 'Verifying session...' : 'Connecting to secure session...'}
                        </p>
                    </div>
                )}

                {callStatus === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-red-500/5 rounded-2xl border border-red-500/20 m-4">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <h2 className="text-red-500 font-bold text-xl">Connection Failed</h2>
                        <p className="text-slate-400">{errorMsg}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold rounded-lg transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className={`absolute inset-4 transition-opacity duration-300 shadow-2xl rounded-xl overflow-hidden bg-black ${callStatus === 'joined' ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            {/* 5-min Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="text-5xl mb-4 animate-bounce">⏰</div>
                        <h2 className="text-yellow-500 text-2xl font-extrabold mb-2">5 Minutes Left</h2>
                        <p className="text-slate-300 mb-8 leading-relaxed text-sm">
                            Your expert session will end in 5 minutes. Would you like to book another session to continue speaking?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowWarning(false);
                                    setWarningDismissed(true);
                                    window.open('/expert-book-session', '_blank');
                                }}
                                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/25"
                            >
                                Book New Session — $30
                            </button>
                            <button
                                onClick={() => {
                                    setShowWarning(false);
                                    setWarningDismissed(true);
                                }}
                                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition border border-white/5"
                            >
                                Continue current call
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast */}
            {toastMsg && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl border border-slate-600 z-[10001] flex items-center gap-3 min-w-[280px] max-w-[480px]">
                    <span className="text-xl">ℹ️</span>
                    <span className="font-semibold">{toastMsg}</span>
                </div>
            )}
        </div>
    );
};

export default ExpertVideoCallPage;
