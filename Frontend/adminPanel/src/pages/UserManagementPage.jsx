import React, { useState, useEffect, useCallback } from 'react';
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
    Avatar,
    Menu,
    MenuItem,
    Divider,
    LinearProgress,
    Grid,
    TextField,
    InputAdornment,
    Select,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Pagination
} from '@mui/material';
import {
    Search,
    MoreVertical,
    Eye,
    Mail,
    UserX,
    UserCheck,
    Ban
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const UserManagementPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [fullUserDetails, setFullUserDetails] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Total Users', value: '0', color: '#1e293b' },
        { label: 'Premium Members', value: '0', color: '#8b5cf6' },
        { label: 'Active Today', value: '0', color: '#10b981' },
        { label: 'Suspended', value: '0', color: '#ef4444' },
    ]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await apiService.getUserStats();
            if (response?.data) {
                const d = response.data;
                setStats([
                    { label: 'Total Users', value: d.totalUsers.toLocaleString(), color: '#1e293b' },
                    { label: 'Premium Members', value: d.premiumMembers.toLocaleString(), color: '#8b5cf6' },
                    { label: 'Active Today', value: d.activeToday.toLocaleString(), color: '#10b981' },
                    { label: 'Suspended', value: d.suspended.toLocaleString(), color: '#ef4444' },
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.getUsers({
                search: searchTerm,
                status: statusFilter,
                page: page,
                pageSize: 10
            });
            if (response?.data) {
                setUsers(response.data.items || []);
                setTotalUsers(response.data.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, page]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleMenuOpen = (event, user) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedUser) return;
        try {
            await apiService.updateUserStatus(selectedUser.userId, newStatus);
            handleMenuClose();
            fetchUsers();
            fetchStats();
        } catch (error) {
            console.error(`Failed to ${newStatus} user:`, error);
        }
    };

    const handleSendEmail = () => {
        if (!selectedUser) return;
        window.location.href = `mailto:${selectedUser.email}`;
        handleMenuClose();
    };

    const handleViewProfile = async () => {
        if (!selectedUser) return;
        const userId = selectedUser.userId;
        handleMenuClose();
        setProfileModalOpen(true);
        setFullUserDetails(null); // Reset while loading

        try {
            const response = await apiService.getUserDetails(userId);
            if (response?.data) {
                setFullUserDetails(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    };

    const handleProfileModalClose = () => {
        setProfileModalOpen(false);
    };

    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', mb: 1 }}>
                    Users Management
                </Typography>
                <Typography variant="body2" color="#666" fontWeight="500">
                    Manage and moderate community members
                </Typography>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4,
                width: '100%'
            }}>
                {stats.map((stat, i) => (
                    <Paper key={i} elevation={0} sx={{
                        p: 3,
                        borderRadius: '20px',
                        border: '1px solid #edf2f7',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: 'white',
                        '&:hover': {
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
                            transform: 'translateY(-4px)',
                            borderColor: '#e2e8f0'
                        }
                    }}>
                        <Typography variant="caption" sx={{
                            color: '#64748b',
                            fontWeight: 700,
                            mb: 1,
                            display: 'block',
                            letterSpacing: '0.025em',
                            textTransform: 'uppercase'
                        }}>
                            {stat.label}
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{
                            color: stat.color,
                            letterSpacing: '-0.02em',
                            lineHeight: 1
                        }}>
                            {stat.value}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: '#f1f1f1',
                            '& fieldset': { border: 'none' },
                            px: 1
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} color="#999" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Select
                    value={statusFilter}
                    size="small"
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    sx={{
                        minWidth: 150,
                        borderRadius: '12px',
                        bgcolor: '#f1f1f1',
                        '& fieldset': { border: 'none' },
                        fontWeight: 600,
                        color: '#666'
                    }}
                >
                    <MenuItem value="All Status">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Suspended">Suspended</MenuItem>
                    <MenuItem value="Banned">Banned</MenuItem>
                </Select>
            </Box>

            <Paper elevation={0} sx={{
                p: 0,
                borderRadius: '16px',
                border: '1px solid #edf2f7',
                overflow: 'hidden'
            }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #edf2f7' }}>
                    <Typography variant="h6" fontWeight="700" color="#1a1a1a">
                        All Users
                    </Typography>
                </Box>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fff' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', py: 2, borderBottom: '1px solid #f1f5f9' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Bonded Score</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Posts</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Join Date</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#666', fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.userId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{
                                                width: 40, height: 40,
                                                bgcolor: '#f5f3ff',
                                                color: '#8b5cf6',
                                                fontWeight: 700,
                                                fontSize: '0.9rem'
                                            }} src={user.profilePhoto}>
                                                {user.name?.charAt(0) || 'U'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="700" color="#1a1a1a">{user.name}</Typography>
                                                {user.role === 'Premium' && (
                                                    <Box sx={{
                                                        display: 'inline-block',
                                                        bgcolor: '#fef3c7',
                                                        color: '#d97706',
                                                        px: 1.2,
                                                        py: 0.25,
                                                        borderRadius: '10px',
                                                        fontWeight: 700,
                                                        fontSize: '0.65rem',
                                                        mt: 0.5,
                                                        border: '1px solid #fde68a'
                                                    }}>
                                                        Premium
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#4a5568', fontWeight: 500, fontSize: '0.85rem' }}>{user.email}</TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={user.bondedScore}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: '#f1f5f9',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: '#8b5cf6',
                                                            borderRadius: 3
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" fontWeight="700" color="#4a5568">{Math.round(user.bondedScore)}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.85rem' }}>{user.communityPosts}</TableCell>
                                    <TableCell sx={{ color: '#4a5568', fontWeight: 500, fontSize: '0.85rem' }}>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                bgcolor: user.status === 'Active' ? '#f0fdf4' : '#fef2f2',
                                                color: user.status === 'Active' ? '#16a34a' : '#ef4444',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: '20px',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                textTransform: 'lowercase'
                                            }}
                                        >
                                            {user.status?.toLowerCase()}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)} sx={{ color: '#94a3b8' }}>
                                            <MoreVertical size={18} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography variant="body1" color="text.secondary">No users found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ p: 0 }}>
                                        <LinearProgress sx={{ height: 2 }} />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf2f7' }}>
                    <Typography variant="body2" color="#666" fontWeight="600">
                        Showing {Math.min((page - 1) * 10 + 1, totalUsers)} to {Math.min(page * 10, totalUsers)} of {totalUsers} users
                    </Typography>
                    <Pagination
                        count={Math.ceil(totalUsers / 10)}
                        page={page}
                        onChange={(e, v) => setPage(v)}
                        size="small"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                borderRadius: '8px',
                                fontWeight: 700,
                                '&.Mui-selected': {
                                    bgcolor: '#1a1a1a',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#000' }
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        mt: 1,
                        minWidth: 180,
                        border: '1px solid #edf2f7'
                    }
                }}
            >
                <MenuItem onClick={handleViewProfile} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>
                    <Eye size={16} /> View Profile
                </MenuItem>
                <MenuItem onClick={handleSendEmail} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>
                    <Mail size={16} /> Send Email
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {selectedUser?.status?.toLowerCase() === 'suspended' ? (
                    <MenuItem onClick={() => handleUpdateStatus('Active')} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>
                        <UserCheck size={16} /> Unsuspend User
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => handleUpdateStatus('Suspended')} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#f97316' }}>
                        <UserX size={16} /> Suspend User
                    </MenuItem>
                )}
                {selectedUser?.status?.toLowerCase() === 'banned' ? (
                    <MenuItem onClick={() => handleUpdateStatus('Active')} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>
                        <UserCheck size={16} /> Unban User
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => handleUpdateStatus('Banned')} sx={{ gap: 1.5, py: 1.2, fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>
                        <Ban size={16} /> Ban User
                    </MenuItem>
                )}
            </Menu>

            {/* User Profile Modal */}
            <Dialog
                open={profileModalOpen}
                onClose={handleProfileModalClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>
                    User Profile
                </DialogTitle>
                <DialogContent>
                    {!fullUserDetails ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <LinearProgress sx={{ mb: 2, borderRadius: 3 }} />
                            <Typography variant="body2" color="text.secondary">Fetching user details...</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Box>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#8b5cf6', mb: 1, display: 'block' }}>
                                    Human Details
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>NAME</Typography>
                                            <Typography variant="body2" fontWeight="700" color="#1a1a1a">{fullUserDetails.name}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>EMAIL</Typography>
                                            <Typography variant="body2" fontWeight="700" color="#1a1a1a">{fullUserDetails.email}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>

                            <Box>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#10b981', mb: 1, display: 'block' }}>
                                    Dog Details
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>DOG NAME</Typography>
                                            <Typography variant="body2" fontWeight="700" color="#065f46">{fullUserDetails.dogName}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleProfileModalClose} variant="contained" sx={{
                        borderRadius: '12px',
                        bgcolor: '#1a1a1a',
                        '&:hover': { bgcolor: '#000' },
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4
                    }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default UserManagementPage;
