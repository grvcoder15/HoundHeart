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
    InputAdornment
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
    Search
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const ExpertQueriesPage = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Filter state
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({ search: '', status: '', priority: '' });
    const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

    useEffect(() => {
        fetchQueries();
    }, []);

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
                        Review and manage expert queries
                    </Typography>
                </Box>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 5,
                width: '100%'
            }}>
                {stats.map((stat, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: stat.color, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</Typography>
                            <Typography variant="h4" fontWeight="800" sx={{ my: 1 }}>{stat.value}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle2 size={12} /> {stat.sub}
                            </Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.2)', display: 'flex' }}>
                            {stat.icon}
                        </Box>
                        {/* Decorative Circle */}
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    </Paper>
                ))}
            </Box>

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

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default ExpertQueriesPage;
