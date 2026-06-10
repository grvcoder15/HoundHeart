import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Chip,
    Skeleton,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    DollarSign,
    MessageSquare,
    Tablet,
    CheckCircle2,
    BookOpen,
    Target,
    Mail,
    TrendingUp,
    Eye,
    Rocket,
    Users as UsersIcon,
    Upload,
    Plus,
    X
} from 'lucide-react';
import * as docx from "docx-preview";
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const SacredGuidePage = () => {
    const navigate = useNavigate();

    // ─── State ───────────────────────────────────
    const [dashboard, setDashboard] = useState(null);
    const [bookStatus, setBookStatus] = useState(null);
    const [waitlist, setWaitlist] = useState({ items: [], total: 0 });
    const [guides, setGuides] = useState([]);
    const [selectedGuideId, setSelectedGuideId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Preview Modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const docxContainerRef = React.useRef(null);
    const isPreviewDocx = Boolean(previewUrl.toLowerCase().endsWith('.docx'));

    // Create Guide Dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createPrice, setCreatePrice] = useState('');
    const [createTotalPages, setCreateTotalPages] = useState('');
    const [createChapters, setCreateChapters] = useState('');
    const [createDistribution, setCreateDistribution] = useState('Exclusive');
    const [creating, setCreating] = useState(false);

    // Edit Guide Dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editTotalPages, setEditTotalPages] = useState('');
    const [editChapters, setEditChapters] = useState('');
    const [editDistribution, setEditDistribution] = useState('');
    const [editing, setEditing] = useState(false);

    // Delete Guide Dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ─── Data Fetching ───────────────────────────
    const fetchDashboard = useCallback(async () => {
        try {
            const res = await apiService.getSacredGuideDashboard();
            if (res?.data) setDashboard(res.data);
        } catch (err) { console.error('Dashboard fetch failed:', err); }
    }, []);

    const fetchGuides = useCallback(async () => {
        try {
            const res = await apiService.getAllSacredGuides();
            if (res?.data) {
                setGuides(res.data);
                if (res.data.length > 0 && !selectedGuideId) {
                    setSelectedGuideId(res.data[0].sacredGuideId);
                }
            }
        } catch (err) { console.error('Guides fetch failed:', err); }
    }, [selectedGuideId]);

    const fetchBookStatus = useCallback(async (id) => {
        if (!id) return;
        try {
            const res = await apiService.getSacredGuideStatus(id);
            if (res?.data) setBookStatus(res.data);
        } catch (err) { console.error('Status fetch failed:', err); }
    }, []);

    const fetchWaitlist = useCallback(async (id) => {
        if (!id) return;
        try {
            const res = await apiService.getSacredGuideWaitlist(id, 1, 20);
            if (res?.data) setWaitlist(res.data);
        } catch (err) { console.error('Waitlist fetch failed:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchDashboard(), fetchGuides()]);
            setLoading(false);
        };
        loadAll();
    }, [fetchDashboard, fetchGuides]);

    useEffect(() => {
        if (selectedGuideId) {
            fetchBookStatus(selectedGuideId);
            fetchWaitlist(selectedGuideId);
        }
    }, [selectedGuideId, fetchBookStatus, fetchWaitlist]);

    // ─── Actions ─────────────────────────────────
    const handleCreateGuide = async () => {
        if (!createTitle.trim() || !createPrice.trim()) return;
        setCreating(true);
        try {
            const res = await apiService.createSacredGuide({
                title: createTitle.trim(),
                description: createDesc.trim() || null,
                price: Number(createPrice),
                totalPages: createTotalPages ? Number(createTotalPages) : null,
                chapters: createChapters.trim() || null,
                distribution: createDistribution.trim() || 'Exclusive'
            });
            setSnackbar({ open: true, message: res?.message || 'Guide created!', severity: 'success' });
            setCreateOpen(false);
            setCreateTitle(''); setCreateDesc(''); setCreatePrice('');
            setCreateTotalPages(''); setCreateChapters(''); setCreateDistribution('Exclusive');
            await fetchGuides();
            await fetchDashboard();
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Failed to create guide.', severity: 'error' });
        } finally { setCreating(false); }
    };

    const openEditDialog = () => {
        if (!bookStatus) return;
        setEditTitle(bookStatus.title || '');
        setEditDesc(bookStatus.description || '');
        setEditPrice(bookStatus.price?.toString() || '0');
        setEditTotalPages(bookStatus.totalPages?.toString() || '');
        setEditChapters(bookStatus.chapters?.toString() || '');
        setEditDistribution(bookStatus.distribution || 'Exclusive');
        setEditOpen(true);
    };

    const handleEditGuide = async () => {
        if (!editTitle.trim() || !editPrice.trim() || !selectedGuideId) return;
        setEditing(true);
        try {
            const res = await apiService.updateSacredGuide(selectedGuideId, {
                title: editTitle.trim(),
                description: editDesc.trim() || null,
                price: Number(editPrice),
                totalPages: editTotalPages ? Number(editTotalPages) : null,
                chapters: editChapters.trim() || null,
                distribution: editDistribution.trim() || 'Exclusive'
            });
            setSnackbar({ open: true, message: res?.message || 'Guide updated!', severity: 'success' });
            setEditOpen(false);
            await fetchGuides();
            await fetchBookStatus(selectedGuideId);
            await fetchDashboard();
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Failed to update guide.', severity: 'error' });
        } finally { setEditing(false); }
    };

    const handleDeleteGuide = async () => {
        if (!selectedGuideId) return;
        setDeleting(true);
        try {
            const res = await apiService.deleteSacredGuide(selectedGuideId);
            setSnackbar({ open: true, message: res?.message || 'Guide deleted!', severity: 'success' });
            setDeleteOpen(false);
            setSelectedGuideId(null);
            setBookStatus(null);
            setWaitlist({ items: [], total: 0 });
            await fetchGuides();
            await fetchDashboard();
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Failed to delete guide.', severity: 'error' });
        } finally { setDeleting(false); }
    };

    const handleLaunch = async () => {
        if (!selectedGuideId) return;
        setActionLoading('launch');
        try {
            const res = await apiService.launchSacredGuide(selectedGuideId);
            setSnackbar({ open: true, message: res?.message || 'Guide is now Live!', severity: 'success' });
            await fetchBookStatus(selectedGuideId);
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Launch failed.', severity: 'error' });
        } finally { setActionLoading(''); }
    };

    const handleNotify = async () => {
        if (!selectedGuideId) return;
        setActionLoading('notify');
        try {
            const res = await apiService.notifySacredGuideWaitlist(selectedGuideId);
            setSnackbar({ open: true, message: res?.message || 'Waitlist notified!', severity: 'success' });
            await fetchWaitlist(selectedGuideId);
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Notification failed.', severity: 'error' });
        } finally { setActionLoading(''); }
    };

    const handlePreview = () => {
        if (bookStatus?.pdfUrl) {
            setPreviewUrl(bookStatus.pdfUrl);
            setPreviewOpen(true);
        } else {
            setSnackbar({ open: true, message: 'No file available for preview.', severity: 'warning' });
        }
    };

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewUrl('');
        if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
        }
    };

    useEffect(() => {
        if (!previewOpen || !previewUrl || !isPreviewDocx) return;

        const loadDocx = async () => {
            setPreviewLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
                const fileUrl = `${baseUrl}${previewUrl}`;

                const response = await fetch(fileUrl);
                const blob = await response.blob();

                if (docxContainerRef.current) {
                    await docx.renderAsync(blob, docxContainerRef.current, null, {
                        className: "docx-viewer",
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false
                    });
                }
            } catch (err) {
                console.error("Docx preview error:", err);
                setSnackbar({ open: true, message: 'Failed to load DOCX preview.', severity: 'error' });
            } finally {
                setPreviewLoading(false);
            }
        };

        setTimeout(() => loadDocx(), 100);
    }, [previewOpen, previewUrl, isPreviewDocx]);

    const currentStatus = bookStatus?.status || 'Draft';

    // ─── Helpers ─────────────────────────────────
    const formatCurrency = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const stats = [
        {
            label: 'Monthly\nRevenue',
            value: formatCurrency(dashboard?.monthlyRevenue),
            sub: `${dashboard?.premiumUsers ?? 0} premium users`,
            icon: <DollarSign size={20} />,
            color: '#10b981',
            subIcon: <CheckCircle2 size={11} />
        },
        {
            label: 'Expert Queries',
            value: `${dashboard?.totalQueries ?? 0}`,
            sub: `${dashboard?.pendingQueries ?? 0} pending review`,
            icon: <MessageSquare size={20} />,
            color: '#8b5cf6',
            subIcon: <TrendingUp size={11} />
        },
        {
            label: 'Book Waitlist',
            value: `${dashboard?.totalWaitlist ?? 0}`,
            sub: dashboard?.waitlistStatus || 'Loading...',
            icon: <Tablet size={20} />,
            color: '#ec4899',
            subIcon: <CheckCircle2 size={11} />
        },
    ];

    const getStatusInfo = () => {
        const s = bookStatus?.status || 'Draft';
        if (s === 'Live') return { label: 'Sacred Guide is Live', detail: 'Published and available to users', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
        if (s === 'Ready') return { label: 'Sacred Guide Ready', detail: 'Manuscript completed and reviewed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
        return { label: 'Draft', detail: 'Guide is being prepared', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    };
    const statusInfo = getStatusInfo();

    // ─── Render ──────────────────────────────────
    return (
        <AdminLayout>

            {/* ─── Top Metric Cards ─────────────────── */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 4,
                width: '100%'
            }}>
                {stats.map((stat, i) => (
                    <Paper
                        key={i}
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 4,
                            bgcolor: stat.color,
                            color: 'white',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}
                    >
                        <Box>
                            <Typography sx={{
                                fontWeight: 800,
                                opacity: 0.9,
                                textTransform: 'uppercase',
                                lineHeight: 1.15,
                                display: 'block',
                                fontSize: '0.7rem',
                                letterSpacing: 0.5,
                                mb: 0.8,
                                whiteSpace: 'pre-line'
                            }}>
                                {stat.label}
                            </Typography>
                            {loading ? (
                                <Skeleton variant="text" width={80} height={42} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                            ) : (
                                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, my: 0.5 }}>
                                    {stat.value}
                                </Typography>
                            )}
                            <Typography sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.9, fontSize: '0.72rem', mt: 0.5 }}>
                                {stat.subIcon} {loading ? '...' : stat.sub}
                            </Typography>
                        </Box>
                        <Box sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2.5,
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {stat.icon}
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* ─── Main Content ─────────────────────── */}
            <Grid container spacing={3} sx={{ width: '100%' }}>
                {/* Book Status Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper elevation={0} sx={{ p: 3.5, borderRadius: 5, border: '1px solid #edf2f7', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
                            <Box sx={{ p: 0.4, borderRadius: '50%', color: '#ec4899', border: '1.5px solid', display: 'flex' }}>
                                <BookOpen size={14} />
                            </Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800 }}>Book Status</Typography>
                        </Box>

                        {/* Status Banner */}
                        <Box sx={{ p: 2.5, borderRadius: 3.5, border: `1px solid ${statusInfo.border}`, bgcolor: statusInfo.bg, display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: '50%', border: `1.5px solid ${statusInfo.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusInfo.color, flexShrink: 0 }}>
                                <CheckCircle2 size={20} />
                            </Box>
                            <Box>
                                {loading ? (
                                    <><Skeleton width={140} height={20} /><Skeleton width={200} height={14} /></>
                                ) : (
                                    <>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: statusInfo.color === '#d97706' ? '#92400e' : '#166534' }}>
                                            {statusInfo.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: statusInfo.color === '#d97706' ? '#92400e' : '#166534', opacity: 0.8 }}>
                                            {statusInfo.detail}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
                            {[
                                { label: 'Waitlist Size', val: `${bookStatus?.totalWaitlist ?? 0} users` },
                                { label: 'Premium Users', val: `${bookStatus?.premiumUsers ?? 0} (free access)` },
                                { label: 'Free Users', val: `${bookStatus?.freeUsers ?? 0} (${formatCurrency(bookStatus?.price)} each)` },
                            ].map((row, i) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>{row.label}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                                        {loading ? <Skeleton width={90} /> : row.val}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Status-Based Action Buttons */}
                        {/* PDF Requirement Notice */}
                        {(currentStatus === 'Draft' || currentStatus === 'Ready' || currentStatus === 'Live') && (
                            <Box sx={{
                                mb: 2.5, p: 2.5, borderRadius: 2.5,
                                bgcolor: '#fef3c7', border: '1px solid #fcd34d',
                                display: 'flex', gap: 1.5, alignItems: 'flex-start'
                            }}>
                                <Typography sx={{ color: '#b45309', fontSize: '1.2rem' }}>📄</Typography>
                                <Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', mb: 0.5 }}>
                                        PDF Format Required
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.6 }}>
                                        Always upload your guide as a PDF file. Users can now read PDFs directly in-app with the free trial feature enabled (1-2 free pages, then upgrade).
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {currentStatus === 'Draft' && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Upload size={16} />}
                                    onClick={() => navigate('/sacred-guide/upload')}
                                    sx={{
                                        background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                                        '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #7c3aed 100%)' },
                                        borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                        textTransform: 'none', fontSize: '0.8rem', boxShadow: 'none'
                                    }}
                                >
                                    Upload File
                                </Button>
                            )}
                            {currentStatus === 'Ready' && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={actionLoading === 'launch' ? <CircularProgress size={16} color="inherit" /> : <Rocket size={16} />}
                                    onClick={handleLaunch}
                                    disabled={!!actionLoading}
                                    sx={{
                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        '&:hover': { background: 'linear-gradient(90deg, #059669 0%, #047857 100%)' },
                                        borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                        textTransform: 'none', fontSize: '0.8rem', boxShadow: 'none',
                                        flex: '1 1 45%'
                                    }}
                                >
                                    Launch Book
                                </Button>
                            )}
                            {(currentStatus === 'Ready' || currentStatus === 'Live') && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Eye size={16} />}
                                    onClick={handlePreview}
                                    sx={{
                                        borderColor: '#10b981', color: '#059669',
                                        borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                        textTransform: 'none', fontSize: '0.8rem',
                                        '&:hover': { bgcolor: '#f0fdf4', borderColor: '#059669' },
                                        flex: '1 1 45%'
                                    }}
                                >
                                    Preview Uploaded File
                                </Button>
                            )}
                            {(currentStatus === 'Ready' || currentStatus === 'Live') && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Upload size={16} />}
                                    onClick={() => navigate('/sacred-guide/upload')}
                                    sx={{
                                        borderColor: '#e2e8f0', color: '#475569',
                                        borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                        textTransform: 'none', fontSize: '0.8rem',
                                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                                        flex: '1 1 45%'
                                    }}
                                >
                                    Replace File
                                </Button>
                            )}
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={openEditDialog}
                                disabled={!selectedGuideId}
                                sx={{
                                    borderColor: '#cbd5e1', color: '#64748b',
                                    borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                    textTransform: 'none', fontSize: '0.8rem',
                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                                    flex: '1 1 45%',
                                    '&.Mui-disabled': { borderColor: '#e2e8f0', color: '#cbd5e1', bgcolor: '#f1f5f9' }
                                }}
                            >
                                Edit Details
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setDeleteOpen(true)}
                                disabled={!selectedGuideId}
                                sx={{
                                    borderColor: '#fca5a5', color: '#ef4444',
                                    borderRadius: 2.5, py: 1.2, fontWeight: 700,
                                    textTransform: 'none', fontSize: '0.8rem',
                                    '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' },
                                    flex: '1 1 100%',
                                    '&.Mui-disabled': { borderColor: '#e2e8f0', color: '#cbd5e1', bgcolor: '#f1f5f9' }
                                }}
                            >
                                Delete Guide
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Waitlist Management Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper elevation={0} sx={{ p: 3.5, borderRadius: 5, border: '1px solid #edf2f7', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
                            <Box sx={{ p: 0.4, borderRadius: '50%', color: '#ec4899', border: '1.5px solid', display: 'flex' }}>
                                <Target size={14} />
                            </Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800 }}>Waitlist Management</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3, flexGrow: 1 }}>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box><Skeleton width={110} height={18} /><Skeleton width={150} height={13} /></Box>
                                        <Skeleton width={55} height={18} variant="rounded" />
                                    </Box>
                                ))
                            ) : waitlist.items?.length > 0 ? (
                                waitlist.items.map((user, i) => (
                                    <Box key={user.waitlistId || i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, mb: 0.15 }}>{user.name}</Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>{user.email}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Chip
                                                label={user.tier}
                                                size="small"
                                                sx={{
                                                    borderRadius: 1.5,
                                                    fontWeight: 700,
                                                    fontSize: '0.6rem',
                                                    bgcolor: user.tier === 'Premium' ? '#10b981' : '#f1f5f9',
                                                    color: user.tier === 'Premium' ? 'white' : '#64748b',
                                                    height: 22,
                                                    px: 0.5
                                                }}
                                            />
                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8' }}>
                                                {formatDate(user.joinDate)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5, color: '#cbd5e1' }}>
                                    <UsersIcon size={36} style={{ marginBottom: 6, opacity: 0.35 }} />
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>No users on the waitlist yet</Typography>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: '#cbd5e1' }}>Users will appear here when they join</Typography>
                                </Box>
                            )}
                        </Box>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={actionLoading === 'notify' ? <CircularProgress size={16} /> : <Mail size={16} />}
                            onClick={handleNotify}
                            disabled={!!actionLoading || waitlist.items?.length === 0}
                            sx={{
                                mt: 'auto',
                                borderColor: '#e2e8f0',
                                color: '#475569',
                                borderRadius: 2.5,
                                py: 1.2,
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            Notify All Waitlist
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Empty State — No Guide Exists */}
            {!loading && guides.length === 0 && (
                <Paper elevation={0} sx={{ p: 6, borderRadius: 5, border: '1px solid #edf2f7', textAlign: 'center', mb: 4 }}>
                    <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 1, color: '#1e293b' }}>
                        No Sacred Guide Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 3 }}>
                        Create your first guide to start collecting waitlist subscribers.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => setCreateOpen(true)}
                        sx={{
                            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                            '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #7c3aed 100%)' },
                            borderRadius: 3, px: 4, py: 1.3, fontWeight: 700,
                            textTransform: 'none', fontSize: '0.9rem', boxShadow: 'none'
                        }}
                    >
                        Create Sacred Guide
                    </Button>
                </Paper>
            )}

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={closePreview}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, height: '85vh', display: 'flex', flexDirection: 'column' } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Document Preview
                    <Box onClick={closePreview} sx={{ cursor: 'pointer', display: 'flex', p: 0.5, borderRadius: '50%', '&:hover': { bgcolor: '#f1f5f9' }, color: '#64748b' }}>
                        <X size={20} />
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, flexGrow: 1, bgcolor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                    {previewOpen && previewUrl && (
                        !isPreviewDocx ? (
                            <iframe
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${previewUrl}`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title="PDF Preview"
                            />
                        ) : (
                            <Box sx={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
                                {previewLoading && (
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                                        <CircularProgress />
                                    </Box>
                                )}
                                <div ref={docxContainerRef} style={{ width: '100%', minHeight: '100%', padding: '20px', backgroundColor: '#fff' }} />
                            </Box>
                        )
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Guide Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Create New Sacred Guide</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        This will create a Draft guide. Users will see "Coming Soon" and can join the waitlist.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Title *" value={createTitle}
                            onChange={(e) => setCreateTitle(e.target.value)}
                            placeholder="e.g. Sacred Guide to Spiritual Bonding"
                            fullWidth size="small" autoFocus
                        />
                        <TextField
                            label="Description" value={createDesc}
                            onChange={(e) => setCreateDesc(e.target.value)}
                            placeholder="Brief description of the guide"
                            fullWidth size="small" multiline rows={3}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                            <TextField
                                label="Price ($) *" value={createPrice}
                                onChange={(e) => setCreatePrice(e.target.value)}
                                placeholder="e.g. 12.95" size="small"
                                helperText="Enter 0 if this guide is free"
                                fullWidth
                            />
                            <TextField
                                label="Total Pages" value={createTotalPages}
                                onChange={(e) => setCreateTotalPages(e.target.value)}
                                placeholder="e.g. 58" size="small"
                                fullWidth
                            />
                            <TextField
                                label="Total Chapters" value={createChapters}
                                onChange={(e) => setCreateChapters(e.target.value)}
                                placeholder="e.g. 12" size="small"
                                fullWidth
                            />
                            <TextField
                                label="Distribution" value={createDistribution}
                                onChange={(e) => setCreateDistribution(e.target.value)}
                                placeholder="e.g. Exclusive" size="small"
                                fullWidth
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateGuide}
                        disabled={creating || !createTitle.trim() || !createPrice.trim()}
                        sx={{
                            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                            '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #7c3aed 100%)' },
                            borderRadius: 2.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none'
                        }}
                    >
                        {creating ? 'Creating...' : 'Create Guide'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Guide Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Edit Sacred Guide</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField
                            label="Title *" value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            fullWidth size="small" autoFocus
                        />
                        <TextField
                            label="Description" value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            fullWidth size="small" multiline rows={3}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                            <TextField
                                label="Price ($) *" value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                size="small" fullWidth
                            />
                            <TextField
                                label="Total Pages" value={editTotalPages}
                                onChange={(e) => setEditTotalPages(e.target.value)}
                                size="small" fullWidth
                            />
                            <TextField
                                label="Total Chapters" value={editChapters}
                                onChange={(e) => setEditChapters(e.target.value)}
                                size="small" fullWidth
                            />
                            <TextField
                                label="Distribution" value={editDistribution}
                                onChange={(e) => setEditDistribution(e.target.value)}
                                size="small" fullWidth
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button
                        variant="contained" onClick={handleEditGuide}
                        disabled={editing || !editTitle.trim() || !editPrice.trim()}
                        sx={{
                            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                            '&:hover': { background: 'linear-gradient(90deg, #db2777 0%, #7c3aed 100%)' },
                            borderRadius: 2.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none'
                        }}
                    >
                        {editing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} PaperProps={{ sx: { borderRadius: 4, maxWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: '#ef4444' }}>Delete Sacred Guide?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to permanently delete this Sacred Guide? This will remove access for users, but waitlist records might remain. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
                    <Button
                        variant="contained" color="error" onClick={handleDeleteGuide} disabled={deleting}
                        sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
                    >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 700, fontSize: '0.8rem' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default SacredGuidePage;
