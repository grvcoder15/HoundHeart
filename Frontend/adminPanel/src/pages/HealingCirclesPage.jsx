import React, { useState, useEffect } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    CircularProgress
} from '@mui/material';
import {
    Plus,
    Calendar,
    Users,
    Video,
    MapPin,
    MoreVertical,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Edit2,
    Trash2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const HealingCirclesPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [selectedCircle, setSelectedCircle] = useState(null);
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCircleId, setEditingCircleId] = useState(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, circleId: null, circleName: '' });
    const [deleting, setDeleting] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        time: '',
        description: '',
        maxParticipants: 100,
        isPremium: false
    });
    const [createError, setCreateError] = useState('');
    const [statsData, setStatsData] = useState({
        totalCircles: 0,
        totalParticipants: 0,
        upcoming: 0,
        thisMonth: 0
    });
    const [circlesData, setCirclesData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch healing circles data
    const fetchHealingCirclesData = async () => {
        setLoading(true);
        try {
            const [circlesRes, statsRes] = await Promise.all([
                apiService.getHealingCircles(),
                apiService.getHealingCirclesStats()
            ]);

            if (circlesRes?.success && circlesRes?.data) {
                // Map circles to table format
                const mappedCircles = circlesRes.data.map((circle, idx) => ({
                    id: circle.id || idx,
                    title: circle.title || 'Untitled Circle',
                    host: circle.createdBy || 'Admin',
                    dateTime: circle.time ? new Date(circle.time).toLocaleString() : 'TBD',
                    time: circle.time || '',
                    description: circle.description || '',
                    participants: circle.participantsCount || 0,
                    limit: circle.maxParticipants || 100,
                    type: circle.isPremium ? 'Premium' : 'Standard',
                    isPremium: !!circle.isPremium,
                    status: circle.time && new Date(circle.time) > new Date() ? 'upcoming' : 'completed'
                }));
                setCirclesData(mappedCircles);
            }

            if (statsRes?.success && statsRes?.data) {
                setStatsData({
                    totalCircles: statsRes.data.totalCircles || 0,
                    totalParticipants: statsRes.data.totalParticipants || 0,
                    upcoming: statsRes.data.upcoming || 0,
                    thisMonth: statsRes.data.thisMonth || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch healing circles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchHealingCirclesData();
    }, []);

    const stats = [
        { label: 'Total Circles', value: String(statsData.totalCircles), icon: <Calendar size={20} />, color: '#8b5cf6' },
        { label: 'Total Participants', value: String(statsData.totalParticipants).replace(/\B(?=(\d{3})+(?!\d))/g, ','), icon: <Users size={20} />, color: '#22c55e' },
        { label: 'Upcoming', value: String(statsData.upcoming), icon: <Clock size={20} />, color: '#3b82f6' },
        { label: 'This Month', value: String(statsData.thisMonth), icon: <CheckCircle2 size={20} />, color: '#f59e0b' },
    ];

    const circles = circlesData;

    const handleOpenDetails = (circle) => {
        setSelectedCircle(circle);
        setOpenModal(true);
    };

    const toDateTimeLocal = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localTime.toISOString().slice(0, 16);
    };

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setEditingCircleId(null);
        setCreateForm({ title: '', time: '', description: '', maxParticipants: 100, isPremium: false });
        setCreateError('');
        setOpenCreateModal(true);
    };

    const handleOpenEdit = (circle) => {
        setIsEditMode(true);
        setEditingCircleId(circle.id);
        setCreateForm({
            title: circle.title || '',
            time: toDateTimeLocal(circle.time),
            description: circle.description || '',
            maxParticipants: circle.limit || 100,
            isPremium: !!circle.isPremium
        });
        setCreateError('');
        setOpenModal(false);
        setOpenCreateModal(true);
    };

    const handleOpenDeleteConfirm = (circle) => {
        setDeleteConfirmModal({
            isOpen: true,
            circleId: circle.id,
            circleName: circle.title
        });
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const res = await apiService.deleteHealingCircle(deleteConfirmModal.circleId);
            if (res?.success) {
                setDeleteConfirmModal({ isOpen: false, circleId: null, circleName: '' });
                await fetchHealingCirclesData();
            } else {
                alert(res?.message || 'Failed to delete circle.');
            }
        } catch (err) {
            alert('An error occurred while deleting the circle.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveCircle = async () => {
        if (!createForm.title.trim()) { setCreateError('Title is required.'); return; }
        if (!createForm.time.trim()) { setCreateError('Date & Time is required.'); return; }
        setCreating(true);
        setCreateError('');
        try {
            const payload = {
                title: createForm.title.trim(),
                time: createForm.time,
                description: createForm.description.trim(),
                maxParticipants: Number(createForm.maxParticipants) || 100,
                isPremium: createForm.isPremium
            };

            const res = isEditMode
                ? await apiService.updateHealingCircle(editingCircleId, payload)
                : await apiService.createHealingCircle(payload);

            if (res?.success) {
                setOpenCreateModal(false);
                setIsEditMode(false);
                setEditingCircleId(null);
                await fetchHealingCirclesData();
            } else {
                setCreateError(res?.message || `Failed to ${isEditMode ? 'update' : 'create'} circle.`);
            }
        } catch (err) {
            setCreateError(`An error occurred while ${isEditMode ? 'updating' : 'creating'} the circle.`);
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                        Healing Circles
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="500">
                        Manage community healing circles and events
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpenCreate}
                    sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' },
                        fontWeight: 700,
                        textTransform: 'none'
                    }}
                >
                    Create Circle
                </Button>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4,
                width: '100%'
            }}>
                {stats.map((stat, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}15`, color: stat.color, display: 'flex' }}>
                            {stat.icon}
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                            <Typography variant="h5" fontWeight="800" color="#1e293b">{stat.value}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Host</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Date & Time</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Participants</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                        Loading healing circles...
                                    </TableCell>
                                </TableRow>
                            ) : circles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                        No healing circles found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                circles.map((circle) => (
                                    <TableRow key={circle.id} hover>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{circle.title}</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{circle.host}</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{circle.dateTime}</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{circle.participants} / {circle.limit}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', fontWeight: 700 }}>
                                                {circle.type === 'Virtual' ? <Video size={16} color="#8b5cf6" /> : <MapPin size={16} color="#ec4899" />}
                                            <Typography variant="caption" fontWeight="700">{circle.type}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={circle.status}
                                            size="small"
                                            sx={{
                                                borderRadius: '8px',
                                                fontWeight: 800,
                                                textTransform: 'lowercase',
                                                bgcolor: circle.status === 'upcoming' ? '#f0f9ff' : circle.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                                                color: circle.status === 'upcoming' ? '#0ea5e9' : circle.status === 'completed' ? '#16a34a' : '#ef4444'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" onClick={() => handleOpenDetails(circle)}><Eye size={18} color="#94a3b8" /></IconButton>
                                            <IconButton size="small" onClick={() => handleOpenEdit(circle)}><Edit2 size={18} color="#94a3b8" /></IconButton>
                                            <IconButton size="small" onClick={() => handleOpenDeleteConfirm(circle)}><Trash2 size={18} color="#ef4444" /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Create Circle Modal */}
            <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} PaperProps={{ sx: { borderRadius: 4, width: 500 } }}>
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                    {isEditMode ? 'Edit Healing Circle' : 'Create Healing Circle'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        label="Title *"
                        fullWidth
                        value={createForm.title}
                        onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                        size="small"
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        label="Date & Time *"
                        fullWidth
                        type="datetime-local"
                        value={createForm.time}
                        onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={createForm.description}
                        onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                        size="small"
                    />
                    <TextField
                        label="Max Participants"
                        fullWidth
                        type="number"
                        value={createForm.maxParticipants}
                        onChange={e => setCreateForm(f => ({ ...f, maxParticipants: e.target.value }))}
                        size="small"
                        inputProps={{ min: 1 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={createForm.isPremium}
                                onChange={e => setCreateForm(f => ({ ...f, isPremium: e.target.checked }))}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b5cf6' } }}
                            />
                        }
                        label={<Typography fontWeight={700} fontSize={14}>Premium Circle</Typography>}
                    />
                    {createError && <Typography color="error" variant="caption" fontWeight={700}>{createError}</Typography>}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 1 }}>
                    <Button
                        onClick={() => {
                            setOpenCreateModal(false);
                            setIsEditMode(false);
                            setEditingCircleId(null);
                        }}
                        sx={{ fontWeight: 800, color: '#64748b', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveCircle}
                        disabled={creating}
                        sx={{ bgcolor: '#8b5cf6', fontWeight: 800, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#7c3aed' } }}
                        startIcon={creating ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {creating ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Circle')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Circle Details Modal (Mocking screenshot) */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { borderRadius: 4, width: 450 } }}>
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9' }}>Circle Details</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">TITLE</Typography>
                    <Typography variant="body1" fontWeight="800" sx={{ mb: 2 }}>{selectedCircle?.title}</Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight="700">DATE</Typography>
                            <Typography variant="body2" fontWeight="700">{selectedCircle?.dateTime.split(' ')[0]}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight="700">TIME</Typography>
                            <Typography variant="body2" fontWeight="700">{selectedCircle?.dateTime.split(' ').slice(1).join(' ')}</Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f3ff', borderRadius: 3, border: '1px solid #ddd6fe' }}>
                        <Typography variant="body2" fontWeight="700" color="#8b5cf6">Circle Rules</Typography>
                        <Typography variant="caption" color="#8b5cf6" fontWeight="600">
                            {selectedCircle?.description?.trim() || 'This healing circle is sacred for behaviorist.'}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 800, color: '#64748b' }}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={() => selectedCircle && handleOpenEdit(selectedCircle)}
                        sx={{ bgcolor: '#8b5cf6', fontWeight: 800, borderRadius: 2 }}
                    >
                        Edit Circle
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirmModal.isOpen} onClose={() => setDeleteConfirmModal({ isOpen: false, circleId: null, circleName: '' })} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" fontWeight="600" color="#64748b">
                        Are you sure you want to delete the healing circle <strong>"{deleteConfirmModal.circleName}"</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 1 }}>
                    <Button
                        onClick={() => setDeleteConfirmModal({ isOpen: false, circleId: null, circleName: '' })}
                        sx={{ fontWeight: 800, color: '#64748b', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        sx={{ bgcolor: '#ef4444', fontWeight: 800, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#dc2626' } }}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {deleting ? 'Deleting...' : 'Delete Circle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default HealingCirclesPage;
