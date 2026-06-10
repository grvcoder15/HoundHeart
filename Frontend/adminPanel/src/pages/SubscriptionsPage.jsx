import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    TextField,
    Select,
    MenuItem,
    CircularProgress,
    Pagination
} from '@mui/material';
import apiService from '../services/apiService';
import AdminLayout from '../components/AdminLayout';

const SubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const pageSize = 20;

    useEffect(() => {
        fetchStats();
        fetchSubscriptions();
    }, [filter, currentPage]);

    const fetchStats = async () => {
        try {
            const response = await apiService.getSubscriptionStats();
            if (response?.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllSubscriptions(filter, currentPage, pageSize);
            if (response?.data) {
                setSubscriptions(response.data.subscriptions || []);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncFromStripe = async () => {
        try {
            setSyncing(true);
            setSyncMessage('');
            const response = await apiService.syncSubscriptionsFromStripe();
            if (response?.success) {
                setSyncMessage(`✓ Synced ${response.data?.synced ?? 0} subscriptions from Stripe`);
                await fetchStats();
                await fetchSubscriptions();
            } else {
                setSyncMessage('Sync failed. Please try again.');
            }
        } catch (error) {
            setSyncMessage('Sync failed. Check console for details.');
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMessage(''), 5000);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchSubscriptions();
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.searchSubscriptions(searchQuery);
            if (response?.data) {
                setSubscriptions(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error('Error searching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            active: { bgcolor: '#f0fdf4', color: '#22c55e' },
            canceled: { bgcolor: '#fef2f2', color: '#ef4444' },
            past_due: { bgcolor: '#fef3c7', color: '#f59e0b' },
            trialing: { bgcolor: '#dbeafe', color: '#3b82f6' },
            default: { bgcolor: '#f3f4f6', color: '#6b7280' }
        };
        const config = configs[status?.toLowerCase()] || configs.default;
        return (
            <Chip
                label={status || 'Unknown'}
                sx={{
                    bgcolor: config.bgcolor,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '24px'
                }}
            />
        );
    };

    return (
        <AdminLayout>
            <Box>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', mb: 1 }}>
                            Subscriptions Management
                        </Typography>
                        <Typography variant="body2" color="#666" fontWeight="500">
                            Manage and monitor all user subscriptions
                        </Typography>
                        {syncMessage && (
                            <Typography variant="caption" sx={{ color: syncMessage.startsWith('✓') ? '#22c55e' : '#ef4444', fontWeight: 700, mt: 0.5, display: 'block' }}>
                                {syncMessage}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        onClick={handleSyncFromStripe}
                        disabled={syncing}
                        variant="outlined"
                        startIcon={syncing ? <CircularProgress size={16} /> : null}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#a855f7',
                            color: '#a855f7',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            '&:hover': { bgcolor: '#faf5ff', borderColor: '#9333ea' }
                        }}
                    >
                        {syncing ? 'Syncing...' : '↻ Sync from Stripe'}
                    </Button>
                </Box>

                {/* Statistics Cards */}
                {stats && (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: 3,
                        mb: 4,
                        width: '100%'
                    }}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid #edf2f7',
                            bgcolor: 'white',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                color: '#64748b',
                                fontWeight: 700,
                                mb: 1,
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                Total Subscriptions
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ color: '#1a1a1a' }}>
                                {stats.totalSubscriptions}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid #bbf7d0',
                            bgcolor: '#f0fdf4',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                color: '#166534',
                                fontWeight: 700,
                                mb: 1,
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                Active
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ color: '#22c55e' }}>
                                {stats.activeSubscriptions}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid #e9d5ff',
                            bgcolor: '#faf5ff',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                color: '#6b21a8',
                                fontWeight: 700,
                                mb: 1,
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                MRR
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ color: '#a855f7' }}>
                                ${stats.monthlyRecurringRevenue.toFixed(2)}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid #bfdbfe',
                            bgcolor: '#eff6ff',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                color: '#1e40af',
                                fontWeight: 700,
                                mb: 1,
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                Total Revenue
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ color: '#3b82f6' }}>
                                ${stats.totalRevenue.toFixed(2)}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* Filters and Search */}
                <Paper elevation={0} sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: '1px solid #edf2f7',
                    mb: 3
                }}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                        gap: 3
                    }}>
                        {/* Status Filter */}
                        <Box>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#374151' }}>
                                Filter by Status
                            </Typography>
                            <Select
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                                size="small"
                                fullWidth
                                sx={{
                                    borderRadius: '12px',
                                    bgcolor: '#fff',
                                    '& fieldset': { borderColor: '#d1d5db' }
                                }}
                            >
                                <MenuItem value="all">All Subscriptions</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="canceled">Canceled</MenuItem>
                                <MenuItem value="past_due">Past Due</MenuItem>
                                <MenuItem value="trialing">Trialing</MenuItem>
                            </Select>
                        </Box>

                        {/* Search */}
                        <Box>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#374151' }}>
                                Search
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by email or name..."
                                    size="small"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            bgcolor: '#fff'
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSearch}
                                    variant="contained"
                                    sx={{
                                        borderRadius: '12px',
                                        bgcolor: '#a855f7',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        px: 3,
                                        '&:hover': { bgcolor: '#9333ea' }
                                    }}
                                >
                                    Search
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Subscriptions Table */}
                <TableContainer component={Paper} elevation={0} sx={{
                    borderRadius: '20px',
                    border: '1px solid #edf2f7'
                }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                            <CircularProgress sx={{ color: '#a855f7' }} />
                        </Box>
                    ) : subscriptions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 12, color: '#6b7280' }}>
                            <Typography variant="body1">No subscriptions found</Typography>
                        </Box>
                    ) : (
                        <>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            User
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Plan
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Amount
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Period End
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Created
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {subscriptions.map((sub) => (
                                        <TableRow
                                            key={sub.subscriptionId}
                                            sx={{
                                                '&:hover': { bgcolor: '#f9fafb' },
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                                                        {sub.userName || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                        {sub.userEmail}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                                    {sub.planName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                                                    ${sub.amount?.toFixed(2)} {sub.currency?.toUpperCase()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                                    {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                                    {new Date(sub.createdOn).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    px: 3,
                                    py: 2,
                                    borderTop: '1px solid #e5e7eb',
                                    bgcolor: '#f9fafb'
                                }}>
                                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                        Page {currentPage} of {totalPages}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: '#d1d5db',
                                                color: '#374151',
                                                '&:hover': {
                                                    bgcolor: '#f3f4f6',
                                                    borderColor: '#d1d5db'
                                                },
                                                '&:disabled': {
                                                    opacity: 0.5,
                                                    cursor: 'not-allowed'
                                                }
                                            }}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: '#d1d5db',
                                                color: '#374151',
                                                '&:hover': {
                                                    bgcolor: '#f3f4f6',
                                                    borderColor: '#d1d5db'
                                                },
                                                '&:disabled': {
                                                    opacity: 0.5,
                                                    cursor: 'not-allowed'
                                                }
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </TableContainer>
            </Box>
        </AdminLayout>
    );
};

export default SubscriptionsPage;
