import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Avatar,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Pagination
} from '@mui/material';
import {
    Search,
    MessageCircle,
    Flag,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Eye,
    Trash2,
    ShieldAlert,
    X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const formatDetailedDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('en-GB', options).replace(',', '');
};

const ContentModerationPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Posts');
    const [statsData, setStatsData] = useState({ totalPosts: 0, pendingReview: 0, flaggedPosts: 0, postsToday: 0 });
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPost, setSelectedPost] = useState(null);
    const [reportReasons, setReportReasons] = useState([]);

    const fetchStats = async () => {
        try {
            const res = await apiService.getContentStats();
            if (res?.data) setStatsData(res.data);
        } catch (error) {
            console.error('Failed to fetch content stats:', error);
        }
    };

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.getContentPosts({ search: searchTerm, statusFilter, page: page, pageSize: 5 });
            if (res?.data?.posts) {
                setPosts(res.data.posts);
                setTotalPages(Math.ceil(res.data.totalCount / 5) || 1);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, page]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const delayer = setTimeout(() => {
            fetchPosts();
        }, 300);
        return () => clearTimeout(delayer);
    }, [fetchPosts]);

    const handleAction = async (postId, action) => {
        try {
            await apiService.updatePostStatus(postId, action);
            fetchStats();
            fetchPosts();
            if (selectedPost && selectedPost.postId === postId) {
                setSelectedPost(null);
            }
        } catch (error) {
            console.error(`Failed to ${action} post:`, error);
        }
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleOpenPostDetails = async (post) => {
        setSelectedPost(post);
        setReportReasons([]); // reset on open
        if (post.status === 'flagged') {
            try {
                const reasons = await apiService.getPostReports(post.postId);
                setReportReasons(reasons?.data ?? reasons ?? []);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            }
        }
    };

    const stats = [
        { label: 'Total Posts', value: statsData.totalPosts || 0, color: '#6366f1' },
        { label: 'Pending Review', value: statsData.pendingReview || 0, color: '#f59e0b', highlight: true },
        { label: 'Flagged Posts', value: statsData.flaggedPosts || 0, color: '#ef4444', highlight: true },
        { label: 'Posts Today', value: statsData.postsToday || 0, color: '#22c55e' },
    ];

    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                    Content Moderation
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                    Review and moderate community posts
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
                            textTransform: 'titlecase'
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
                    placeholder="Search posts by content or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: '#f8fafc',
                            '& fieldset': { border: '1px solid #edf2f7' },
                            px: 1,
                            '&:hover fieldset': { border: '1px solid #cbd5e1' },
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} color="#94a3b8" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{
                        minWidth: 150,
                        borderRadius: '12px',
                        bgcolor: '#f8fafc',
                        '& fieldset': { border: '1px solid #edf2f7' },
                        fontWeight: 600,
                        color: '#64748b',
                        '&:hover fieldset': { border: '1px solid #cbd5e1' },
                    }}
                >
                    <MenuItem value="All Posts">All Posts</MenuItem>
                    <MenuItem value="Published">Published</MenuItem>
                    <MenuItem value="Flagged">Flagged</MenuItem>
                    <MenuItem value="Removed">Removed</MenuItem>
                </Select>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {!loading && posts.length === 0 && (
                    <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        No posts found.
                    </Typography>
                )}
                {posts.map((post) => (
                    <Paper
                        key={post.postId}
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '16px',
                            border: '1px solid #edf2f7',
                            bgcolor: post.status === 'flagged' ? '#fff5f5' : 'white',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Avatar sx={{
                                    width: 44,
                                    height: 44,
                                    bgcolor: post.status === 'flagged' ? '#fee2e2' : '#f5f3ff',
                                    color: post.status === 'flagged' ? '#ef4444' : '#8b5cf6',
                                    fontWeight: 700
                                }}>
                                    {post.avatar}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" fontWeight="800" color="#1a1a1a">{post.user}</Typography>
                                    <Typography variant="caption" color="#94a3b8" fontWeight="500">{formatDetailedDate(post.time)}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {post.status === 'flagged' && (
                                    <>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#ef4444', color: 'white', px: 1.5, py: 0.5, borderRadius: '12px', gap: 0.5 }}>
                                            <Flag size={12} fill="currentColor" />
                                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>Reported</Typography>
                                        </Box>
                                        <Box sx={{ display: 'inline-block', border: '1px solid #e2e8f0', color: '#64748b', px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>
                                            flagged
                                        </Box>
                                    </>
                                )}
                                {post.status === 'removed' && (
                                    <Box sx={{ display: 'inline-block', bgcolor: '#f1f5f9', color: '#64748b', px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>
                                        removed
                                    </Box>
                                )}
                                {(post.status === 'published' || post.status === 'pending') && (
                                    <Box sx={{ display: 'inline-block', bgcolor: '#1a1a1a', color: 'white', px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>
                                        published
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 2, mt: 1, color: '#4a5568', lineHeight: 1.6, fontWeight: 500 }}>
                            {post.content}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            {post.tags.map(tag => (
                                <Typography key={tag} variant="caption" sx={{ color: '#8b5cf6', fontWeight: 700 }}>{tag}</Typography>
                            ))}
                        </Box>

                        <Divider sx={{ mb: 2, opacity: 0.6 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Typography variant="caption" color="#64748b" fontWeight="600">
                                    {post.likeCount} likes
                                </Typography>
                                <Typography variant="caption" color="#64748b" fontWeight="600">
                                    {post.commentCount} comments
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button onClick={() => handleOpenPostDetails(post)} size="small" startIcon={<Eye size={16} />} sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}>
                                    View Details
                                </Button>
                                {post.status === 'pending' && (
                                    <>
                                        <Button onClick={() => handleAction(post.postId, 'approve')} size="small" variant="outlined" startIcon={<CheckCircle2 size={16} />} sx={{ color: '#1a1a1a', borderColor: '#e2e8f0', fontWeight: 700, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#1a1a1a', bgcolor: 'transparent' } }}>
                                            Approve
                                        </Button>
                                        <Button onClick={() => handleAction(post.postId, 'reject')} size="small" variant="contained" startIcon={<XCircle size={16} />} sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 700, textTransform: 'none', borderRadius: '10px', boxShadow: 'none', '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' } }}>
                                            Reject
                                        </Button>
                                    </>
                                )}
                                {post.status === 'flagged' && (
                                    <>
                                        <Button onClick={() => handleAction(post.postId, 'approve')} size="small" variant="outlined" startIcon={<CheckCircle2 size={16} />} sx={{ color: '#1a1a1a', borderColor: '#e2e8f0', fontWeight: 700, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#1a1a1a', bgcolor: 'transparent' } }}>
                                            Approve
                                        </Button>
                                        <Button onClick={() => handleAction(post.postId, 'remove')} size="small" variant="contained" startIcon={<Trash2 size={16} />} sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 700, textTransform: 'none', borderRadius: '10px', boxShadow: 'none', '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' } }}>
                                            Remove
                                        </Button>
                                    </>
                                )}
                                {post.status === 'removed' && (
                                    <Button onClick={() => handleAction(post.postId, 'approve')} size="small" variant="outlined" startIcon={<CheckCircle2 size={16} />} sx={{ color: '#1a1a1a', borderColor: '#e2e8f0', fontWeight: 700, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#1a1a1a', bgcolor: 'transparent' } }}>
                                        Restore
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Pagination Component */}
            {!loading && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                fontWeight: 600,
                                borderRadius: '8px'
                            }
                        }}
                    />
                </Box>
            )}

            {/* View Details Modal Matching Figma */}
            <Dialog
                open={Boolean(selectedPost)}
                onClose={() => setSelectedPost(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px', p: 1 }
                }}
            >
                {selectedPost && (
                    <>
                        <DialogTitle sx={{ pb: 0, pt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#1a1a1a' }}>Post Details</Typography>
                            <IconButton onClick={() => setSelectedPost(null)} size="small" sx={{ color: '#64748b', top: -4, right: -4 }}>
                                <X size={20} />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ px: 3, pt: 2, pb: 4 }}>
                            {/* User Info Header */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                                <Avatar sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: '#f5f3ff',
                                    color: '#8b5cf6',
                                    fontWeight: 700
                                }}>
                                    {selectedPost.avatar}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="800" color="#1a1a1a" lineHeight={1.2}>{selectedPost.user}</Typography>
                                    <Typography variant="caption" color="#94a3b8" fontWeight="500" sx={{ fontSize: '0.7rem' }}>{formatDetailedDate(selectedPost.time)}</Typography>
                                </Box>
                            </Box>

                            {/* Post Content */}
                            <Box sx={{ bgcolor: '#fbfcff', border: '1px solid #f8fafc', p: 3, borderRadius: '12px', mb: 3 }}>
                                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>
                                    {selectedPost.content}
                                </Typography>
                            </Box>

                            {/* Report Reasons Box (Only if flagged) */}
                            {selectedPost.status === 'flagged' && (
                                <Box sx={{
                                    border: '1px solid #fca5a5',
                                    bgcolor: '#fef2f2',
                                    borderRadius: '12px',
                                    p: 3,
                                    mb: 1
                                }}>
                                    <Typography variant="subtitle2" sx={{ color: '#991b1b', fontWeight: 600, mb: 1.5 }}>
                                        Report Reasons:
                                    </Typography>
                                    {reportReasons.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {reportReasons.map((reason, idx) => (
                                                <Typography key={idx} variant="body2" sx={{ color: '#b91c1c' }}>
                                                    {reason}
                                                </Typography>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: '#b91c1c', fontStyle: 'italic' }}>
                                            No explicit reasons recorded.
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 4, pt: 0, justifyContent: 'center', gap: 2 }}>
                            <Button
                                onClick={() => setSelectedPost(null)}
                                variant="outlined"
                                sx={{
                                    color: '#1a1a1a',
                                    borderColor: '#f1f5f9',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    px: 4,
                                    py: 1,
                                    '&:hover': { borderColor: '#e2e8f0', bgcolor: '#f8fafc' }
                                }}
                            >
                                Close
                            </Button>

                            {selectedPost.status !== 'removed' && (
                                <Button
                                    onClick={() => handleAction(selectedPost.postId, 'remove')}
                                    variant="contained"
                                    startIcon={<Trash2 size={16} />}
                                    sx={{
                                        bgcolor: '#e11d48',
                                        color: 'white',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        px: 4,
                                        py: 1,
                                        '&:hover': { bgcolor: '#be123c', boxShadow: 'none' }
                                    }}
                                >
                                    Remove Post
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </AdminLayout>
    );
};

export default ContentModerationPage;
