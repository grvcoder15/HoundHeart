import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Avatar,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert,
    MenuItem,
    InputAdornment,
    Tabs,
    Tab,
    Tooltip
} from '@mui/material';
import {
    Plus,
    Filter,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    UserPlus,
    Zap,
    MessageSquare,
    ShoppingBag,
    Search,
    Video,
    CalendarDays
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const getMinMaxDates = () => {
    const now = new Date();
    // Minimum 1 hour from now to avoid immediate past selection
    const min = new Date(now.getTime() + 60 * 60 * 1000);
    // Maximum 7 days from now
    const max = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const formatForInput = (d) => {
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    
    return {
        min: formatForInput(min),
        max: formatForInput(max)
    };
};

const ExpertQueriesPage = () => {
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    // Session Requests State
    const [sessionRequests, setSessionRequests] = useState([]);
    const [sessionRequestsLoading, setSessionRequestsLoading] = useState(false);
    const [slotDialog, setSlotDialog] = useState({ open: false, request: null });
    const [proposedSlots, setProposedSlots] = useState(['', '', '']);
    const [sendingSlots, setSendingSlots] = useState(false);
    const [sessionRequestsError, setSessionRequestsError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for join button logic
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    
    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelRequest, setCancelRequest] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Filter state
    const [tempFilters, setTempFilters] = useState({ search: '', status: '', priority: '' });
    const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

    useEffect(() => {
        fetchQueries();
        fetchSessionRequests();

        // Refetch every time user returns to this tab/page (e.g. after ending a session call)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchSessionRequests();
            }
        };
        const handleFocus = () => fetchSessionRequests();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSessionRequests = async () => {
        try {
            setSessionRequestsLoading(true);
            setSessionRequestsError('');
            const res = await apiService.getExpertSessionRequests();
            console.log('Session requests raw response:', res);
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res?.data && Array.isArray(res.data)) list = res.data;
            else if (res?.data) list = [res.data]; // single object fallback
            console.log('Session requests parsed:', list);
            setSessionRequests(list);
        } catch (err) {
            console.error('Failed to fetch session requests', err);
            setSessionRequestsError(err?.message || 'Failed to load requests. Check console.');
        } finally {
            setSessionRequestsLoading(false);
        }
    };

    const handleOpenSlotDialog = (request) => {
        setSlotDialog({ open: true, request });
        setProposedSlots(['', '', '']);
    };

    const handleOpenCancelDialog = (req) => {
        setCancelRequest(req);
        setCancelReason('');
        setCancelDialogOpen(true);
    };

    const handleCloseCancelDialog = () => {
        setCancelDialogOpen(false);
        setCancelRequest(null);
        setCancelReason('');
    };

    const handleCancelSession = async () => {
        if (!cancelReason.trim()) return;
        try {
            setCancelling(true);
            await apiService.cancelExpertSession(cancelRequest.requestId, cancelReason);
            handleCloseCancelDialog();
            fetchSessionRequests();
        } catch (error) {
            console.error('Failed to cancel session', error);
            alert(error.message || 'Failed to cancel session');
        } finally {
            setCancelling(false);
        }
    };

    // Safely convert a datetime-local string (local time) to a UTC ISO string
    const localInputToUTC = (s) => {
        // datetime-local gives e.g. "2026-07-15T16:02"
        // Use explicit constructor to always treat as LOCAL time
        const [datePart, timePart] = s.split('T');
        const [yr, mo, dy] = datePart.split('-').map(Number);
        const [hr, mn] = timePart.split(':').map(Number);
        return new Date(yr, mo - 1, dy, hr, mn).toISOString();
    };

    const handleSendSlots = async () => {
        const filled = proposedSlots.filter(s => s !== '');
        if (filled.length < 1) {
            showSnackbar('Please add at least one time slot', 'warning');
            return;
        }
        try {
            setSendingSlots(true);
            const utcSlots = filled.map(s => localInputToUTC(s));
            console.log('Sending slots (UTC):', utcSlots);
            await apiService.sendExpertSessionSlots(
                slotDialog.request.requestId,
                utcSlots
            );
            showSnackbar('Slots sent to user successfully!', 'success');
            setSlotDialog({ open: false, request: null });
            fetchSessionRequests();
        } catch (err) {
            showSnackbar(err.message || 'Failed to send slots', 'error');
        } finally {
            setSendingSlots(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return { bgcolor: '#fef3c7', color: '#92400e' };
            case 'SlotsSent': return { bgcolor: '#dbeafe', color: '#1e40af' };
            case 'Scheduled': return { bgcolor: '#d1fae5', color: '#065f46' };
            case 'Completed': return { bgcolor: '#f0fdf4', color: '#166534' };
            case 'Cancelled': 
            case 'Expired': return { bgcolor: '#fee2e2', color: '#991b1b' };
            default: return { bgcolor: '#f1f5f9', color: '#475569' };
        }
    };

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllExpertQueries();
            // Data may be an array direct or wrapped in data property
            let list = [];
            if (Array.isArray(data)) list = data;
            else if (data?.data && Array.isArray(data.data)) list = data.data;
            else if (data?.result && Array.isArray(data.result)) list = data.result;
            
            setQueries(list);
        } catch (error) {
            console.error('Failed to fetch expert queries', error);
            showSnackbar('Failed to load queries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRespond = (query) => {
        setSelectedQuery(query);
        setResponseText(query.adminResponse || '');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedQuery(null);
        setResponseText('');
    };

    const getQueryId = (q) => q.expertQuestionId || q.ExpertQuestionId || q.id || q.Id;

    const handleSubmitResponse = async () => {
        if (!selectedQuery) return;
        
        try {
            setSubmitting(true);
            await apiService.respondToExpertQuery(getQueryId(selectedQuery), responseText);
            showSnackbar('Response submitted successfully', 'success');
            handleCloseDialog();
            fetchQueries(); // Reload queries
        } catch (error) {
            console.error('Error submitting response', error);
            showSnackbar(error.message || 'Failed to submit response', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setFilterDialogOpen(false);
    };

    const handleClearFilters = () => {
        const cleared = { search: '', status: '', priority: '' };
        setTempFilters(cleared);
        setFilters(cleared);
        setFilterDialogOpen(false);
    };

    const filteredQueries = queries.filter(q => {
        let match = true;
        const qStatus = q.status || q.Status || '';
        const qPriority = q.priority || q.Priority || '';
        const qSubject = q.subject || q.Subject || '';
        const qName = q.name || q.Name || '';
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            match = match && (
                qSubject.toLowerCase().includes(searchLower) ||
                qName.toLowerCase().includes(searchLower)
            );
        }
        if (filters.status) {
            match = match && qStatus === filters.status;
        }
        if (filters.priority) {
            match = match && qPriority === filters.priority;
        }
        return match;
    });

    const handleExport = () => {
        if (filteredQueries.length === 0) {
            showSnackbar('No data to export', 'warning');
            return;
        }
        
        const headers = ['Query Subject', 'From', 'Category', 'Priority', 'Status', 'Date', 'Admin Response'];
        const csvRows = [headers.join(',')];
        
        filteredQueries.forEach(q => {
            const row = [
                `"${(q.subject || '').replace(/"/g, '""')}"`,
                `"${(q.name || '').replace(/"/g, '""')}"`,
                `"${(q.category || '').replace(/"/g, '""')}"`,
                `"${(q.priority || '').replace(/"/g, '""')}"`,
                `"${(q.status || '').replace(/"/g, '""')}"`,
                `"${new Date(q.createdOn).toLocaleDateString()}"`,
                `"${(q.adminResponse || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `Expert_Queries_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSnackbar('Export successful', 'success');
    };

    // Calculate dynamic stats
    const totalQueries = queries.length;
    const pendingQueries = queries.filter(q => (q.status || q.Status) === 'Pending').length;
    const answeredQueries = queries.filter(q => ['Answered', 'Replied'].includes(q.status || q.Status)).length;

    const stats = [
        { label: 'Total Queries', value: totalQueries.toString(), icon: <MessageSquare size={20} />, color: '#10b981', sub: 'All recorded queries' },
        { label: 'Pending Review', value: pendingQueries.toString(), icon: <Clock size={20} />, color: '#f59e0b', sub: 'Needs response' },
        { label: 'Answered', value: answeredQueries.toString(), icon: <CheckCircle2 size={20} />, color: '#8b5cf6', sub: 'Resolved queries' },
    ];

    return (
        <AdminLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                        Expert Queries
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="500">
                        Review and manage expert queries and video session requests
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ mb: 3, borderBottom: '2px solid #e2e8f0' }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => setActiveTab(v)}
                    sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' } }}
                >
                    <Tab label={`Expert Q&A (${queries.length})`} icon={<MessageSquare size={16} />} iconPosition="start" />
                    <Tab
                        label={`Session Requests (${sessionRequests.filter(r => r.status === 'Pending').length} pending)`}
                        icon={<Video size={16} />}
                        iconPosition="start"
                        sx={{ '& .MuiTab-root': { color: '#ef4444' } }}
                    />
                </Tabs>
            </Box>

            {activeTab === 1 && (
                <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', mb: 4 }}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="800">Video Session Requests</Typography>
                        <Button onClick={fetchSessionRequests} sx={{ textTransform: 'none', fontWeight: 600 }}>Refresh</Button>
                    </Box>

                    {sessionRequestsLoading ? (
                        <LinearProgress sx={{ borderRadius: 2 }} />
                    ) : sessionRequestsError ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: '#dc2626' }}>
                            <Typography fontWeight={700} mb={1}>⚠️ Error loading requests</Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>{sessionRequestsError}</Typography>
                            <Button variant="outlined" color="error" size="small" onClick={fetchSessionRequests}>Retry</Button>
                        </Box>
                    ) : sessionRequests.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                            <CalendarDays size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                            <Typography>No session requests yet.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Problem</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Preferred Timing</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sessionRequests.map(req => (
                                        <TableRow key={req.requestId} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#8b5cf6', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        {(req.userName || 'U')[0].toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={700} variant="body2">{req.userName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{req.userEmail}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {req.problemDescription}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={req.preferredTiming} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    let displayStatus = req.status;
                                                    if (req.status === 'Scheduled' && req.scheduledDateTime) {
                                                        const scheduledTime = new Date(req.scheduledDateTime + (req.scheduledDateTime.endsWith('Z') ? '' : 'Z'));
                                                        const diffMinutes = (scheduledTime - currentTime) / 60000;
                                                        if (diffMinutes < -60) displayStatus = 'Expired';
                                                    }
                                                    return (
                                                        <Chip
                                                            label={displayStatus}
                                                            size="small"
                                                            sx={{ fontWeight: 700, ...getStatusColor(displayStatus) }}
                                                        />
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {req.status === 'Scheduled' && req.scheduledDateTime ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="700" color="success.main">
                                                            {new Date(req.scheduledDateTime + (req.scheduledDateTime.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </Typography>
                                                        <Typography variant="caption" color="success.main" fontWeight="600">
                                                            {new Date(req.scheduledDateTime + (req.scheduledDateTime.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(req.createdAt + (req.createdAt.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    {req.status === 'Pending' ? (
                                                        <>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<CalendarDays size={14} />}
                                                                onClick={() => handleOpenSlotDialog(req)}
                                                                sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, textTransform: 'none', fontWeight: 700 }}
                                                            >
                                                                Send Slots
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleOpenCancelDialog(req)}
                                                                sx={{ textTransform: 'none', fontWeight: 700 }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : req.status === 'Scheduled' && req.scheduledDateTime ? (
                                                        (() => {
                                                            const scheduledTime = new Date(req.scheduledDateTime + (req.scheduledDateTime.endsWith('Z') ? '' : 'Z'));
                                                            const diffMinutes = (scheduledTime - currentTime) / 60000;
                                                            
                                                            if (diffMinutes < -30) {
                                                                return <Chip label="Expired" color="error" size="small" sx={{ fontWeight: 600 }} />;
                                                            } else if (diffMinutes <= 5) {
                                                                return (
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        size="small"
                                                                        startIcon={<Video size={14} />}
                                                                        onClick={() => navigate(`/video-call?url=${encodeURIComponent(req.meetingLink)}&scheduledTime=${scheduledTime.toISOString()}&sessionId=${req.sessionId}`)}
                                                                        sx={{ textTransform: 'none', fontWeight: 700, animation: 'pulse 2s infinite' }}
                                                                    >
                                                                        Join
                                                                    </Button>
                                                                );
                                                            } else {
                                                                return <Chip label="Scheduled" size="small" sx={{ fontWeight: 600 }} />;
                                                            }
                                                        })()
                                                    ) : req.status === 'Ended' ? (
                                                        <Chip label="Session Ended" size="small" sx={{ fontWeight: 600, bgcolor: '#374151', color: '#9ca3af' }} />
                                                    ) : req.status === 'Cancelled' ? (
                                                        <Tooltip title={req.cancellationReason || 'No reason provided'}>
                                                            <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 600, cursor: 'help' }} />
                                                        </Tooltip>
                                                    ) : (
                                                        <Chip label={req.status} size="small" sx={{ fontWeight: 600 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {activeTab === 0 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="800">Expert Query Management</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                            startIcon={<Filter size={18} />} 
                            onClick={() => {
                                setTempFilters(filters);
                                setFilterDialogOpen(true);
                            }}
                            sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
                        >
                            Filter {(filters.status || filters.priority || filters.search) ? '(Active)' : ''}
                        </Button>
                        <Button 
                            startIcon={<Download size={18} />} 
                            onClick={handleExport}
                            sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
                        >
                            Export
                        </Button>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', py: 2 }}>Query</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && filteredQueries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No expert queries found
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && filteredQueries.map((q, idx) => (
                                <TableRow key={getQueryId(q) || idx} hover>
                                    <TableCell style={{ maxWidth: '300px' }}>
                                        <Typography variant="body2" fontWeight="700" color="#334155" noWrap title={q.subject || q.Subject}>{q.subject || q.Subject}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">From: {q.name || q.Name || 'N/A'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={q.category || q.Category} size="small" sx={{ borderRadius: '6px', fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={q.priority || q.Priority}
                                            size="small"
                                            sx={{
                                                borderRadius: '6px',
                                                fontWeight: 800,
                                                bgcolor: (q.priority || q.Priority) === 'High Priority' ? '#fef2f2' : '#f8fafc',
                                                color: (q.priority || q.Priority) === 'High Priority' ? '#ef4444' : '#1e293b'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={q.status || q.Status}
                                            size="small"
                                            sx={{
                                                borderRadius: '6px',
                                                fontWeight: 800,
                                                bgcolor: (q.status || q.Status) === 'Pending' ? '#fff7ed' : '#f0fdf4',
                                                color: (q.status || q.Status) === 'Pending' ? '#f97316' : '#16a34a'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                                        {new Date(q.createdOn || q.CreatedOn).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button 
                                                variant={(q.status || q.Status) === 'Pending' ? "contained" : "outlined"} 
                                                size="small" 
                                                onClick={() => handleOpenRespond(q)}
                                                sx={{ 
                                                    bgcolor: (q.status || q.Status) === 'Pending' ? '#8b5cf6' : 'transparent', 
                                                    color: (q.status || q.Status) === 'Pending' ? 'white' : '#8b5cf6',
                                                    borderColor: '#8b5cf6',
                                                    fontWeight: 800, 
                                                    textTransform: 'none', 
                                                    borderRadius: 2, 
                                                    px: 2,
                                                    '&:hover': {
                                                        bgcolor: (q.status || q.Status) === 'Pending' ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                                                    }
                                                }}
                                            >
                                                {(q.status || q.Status) === 'Pending' ? 'Respond' : 'View / Edit'}
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            )}

            {/* Send Slots Dialog */}
            <Dialog open={slotDialog.open} onClose={() => setSlotDialog({ open: false, request: null })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarDays size={20} color="#8b5cf6" />
                    Send Available Slots to {slotDialog.request?.userName}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Problem:</Typography>
                        <Typography variant="body2">{slotDialog.request?.problemDescription}</Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>Preferred Timing:</Typography>
                        <Typography variant="body2">{slotDialog.request?.preferredTiming}</Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Propose up to 3 time slots:</Typography>
                    {[0, 1, 2].map(i => (
                        <Box key={i} sx={{ mb: 2 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">Slot {i + 1}</Typography>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                size="small"
                                value={proposedSlots[i]}
                                onChange={(e) => {
                                    const updated = [...proposedSlots];
                                    updated[i] = e.target.value;
                                    setProposedSlots(updated);
                                }}
                                sx={{ mt: 0.5 }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: getMinMaxDates().min,
                                    max: getMinMaxDates().max,
                                    onKeyDown: (e) => e.preventDefault(), // Prevent manual typing
                                    onClick: (e) => {
                                        try {
                                            if (e.target.showPicker) {
                                                e.target.showPicker();
                                            }
                                        } catch (err) {}
                                    }
                                }}
                            />
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSlotDialog({ open: false, request: null })} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSendSlots}
                        variant="contained"
                        disabled={sendingSlots}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        {sendingSlots ? 'Sending...' : 'Send to User'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Respond Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MessageSquare size={20} color="#8b5cf6" />
                    {selectedQuery?.status === 'Pending' ? 'Respond to Expert Query' : 'View / Edit Response'}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedQuery && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight="700">From:</Typography>
                                <Typography variant="body1" fontWeight="600">{selectedQuery.name || selectedQuery.Name || 'N/A'} {selectedQuery.companionName || selectedQuery.CompanionName ? `(Companion: ${selectedQuery.companionName || selectedQuery.CompanionName})` : ''}</Typography>
                                {(selectedQuery.email || selectedQuery.Email) && (
                                    <Typography variant="caption" color="text.secondary">{selectedQuery.email || selectedQuery.Email}</Typography>
                                )}
                                
                                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ mt: 1 }}>Subject:</Typography>
                                <Typography variant="body1" fontWeight="600">{selectedQuery.subject}</Typography>
                                
                                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ mt: 1 }}>Question:</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedQuery.questionText}</Typography>
                            </Box>
                            
                            <TextField
                                label="Your Response"
                                multiline
                                rows={6}
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                fullWidth
                                variant="outlined"
                                placeholder="Type the expert guidance response here..."
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={submitting}>Cancel</Button>
                    <Button 
                        onClick={handleSubmitResponse} 
                        variant="contained" 
                        disabled={submitting || !responseText.trim()}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Response'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Filter size={20} color="#8b5cf6" />
                    Filter Queries
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="Search"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by subject or name"
                            value={tempFilters.search}
                            onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} color="#94a3b8" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            select
                            label="Status"
                            fullWidth
                            value={tempFilters.status}
                            onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Replied">Replied</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Priority"
                            fullWidth
                            value={tempFilters.priority}
                            onChange={(e) => setTempFilters({ ...tempFilters, priority: e.target.value })}
                        >
                            <MenuItem value="">All Priorities</MenuItem>
                            <MenuItem value="Normal">Normal</MenuItem>
                            <MenuItem value="High Priority">High Priority</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClearFilters} color="inherit">Clear Filters</Button>
                    <Button 
                        onClick={handleApplyFilters} 
                        variant="contained" 
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        Apply Filters
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Request Dialog */}
            <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Cancel Session Request</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Are you sure you want to cancel the session request for {cancelRequest?.userName}? This will notify the user.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Cancellation"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="E.g., No available slots this week, topic outside expertise..."
                        required
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseCancelDialog} color="inherit" disabled={cancelling}>Back</Button>
                    <Button 
                        onClick={handleCancelSession} 
                        variant="contained" 
                        color="error" 
                        disabled={cancelling || !cancelReason.trim()}
                        sx={{ fontWeight: 700 }}
                    >
                        {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default ExpertQueriesPage;
