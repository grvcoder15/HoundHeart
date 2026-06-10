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
    IconButton,
    Button,
    Modal,
    Fade,
    Backdrop,
    Avatar,
    Pagination,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    AlertTriangle,
    Flag,
    CheckCircle2,
    XCircle,
    Eye,
    Check,
    X,
    User as UserIcon,
    Search,
    Filter
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ pending: 0, highPriority: 0, resolved: 0, dismissed: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [page]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, reportsRes] = await Promise.all([
                apiService.getReportStats(),
                apiService.getReports({ page, pageSize })
            ]);
            
            // Extract data from response wrapper (supports both camelCase and PascalCase keys)
            if (statsRes?.success && statsRes?.data) {
                const statsData = statsRes.data;
                setStats({
                    pending: statsData.pending ?? statsData.Pending ?? 0,
                    highPriority: statsData.highPriority ?? statsData.HighPriority ?? 0,
                    resolved: statsData.resolved ?? statsData.Resolved ?? 0,
                    dismissed: statsData.dismissed ?? statsData.Dismissed ?? 0
                });
            }
            
            if (reportsRes?.success && reportsRes?.data) {
                setReports(reportsRes.data.reports || []);
                setTotalCount(reportsRes.data.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (reportId) => {
        try {
            setDetailsLoading(true);
            setIsModalOpen(true);
            const res = await apiService.getReportDetails(reportId);
            if (res?.success && res?.data) {
                setSelectedReport(res.data);
            }
        } catch (error) {
            console.error('Error fetching report details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId, newStatus) => {
        try {
            await apiService.updateReportStatus(reportId, newStatus);
            fetchData(); // Refresh list and stats
            if (isModalOpen) setIsModalOpen(false);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: { bg: '#fff7ed', color: '#f97316' },
            resolved: { bg: '#f0fdf4', color: '#22c55e' },
            dismissed: { bg: '#f1f5f9', color: '#64748b' }
        };
        const s = styles[status.toLowerCase()] || styles.dismissed;
        return (
            <Box sx={{
                px: 1.5, py: 0.5, borderRadius: '8px',
                bgcolor: s.bg, color: s.color,
                fontSize: '0.72rem', fontWeight: 700,
                display: 'inline-block', textTransform: 'lowercase'
            }}>
                {status}
            </Box>
        );
    };

    const PriorityBadge = ({ priority }) => {
        const styles = {
            high: { bg: '#ff1744', color: 'white' },
            medium: { bg: '#ff9100', color: 'white' },
            low: { bg: '#ffc400', color: 'white' }
        };
        const p = styles[priority.toLowerCase()] || styles.low;
        return (
            <Box sx={{
                px: 1.5, py: 0.3, borderRadius: '6px',
                bgcolor: p.bg, color: p.color,
                fontSize: '0.65rem', fontWeight: 800,
                display: 'inline-block', textTransform: 'uppercase',
                boxShadow: priority.toLowerCase() === 'high' ? '0 2px 4px rgba(255, 23, 68, 0.2)' : 'none'
            }}>
                {priority}
            </Box>
        );
    };

    const TypeBadge = ({ type }) => (
        <Box sx={{
            px: 1.4, py: 0.4, borderRadius: '6px',
            border: '1px solid #e2e8f0', bgcolor: 'white',
            color: '#64748b', fontSize: '0.7rem', fontWeight: 700,
            display: 'inline-block'
        }}>
            {type}
        </Box>
    );

    const StatCard = ({ title, count, icon: Icon, color, bg }) => (
        <Paper elevation={0} sx={{
            p: 2.5, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2,
            border: '1px solid rgba(226, 232, 240, 0.6)',
            bgcolor: 'white'
        }}>
            <Box sx={{
                width: 44, height: 44, borderRadius: 2.5, bgcolor: bg, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={24} />
            </Box>
            <Box>
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', mb: -0.2 }}>{title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{count}</Typography>
            </Box>
        </Paper>
    );

    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 0.5, fontSize: '1.8rem' }}>Reports</Typography>
                <Typography sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Review and manage community reports</Typography>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 6,
                width: '100%'
            }}>
                <StatCard title="Pending" count={stats.pending} icon={AlertTriangle} color="#f97316" bg="#fff7ed" />
                <StatCard title="High Priority" count={stats.highPriority} icon={Flag} color="#f43f5e" bg="#fff1f2" />
                <StatCard title="Resolved" count={stats.resolved} icon={CheckCircle2} color="#22c55e" bg="#f0fdf4" />
                <StatCard title="Dismissed" count={stats.dismissed} icon={XCircle} color="#64748b" bg="#f1f5f9" />
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 6, border: '1px solid #f1f5f9', bgcolor: 'white', overflow: 'hidden' }}>
                <Box sx={{ p: 3, px: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>All Reports</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8,
                            bgcolor: '#f8fafc', borderRadius: '10px', color: '#94a3b8', minWidth: 200,
                            border: '1px solid #f1f5f9'
                        }}>
                            <Search size={16} />
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>Search reports...</Typography>
                        </Box>
                        <IconButton sx={{ bgcolor: '#f8fafc', borderRadius: '10px', width: 40, height: 40, border: '1px solid #f1f5f9' }}>
                            <Filter size={18} />
                        </IconButton>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderBottom: '1px solid #f1f5f9', py: 1.5, px: 3 } }}>
                                {['Type', 'Reported User', 'Reason', 'Reported By', 'Date', 'Priority', 'Status', 'Actions'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} sx={{ color: '#db2777' }} />
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>No reports found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : reports.map((report) => (
                                <TableRow key={report.reportId} sx={{ '& td': { borderBottom: '1px solid #f8fafc', py: 2.2, px: 3 } }}>
                                    <TableCell><TypeBadge type={report.type} /></TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#f1f5f9', color: '#64748b' }}>
                                                <UserIcon size={16} />
                                            </Avatar>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{report.reportedUser}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>{report.reason}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>{report.reportedBy}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}>{report.date}</TableCell>
                                    <TableCell><PriorityBadge priority={report.priority} /></TableCell>
                                    <TableCell><StatusBadge status={report.status} /></TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(report.reportId)}
                                                    sx={{ color: '#444', bgcolor: 'transparent', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                >
                                                    <Eye size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            {report.status.toLowerCase() === 'pending' && (
                                                <>
                                                    <Tooltip title="Resolve">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleUpdateStatus(report.reportId, 'resolved')}
                                                            sx={{
                                                                color: '#22c55e', border: '1px solid #dcfce7',
                                                                bgcolor: 'white', '&:hover': { bgcolor: '#f0fdf4' }
                                                            }}
                                                        >
                                                            <Check size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Dismiss">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleUpdateStatus(report.reportId, 'dismissed')}
                                                            sx={{
                                                                color: '#f43f5e', border: '1px solid #ffe4e6',
                                                                bgcolor: 'white', '&:hover': { bgcolor: '#fff1f2' }
                                                            }}
                                                        >
                                                            <X size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={Math.ceil(totalCount / pageSize)}
                        page={page}
                        onChange={(e, v) => setPage(v)}
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '8px' },
                            '& .Mui-selected': { bgcolor: '#db2777 !important', color: 'white' }
                        }}
                    />
                </Box>
            </Paper>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(15, 23, 42, 0.4)' } }}
            >
                <Fade in={isModalOpen}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: { xs: '90%', sm: 500 }, bgcolor: 'white', borderRadius: 6,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', p: 4, outline: 'none'
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Report Details</Typography>
                        {detailsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress size={24} sx={{ color: '#db2777' }} />
                            </Box>
                        ) : selectedReport ? (
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TypeBadge type={selectedReport.type} />
                                        <PriorityBadge priority={selectedReport.priority} />
                                    </Box>
                                    <StatusBadge status={selectedReport.status} />
                                </Box>
                                <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    Review report for <strong>{selectedReport.reportedUser}</strong> submitted by {selectedReport.reportedBy} on {selectedReport.date}.
                                </Typography>
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>Reason</Typography>
                                    <Typography sx={{ fontSize: '0.9rem', color: '#475569', mt: 0.5 }}>{selectedReport.reason}</Typography>
                                    {selectedReport.description && (
                                        <>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b', mt: 2 }}>Description</Typography>
                                            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.5 }}>{selectedReport.description}</Typography>
                                        </>
                                    )}
                                    {selectedReport.contentSnippet && (
                                        <>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b', mt: 2 }}>Content Reported</Typography>
                                            <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0', fontStyle: 'italic', fontSize: '0.85rem', color: '#475569' }}>
                                                "{selectedReport.contentSnippet}"
                                            </Box>
                                        </>
                                    )}
                                </Box>
                                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button onClick={() => setIsModalOpen(false)} sx={{ color: '#64748b', fontWeight: 700 }}>Close</Button>
                                    {selectedReport.status?.toLowerCase() === 'pending' && (
                                        <>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleUpdateStatus(selectedReport.reportId, 'dismissed')}
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleUpdateStatus(selectedReport.reportId, 'resolved')}
                                                sx={{ bgcolor: '#db2777', fontWeight: 700, '&:hover': { bgcolor: '#be185d' } }}
                                            >
                                                Resolve
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ) : null}
                    </Box>
                </Fade>
            </Modal>
        </AdminLayout >
    );
};

export default ReportsPage;
