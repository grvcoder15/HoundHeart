import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import {
    Users,
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    CreditCard,
    ShieldAlert
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const NumberCard = ({ title, value, subtitle, icon, color = '#8b5cf6' }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            borderRadius: '20px',
            border: '1px solid #edf2f7',
            bgcolor: 'white',
            transition: 'all 0.25s ease',
            '&:hover': {
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                transform: 'translateY(-2px)'
            }
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 900, mt: 0.8, letterSpacing: '-0.02em' }}>
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.6, fontWeight: 600 }}>
                    {subtitle}
                </Typography>
            </Box>
            <Box
                sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: color,
                    color: 'white'
                }}
            >
                {icon}
            </Box>
        </Box>
    </Paper>
);

const getNum = (obj, keys, fallback = 0) => {
    for (const key of keys) {
        if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return fallback;
};

const AdminAnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dashboardStats, setDashboardStats] = useState({});
    const [userStats, setUserStats] = useState({});
    const [contentStats, setContentStats] = useState({});
    const [reportStats, setReportStats] = useState({});
    const [subscriptionStats, setSubscriptionStats] = useState({});
    const [communityGrowth, setCommunityGrowth] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError('');

            const [
                dashboardRes,
                userRes,
                contentRes,
                reportsRes,
                subscriptionRes,
                growthRes,
                recentRes
            ] = await Promise.allSettled([
                apiService.getDashboardStats(),
                apiService.getUserStats(),
                apiService.getContentStats(),
                apiService.getReportStats(),
                apiService.getSubscriptionStats(),
                apiService.getCommunityGrowthData(),
                apiService.getRecentActivity(6)
            ]);

            const unwrap = (result) => {
                if (result.status !== 'fulfilled') return null;
                const payload = result.value;
                return payload?.data ?? null;
            };

            const dData = unwrap(dashboardRes);
            const uData = unwrap(userRes);
            const cData = unwrap(contentRes);
            const rData = unwrap(reportsRes);
            const sData = unwrap(subscriptionRes);
            const gData = unwrap(growthRes);
            const aData = unwrap(recentRes);

            if (dData) setDashboardStats(dData);
            if (uData) setUserStats(uData);
            if (cData) setContentStats(cData);
            if (rData) setReportStats(rData);
            if (sData) setSubscriptionStats(sData);
            if (Array.isArray(gData)) setCommunityGrowth(gData);
            if (Array.isArray(aData)) setRecentActivity(aData);

            const failures = [dashboardRes, userRes, contentRes, reportsRes, subscriptionRes]
                .filter(r => r.status === 'rejected')
                .length;
            if (failures >= 3) {
                setError('Some analytics sources are unavailable right now. Showing available data.');
            }

            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    const cards = useMemo(() => {
        const totalUsers = getNum(userStats, ['totalUsers', 'TotalUsers']);
        const activeMembers = getNum(dashboardStats, ['activeMembers', 'ActiveMembers']);
        const postsToday = getNum(contentStats, ['postsToday', 'PostsToday']);
        const pendingReports = getNum(reportStats, ['pending', 'Pending']);
        const activeSubscriptions = getNum(subscriptionStats, ['activeSubscriptions', 'ActiveSubscriptions']);
        const mrr = getNum(subscriptionStats, ['monthlyRecurringRevenue', 'MonthlyRecurringRevenue']);

        return [
            {
                title: 'Total Users',
                value: totalUsers.toLocaleString(),
                subtitle: 'Registered users across platform',
                icon: <Users size={20} />,
                color: '#6366f1'
            },
            {
                title: 'Active Members',
                value: activeMembers.toLocaleString(),
                subtitle: 'Currently active users',
                icon: <TrendingUp size={20} />,
                color: '#10b981'
            },
            {
                title: 'Posts Today',
                value: postsToday.toLocaleString(),
                subtitle: 'Community posts in last 24h',
                icon: <MessageSquare size={20} />,
                color: '#8b5cf6'
            },
            {
                title: 'Pending Reports',
                value: pendingReports.toLocaleString(),
                subtitle: 'Need moderation attention',
                icon: <ShieldAlert size={20} />,
                color: '#f59e0b'
            },
            {
                title: 'Active Subscriptions',
                value: activeSubscriptions.toLocaleString(),
                subtitle: 'Current paying users',
                icon: <CreditCard size={20} />,
                color: '#ec4899'
            },
            {
                title: 'MRR',
                value: `$${Number(mrr || 0).toFixed(2)}`,
                subtitle: 'Monthly recurring revenue',
                icon: <AlertTriangle size={20} />,
                color: '#0ea5e9'
            }
        ];
    }, [dashboardStats, userStats, contentStats, reportStats, subscriptionStats]);

    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                    Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                    Platform growth and engagement metrics
                </Typography>
            </Box>

            {error && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #fcd34d', bgcolor: '#fffbeb' }}>
                    <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 700 }}>
                        {error}
                    </Typography>
                </Paper>
            )}

            {loading ? (
                <Paper elevation={0} sx={{ p: 8, borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading analytics data...
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {cards.map((card) => (
                            <Grid key={card.title} item xs={12} sm={6} lg={4}>
                                <NumberCard {...card} />
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf2f7', height: '100%' }}>
                                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                                    Community Growth Trend
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>Period</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>Members</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>Posts</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {communityGrowth.length > 0 ? communityGrowth.slice(-6).map((row, idx) => (
                                                <TableRow key={`${row.month || row.label || 'period'}-${idx}`}>
                                                    <TableCell>{row.month || row.label || `Period ${idx + 1}`}</TableCell>
                                                    <TableCell align="right">{getNum(row, ['members', 'Members']).toLocaleString()}</TableCell>
                                                    <TableCell align="right">{getNum(row, ['posts', 'Posts']).toLocaleString()}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ color: '#94a3b8' }}>
                                                        No growth data available
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} lg={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf2f7', height: '100%' }}>
                                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                                    Recent Activity Feed
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                                        <Paper key={activity.id || idx} elevation={0} sx={{ p: 1.8, borderRadius: 2.5, border: '1px solid #f1f5f9' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 700 }}>
                                                        {(activity.user || 'User')} {(activity.action || 'performed an action')}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                        {activity.time || 'Just now'}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={activity.category || 'Activity'}
                                                    size="small"
                                                    sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontWeight: 700 }}
                                                />
                                            </Box>
                                        </Paper>
                                    )) : (
                                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                            No recent activity available
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </AdminLayout>
    );
};

export default AdminAnalyticsPage;
