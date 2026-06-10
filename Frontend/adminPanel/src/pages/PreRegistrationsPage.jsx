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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Checkbox,
    Alert
} from '@mui/material';
import {
    Search,
    MoreVertical,
    Eye,
    Mail,
    Trash2,
    Send,
    CheckCircle
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const PreRegistrationsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [preRegistrations, setPreRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [fullDetails, setFullDetails] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState(new Set());
    const [sendingInvites, setSendingInvites] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Total Pre-Registrations', value: '0', color: '#1e293b' },
        { label: 'Invites Sent', value: '0', color: '#8b5cf6' },
        { label: 'Pending Invites', value: '0', color: '#f59e0b' },
    ]);

    const fetchPreRegistrations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.getPreRegistrations();
            console.log('Fetch response:', response);
            
            // Handle both direct array and response.data structure
            const records = response?.data || response;
            console.log('Records to display:', records);
            
            if (Array.isArray(records) && records.length > 0) {
                setPreRegistrations(records);

                // Calculate stats
                const total = records.length;
                const invitesSent = records.filter(r => r.isLaunchInviteSent).length;
                const pending = total - invitesSent;

                setStats([
                    { label: 'Total Pre-Registrations', value: total.toLocaleString(), color: '#1e293b' },
                    { label: 'Invites Sent', value: invitesSent.toLocaleString(), color: '#8b5cf6' },
                    { label: 'Pending Invites', value: pending.toLocaleString(), color: '#f59e0b' },
                ]);
                console.log('Pre-registrations loaded successfully:', records);
            } else {
                console.log('No records found or invalid response');
                setPreRegistrations([]);
            }
        } catch (error) {
            console.error('Failed to fetch pre-registrations:', error);
            setPreRegistrations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreRegistrations();
    }, [fetchPreRegistrations]);

    const handleMenuOpen = (event, record) => {
        setAnchorEl(event.currentTarget);
        setSelectedRecord(record);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRecord(null);
    };

    const handleViewDetails = (record) => {
        setFullDetails(record);
        setDetailsModalOpen(true);
        handleMenuClose();
    };

    const handleOpenDeleteDialog = (record) => {
        setRecordToDelete(record);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        if (!recordToDelete) return;

        try {
            const response = await apiService.deletePreRegistration(recordToDelete.preRegistrationId);
            if (response?.success) {
                setDeleteDialogOpen(false);
                setRecordToDelete(null);
                await fetchPreRegistrations();
            } else {
                console.error('Failed to delete pre-registration');
            }
        } catch (error) {
            console.error('Error deleting pre-registration:', error);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
    };

    const handleSelectRecord = (recordId) => {
        const newSelected = new Set(selectedRecords);
        if (newSelected.has(recordId)) {
            newSelected.delete(recordId);
        } else {
            newSelected.add(recordId);
        }
        setSelectedRecords(newSelected);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = new Set(
                filteredRecords
                    .filter(r => !r.isLaunchInviteSent)
                    .map(r => r.preRegistrationId)
            );
            setSelectedRecords(allIds);
        } else {
            setSelectedRecords(new Set());
        }
    };

    const handleSendInvites = async () => {
        if (selectedRecords.size === 0) {
            alert('Please select at least one record');
            return;
        }

        setSendingInvites(true);
        try {
            const selectedEmails = filteredRecords
                .filter(r => selectedRecords.has(r.preRegistrationId))
                .map(r => r.email);

            const response = await apiService.markInvitesSent(selectedEmails);
            if (response?.success) {
                alert(`Invites sent to ${selectedEmails.length} user(s)`);
                setSelectedRecords(new Set());
                await fetchPreRegistrations();
            }
        } catch (error) {
            console.error('Failed to send invites:', error);
            alert('Failed to send invites. Please try again.');
        } finally {
            setSendingInvites(false);
        }
    };

    const filteredRecords = preRegistrations.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        return (
            record.fullName?.toLowerCase().includes(searchLower) ||
            record.email?.toLowerCase().includes(searchLower) ||
            record.phoneNumber?.includes(searchTerm) ||
            record.city?.toLowerCase().includes(searchLower)
        );
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        Pre-Registrations
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Manage pre-registered users and launch invitations
                    </Typography>
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: stat.color, fontWeight: 700, mt: 1 }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '50%',
                                            background: `${stat.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Mail size={24} color={stat.color} />
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Search and Actions */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, email, phone, or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} color="#64748b" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': { borderColor: '#db2777' }
                                }
                            }}
                        />
                        {selectedRecords.size > 0 && (
                            <Button
                                variant="contained"
                                startIcon={<Send size={18} />}
                                onClick={handleSendInvites}
                                disabled={sendingInvites}
                                sx={{
                                    background: 'linear-gradient(90deg, #db2777 0%, #f472b6 100%)',
                                    whiteSpace: 'nowrap',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                {sendingInvites ? 'Sending...' : `Send Invites (${selectedRecords.size})`}
                            </Button>
                        )}
                    </Box>
                </Paper>

                {/* Table */}
                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <LinearProgress sx={{ mb: 2 }} />
                        <Typography color="textSecondary">Loading pre-registrations...</Typography>
                    </Box>
                ) : filteredRecords.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography color="textSecondary" sx={{ mb: 1 }}>
                            {searchTerm ? 'No pre-registrations found matching your search.' : 'No pre-registrations yet.'}
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Table>
                            <TableHead sx={{ background: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={
                                                selectedRecords.size > 0 &&
                                                filteredRecords
                                                    .filter(r => !r.isLaunchInviteSent)
                                                    .every(r => selectedRecords.has(r.preRegistrationId))
                                            }
                                            indeterminate={
                                                selectedRecords.size > 0 &&
                                                selectedRecords.size <
                                                    filteredRecords.filter(r => !r.isLaunchInviteSent).length
                                            }
                                            onChange={handleSelectAll}
                                            disabled={
                                                filteredRecords.filter(r => !r.isLaunchInviteSent).length === 0
                                            }
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>City</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Invite Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Registered</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.map((record) => (
                                    <TableRow key={record.preRegistrationId} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedRecords.has(record.preRegistrationId)}
                                                onChange={() => handleSelectRecord(record.preRegistrationId)}
                                                disabled={record.isLaunchInviteSent}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, background: '#db2777' }}>
                                                    {record.fullName?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {record.fullName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                {record.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                {record.phoneNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                {record.city}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={record.isLaunchInviteSent ? <CheckCircle size={14} /> : undefined}
                                                label={
                                                    record.isLaunchInviteSent
                                                        ? `Sent ${formatDate(record.inviteSentOn)}`
                                                        : 'Pending'
                                                }
                                                size="small"
                                                color={record.isLaunchInviteSent ? 'success' : 'warning'}
                                                variant={record.isLaunchInviteSent ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                {formatDate(record.createdOn)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, record)}
                                                sx={{ '&:hover': { background: '#fff1f2' } }}
                                            >
                                                <MoreVertical size={18} color="#64748b" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={() => handleViewDetails(selectedRecord)}>
                        <Eye size={16} style={{ marginRight: 12 }} />
                        View Full Details
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => handleOpenDeleteDialog(selectedRecord)} sx={{ color: '#ef4444' }}>
                        <Trash2 size={16} style={{ marginRight: 12 }} />
                        Delete Record
                    </MenuItem>
                </Menu>

                {/* Details Modal */}
                <Dialog
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                        Pre-Registration Details
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        {fullDetails && (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Full Name
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.fullName}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.email}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Phone Number
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.phoneNumber}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Address
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.addressLine1}
                                        {fullDetails.addressLine2 && `, ${fullDetails.addressLine2}`}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        City, State, Country
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.city}, {fullDetails.state} {fullDetails.country}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Postal Code
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {fullDetails.postalCode}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Invite Status
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={
                                                fullDetails.isLaunchInviteSent
                                                    ? `Sent on ${formatDate(fullDetails.inviteSentOn)}`
                                                    : 'Pending'
                                            }
                                            color={fullDetails.isLaunchInviteSent ? 'success' : 'warning'}
                                            variant={fullDetails.isLaunchInviteSent ? 'filled' : 'outlined'}
                                        />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Registered On
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {formatDate(fullDetails.createdOn)}
                                    </Typography>
                                </Box>
                                {fullDetails.updatedOn && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            {formatDate(fullDetails.updatedOn)}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 1 }}>
                        <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleCancelDelete}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#ef4444' }}>
                        Delete Pre-Registration
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Are you sure you want to delete{' '}
                            <Typography component="span" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {recordToDelete?.fullName}
                            </Typography>
                            's pre-registration? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={handleCancelDelete}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            variant="contained"
                            sx={{
                                background: '#ef4444',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { background: '#dc2626' }
                            }}
                        >
                            Delete Record
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default PreRegistrationsPage;
