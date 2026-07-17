import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';

const ExpertVideoCallPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const url = searchParams.get('url');
    const scheduledTimeParam = searchParams.get('scheduledTime');

    // Calculate initial time based on scheduledTime if available
    let initialTimeLeft = 15 * 60;
    if (scheduledTimeParam) {
        const scheduledTime = new Date(scheduledTimeParam);
        const expiryTime = new Date(scheduledTime.getTime() + 30 * 60000); // Expiry is 30 mins after scheduled time
        const remainingSeconds = Math.floor((expiryTime.getTime() - Date.now()) / 1000);
        initialTimeLeft = Math.min(15 * 60, Math.max(0, remainingSeconds));
    }

    const callFrameRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const [callStatus, setCallStatus] = useState('initializing'); // initializing, joined, left, error
    const [errorMsg, setErrorMsg] = useState('');
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [timerRunning, setTimerRunning] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [warningDismissed, setWarningDismissed] = useState(false);

    const formatTime = (secs) => {
        const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
        const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleLeave = useCallback(() => {
        if (callFrameRef.current) {
            callFrameRef.current.leave();
            callFrameRef.current.destroy();
            callFrameRef.current = null;
        }
        setCallStatus('left');
        navigate(-1); // Go back to the previous page
    }, [navigate]);

    useEffect(() => {
        if (!url) {
            setErrorMsg("Meeting URL is missing");
            setCallStatus('error');
            return;
        }

        let isActive = true; // guard against stale closures

        const joinCall = async () => {
            try {
                // Destroy any lingering Daily instance (e.g. from React Strict Mode double-mount)
                const existing = DailyIframe.getCallInstance();
                if (existing) {
                    try { await existing.leave(); } catch (_) {}
                    existing.destroy();
                }

                if (!isActive) return; // component unmounted during async cleanup above

                const callFrame = DailyIframe.createFrame(containerRef.current, {
                    // Pass url here so the iframe is initialized with the correct
                    // Daily.co origin — prevents the postMessage origin mismatch
                    url,
                    iframeStyle: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '0',
                        borderRadius: '12px',
                    },
                    showLeaveButton: true,
                    showFullscreenButton: true,
                    allowMultipleCallInstances: false,
                });

                callFrameRef.current = callFrame;

                const checkParticipants = () => {
                    const p = callFrame.participants();
                    if (p && Object.keys(p).length >= 2) {
                        setTimerRunning(true);
                    }
                };

                callFrame.on('joined-meeting', () => {
                    if (isActive) setCallStatus('joined');
                    checkParticipants();
                });
                callFrame.on('participant-joined', checkParticipants);
                callFrame.on('left-meeting', () => {
                    if (isActive) handleLeave();
                });
                callFrame.on('error', (e) => {
                    console.error('Daily.co error:', e);
                    if (isActive) {
                        setErrorMsg(e?.errorMsg || "Failed to load the meeting.");
                        setCallStatus('error');
                    }
                });

                await callFrame.join({ url });
            } catch (err) {
                console.error("Error joining Daily.co call:", err);
                if (isActive) {
                    setErrorMsg(err.message || "Failed to initialize video call.");
                    setCallStatus('error');
                }
            }
        };

        joinCall();

        return () => {
            isActive = false;
            if (callFrameRef.current) {
                try { callFrameRef.current.leave(); } catch (_) {}
                callFrameRef.current.destroy();
                callFrameRef.current = null;
            }
        };
    }, [url, handleLeave]);

    useEffect(() => {
        if (!timerRunning) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;
                if (next === 5 * 60 && !warningDismissed) {
                        setShowWarning(true);
                    }
                    if (next <= 0) {
                        clearInterval(timerRef.current);
                        handleLeave();
                        return 0;
                    }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerRunning, warningDismissed, handleLeave]);

    const timerColor = timeLeft <= 5 * 60
        ? timeLeft <= 60 ? 'text-red-500' : 'text-yellow-500'
        : 'text-green-400';
    const timerDotColor = timeLeft <= 5 * 60
        ? timeLeft <= 60 ? 'bg-red-500' : 'bg-yellow-500'
        : 'bg-green-400';

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col z-[9999]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleLeave}
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
                        onClick={handleLeave}
                        className="px-5 py-2 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-lg transition shadow-lg shadow-red-500/20"
                    >
                        End Session
                    </button>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative p-4">
                {callStatus === 'initializing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-semibold">Connecting to secure session...</p>
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
                            onClick={handleLeave}
                            className="mt-4 px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold rounded-lg transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}

                <div 
                    ref={containerRef} 
                    className={`absolute inset-4 transition-opacity duration-300 shadow-2xl rounded-xl overflow-hidden bg-black ${(callStatus === 'joined' || callStatus === 'initializing') ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            {/* 5-min Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
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
        </div>
    );
};

export default ExpertVideoCallPage;
