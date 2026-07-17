import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { ArrowLeft, Video, VideoOff } from 'lucide-react';

const AdminVideoCallPage = () => {
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
    }, [timerRunning, handleLeave]);

    return (
        <Box sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button 
                        onClick={handleLeave}
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
                    {/* Admin Timer */}
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
                        onClick={handleLeave}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        End Session
                    </Button>
                </Box>
            </Box>

            {/* Video Container */}
            <Box sx={{ flex: 1, position: 'relative', p: 2 }}>
                {callStatus === 'initializing' && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 2
                    }}>
                        <CircularProgress sx={{ color: '#8b5cf6' }} />
                        <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Connecting to secure session...</Typography>
                    </Box>
                )}

                {callStatus === 'error' && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 2,
                        bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 3, border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <VideoOff size={48} color="#ef4444" />
                        <Typography sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem' }}>Connection Failed</Typography>
                        <Typography sx={{ color: '#94a3b8' }}>{errorMsg}</Typography>
                        <Button 
                            variant="outlined" 
                            onClick={handleLeave}
                            sx={{ mt: 2, color: '#ef4444', borderColor: '#ef4444' }}
                        >
                            Return to Dashboard
                        </Button>
                    </Box>
                )}

                <Box 
                    ref={containerRef} 
                    sx={{ 
                        position: 'absolute', inset: 16, // 16px padding
                        opacity: (callStatus === 'joined' || callStatus === 'initializing') ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        bgcolor: '#000'
                    }} 
                />
            </Box>
        </Box>
    );
};

export default AdminVideoCallPage;
