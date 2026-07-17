import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    Avatar,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { Video, Clock, CheckCircle2, Calendar } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const UpcomingSessionsPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await apiService.getAdminUpcomingSessions();
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res?.data && Array.isArray(res.data)) list = res.data;
            setSessions(list);
        } catch (err) {
            console.error('Failed to fetch upcoming sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = (session) => {
        navigate(`/video-call?url=${encodeURIComponent(session.meetingLink)}`);
    };

    const isJoinable = (scheduledDateTime) => {
        const sessionDate = new Date(scheduledDateTime);
        const now = new Date();
        const timeDiffMs = sessionDate - now;
        return timeDiffMs <= 5 * 60 * 1000; // 5 min before
    };

    return (
        <AdminLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                        Upcoming Sessions
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="500">
                        All confirmed video sessions with users
                    </Typography>
                </Box>
                <Button
                    onClick={fetchSessions}
                    variant="outlined"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    Refresh
                </Button>
            </Box>

            {loading ? (
                <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
            ) : sessions.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Box sx={{ color: '#94a3b8' }}>
                        <Calendar size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                        <Typography variant="h6" fontWeight={700} gutterBottom>No Upcoming Sessions</Typography>
                        <Typography color="text.secondary">Confirmed sessions from users will appear here.</Typography>
                    </Box>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2 }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Scheduled Time</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessions.map(session => {
                                    const sessionDate = new Date(session.scheduledDateTime);
                                    const now = new Date();
                                    const timeDiffMs = sessionDate - now;
                                    // Session is expired if it is more than 30 min past scheduled time
                                    const isExpired = timeDiffMs < -(30 * 60 * 1000);
                                    const canJoin = !isExpired && timeDiffMs <= 5 * 60 * 1000;

                                    return (
                                        <TableRow key={session.sessionId} hover sx={{ opacity: isExpired ? 0.75 : 1 }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 40, height: 40, bgcolor: isExpired ? '#94a3b8' : '#8b5cf6', fontWeight: 700 }}>
                                                        {(session.userName || 'U')[0].toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={700} variant="body2">{session.userName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{session.userEmail}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography fontWeight={700} variant="body2">
                                                        {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color={isExpired ? '#94a3b8' : '#16a34a'}>${session.amountPaid?.toFixed(2)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isExpired ? 'Expired' : session.status}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: isExpired ? '#fee2e2' : '#d1fae5',
                                                        color: isExpired ? '#991b1b' : '#065f46'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {isExpired ? (
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.75,
                                                        px: 2,
                                                        py: 0.75,
                                                        borderRadius: 2,
                                                        bgcolor: '#fee2e2',
                                                        border: '1px solid #fca5a5',
                                                    }}>
                                                        <CheckCircle2 size={14} color="#dc2626" />
                                                        <Typography variant="caption" fontWeight={700} color="#dc2626">
                                                            Session Expired
                                                        </Typography>
                                                    </Box>
                                                ) : canJoin ? (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<Video size={14} />}
                                                        onClick={() => handleStartSession(session)}
                                                        sx={{
                                                            bgcolor: '#16a34a',
                                                            '&:hover': { bgcolor: '#15803d' },
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            animation: 'pulse 2s infinite'
                                                        }}
                                                    >
                                                        Start Session
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        size="small"
                                                        startIcon={<Clock size={14} />}
                                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                                    >
                                                        {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </AdminLayout>
    );
};

export default UpcomingSessionsPage;
