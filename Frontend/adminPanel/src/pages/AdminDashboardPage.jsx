import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Avatar,
    Select,
    MenuItem
} from '@mui/material';
import {
    Users,
    Heart,
    BookOpen,
    Zap,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    MessageCircle,
    ShoppingBag,
    Search,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const StatCard = ({ title, value, icon, trend, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay }}
    >
        <Card
            elevation={0}
            sx={{
                height: '100%',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                p: 3,
                '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="body2" color="#64748b" fontWeight="600" sx={{ mb: 1.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: '#1e293b', mb: 1 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {trend}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: color,
                        color: 'white',
                        display: 'flex',
                        boxShadow: `0 8px 16px -4px ${color}40`
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </Card>
    </motion.div>
);

const AdminDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState({
        activeMembers: 0,
        storiesShared: 0,
        healingCircles: 0,
        avgBondGrowth: '0%'
    });
    const [loadingStats, setLoadingStats] = useState(true);
    
    // Chart data states
    const [communityGrowthData, setCommunityGrowthData] = useState([]);
    const [activityByTimeData, setActivityByTimeData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);
    
    // Trending & Activity states
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loadingDynamicData, setLoadingDynamicData] = useState(false);
    
    // Date range state - dropdown based
    const [selectedRange, setSelectedRange] = useState('all');
    const [displayDateRange, setDisplayDateRange] = useState('All Time');
    const topicPalette = ['#8b5cf6', '#d946ef', '#10b981', '#f97316', '#3b82f6', '#ef4444'];

    // Get date range from selection
    const getDateRangeFromSelection = (range) => {
        const today = new Date();
        let fromDate = null;
        let toDate = null;
        let displayText = 'All Time';

        switch (range) {
            case 'last7':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 7);
                toDate = today;
                displayText = 'Last 7 Days';
                break;
            case 'last30':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 30);
                toDate = today;
                displayText = 'Last 30 Days';
                break;
            case 'last90':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 90);
                toDate = today;
                displayText = 'Last 3 Months';
                break;
            case 'last180':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 180);
                toDate = today;
                displayText = 'Last 6 Months';
                break;
            case 'thisYear':
                fromDate = new Date(today.getFullYear(), 0, 1);
                toDate = today;
                displayText = `This Year (${today.getFullYear()})`;
                break;
            case 'all':
            default:
                displayText = 'All Time';
                break;
        }

        return { fromDate, toDate, displayText };
    };

    // Fetch dashboard stats
    const fetchDashboardStats = async (from = null, to = null) => {
        setLoadingStats(true);
        try {
            const response = await apiService.getDashboardStats(from, to);
            if (response?.success && response?.data) {
                setDashboardData({
                    activeMembers: response.data.activeMembers || 0,
                    storiesShared: response.data.storiesShared || 0,
                    healingCircles: response.data.healingCircles || 0,
                    avgBondGrowth: String(response.data.avgBondGrowth || '0%')
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch stats on component mount (all data by default)
    useEffect(() => {
        fetchDashboardStats();
        fetchChartData();
        fetchDynamicData();
    }, []);

    // Handle date range selection
    const handleRangeChange = (range) => {
        setSelectedRange(range);
        const { fromDate, toDate, displayText } = getDateRangeFromSelection(range);
        setDisplayDateRange(displayText);
        fetchDashboardStats(fromDate, toDate);
        fetchChartData(fromDate, toDate);
        fetchDynamicData(fromDate, toDate);
    };

    // Handle clear filter
    const handleClearFilter = () => {
        setSelectedRange('all');
        setDisplayDateRange('All Time');
        fetchDashboardStats(null, null);
        fetchChartData(null, null);
        fetchDynamicData(null, null);
    };

    // Fetch chart data
    const fetchChartData = async (from = null, to = null) => {
        setLoadingCharts(true);
        try {
            const [growthRes, activityRes] = await Promise.all([
                apiService.getCommunityGrowthData(from, to),
                apiService.getActivityByTime(from, to)
            ]);

            if (growthRes?.success && growthRes?.data) {
                setCommunityGrowthData(growthRes.data);
            }

            if (activityRes?.success && activityRes?.data) {
                setActivityByTimeData(activityRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch chart data:', error);
        } finally {
            setLoadingCharts(false);
        }
    };

    // Fetch trending topics and recent activity
    const fetchDynamicData = async (from = null, to = null) => {
        setLoadingDynamicData(true);
        try {
            const [topicsRes, activityRes] = await Promise.all([
                apiService.getTrendingTopics(4, from, to),
                apiService.getRecentActivity(5)
            ]);

            if (topicsRes?.success && topicsRes?.data) {
                setTrendingTopics(topicsRes.data);
            }

            if (activityRes?.success && activityRes?.data) {
                setRecentActivities(activityRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch dynamic data:', error);
        } finally {
            setLoadingDynamicData(false);
        }
    };

    // Generate SVG path for community growth chart
    const generateGrowthPath = (data, dataKey, maxValue) => {
        if (!data || data.length === 0) return '';
        
        const points = data.map((item, idx) => {
            const x = (idx / (data.length - 1 || 1)) * 500;
            const value = item[dataKey] || 0;
            const y = 220 - ((value / maxValue) * 220);
            return `${x},${y}`;
        });
        
        return `M ${points.join(' L ')}`;
    };

    // Generate circles for growth chart
    const generateGrowthCircles = (data, dataKey, maxValue, fill) => {
        if (!data || data.length === 0) return [];
        
        return data.map((item, idx) => {
            const x = (idx / (data.length - 1 || 1)) * 500;
            const value = item[dataKey] || 0;
            const y = 220 - ((value / maxValue) * 220);
            return { x, y, idx };
        });
    };

    // Generate bar heights for activity chart
    const generateActivityBars = (data) => {
        if (!data || data.length === 0) return [];
        
        const maxActivity = Math.max(...data.map(d => d.activity || 0), 1);
        
        return data.map((item, idx) => ({
            height: (item.activity / maxActivity) * 240,
            idx,
            label: item.hour
        }));
    };

    // Map icon string to React component
    const getIconComponent = (iconName) => {
        const iconMap = {
            'MessageCircle': <MessageCircle size={16} />,
            'Calendar': <Calendar size={16} />,
            'ArrowUpRight': <ArrowUpRight size={16} />,
            'Users': <Users size={16} />,
            'Heart': <Heart size={16} />,
        };
        return iconMap[iconName] || <MessageCircle size={16} />;
    };

    const normalizedTrendingTopics = trendingTopics.map((topic, index) => ({
        ...topic,
        color: topicPalette[index % topicPalette.length]
    }));

    const getTrendingTopicsChart = () => {
        if (normalizedTrendingTopics.length === 0) {
            return {
                background: 'conic-gradient(#e2e8f0 0deg 360deg)'
            };
        }

        const total = normalizedTrendingTopics.reduce((sum, topic) => sum + (topic.val || 0), 0);
        if (total <= 0) {
            return {
                background: 'conic-gradient(#e2e8f0 0deg 360deg)'
            };
        }

        let currentAngle = 0;
        const segments = normalizedTrendingTopics.map((topic) => {
            const sweep = (topic.val / total) * 360;
            const start = currentAngle;
            const end = currentAngle + sweep;
            currentAngle = end;
            return `${topic.color} ${start}deg ${end}deg`;
        });

        return {
            background: `conic-gradient(${segments.join(', ')})`
        };
    };

    // These values now come from API
    const stats = [
        { title: 'Active Members', value: String(dashboardData.activeMembers || 0).padStart(5, ' '), icon: <Users size={22} />, trend: dashboardData.activeMembersTrend || '0% this month', color: '#6366f1', delay: 0.1 },
        { title: 'Stories Shared', value: String(dashboardData.storiesShared || 0).padStart(5, ' '), icon: <Heart size={22} />, trend: dashboardData.storiesSharedTrend || '0% this month', color: '#ec4899', delay: 0.2 },
        { title: 'Healing Circles', value: String(dashboardData.healingCircles || 0).padStart(5, ' '), icon: <Calendar size={22} />, trend: dashboardData.healingCirclesTrend || '0% this month', color: '#f97316', delay: 0.3 },
        { title: 'Avg. Bond Growth', value: dashboardData.avgBondGrowth || '0%', icon: <TrendingUp size={22} />, trend: dashboardData.avgBondGrowthTrend || '0% this month', color: '#22c55e', delay: 0.4 },
    ];

    return (
        <AdminLayout>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 0.5, color: '#1e293b' }}>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                        Welcome back! Here's what's happening in your community.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* Date Range Dropdown */}
                    <Select
                        value={selectedRange}
                        onChange={(e) => handleRangeChange(e.target.value)}
                        size="small"
                        sx={{
                            minWidth: 140,
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#334155',
                            '& .MuiOutlinedInput-notchedOutline': {
                                border: 'none'
                            }
                        }}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="last7">Last 7 Days</MenuItem>
                        <MenuItem value="last30">Last 30 Days</MenuItem>
                        <MenuItem value="last90">Last 3 Months</MenuItem>
                        <MenuItem value="last180">Last 6 Months</MenuItem>
                        <MenuItem value="thisYear">This Year</MenuItem>
                    </Select>

                    {/* Display Date Range Badge */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 2,
                            minWidth: 150
                        }}
                    >
                        <Calendar size={14} color="#64748b" />
                        <Typography variant="caption" fontWeight="600" color="#334155" sx={{ fontSize: '0.8rem' }}>
                            {displayDateRange}
                        </Typography>
                    </Box>

                    {/* Clear Button */}
                    {selectedRange !== 'all' && (
                        <button
                            onClick={handleClearFilter}
                            style={{
                                padding: '6px 10px',
                                backgroundColor: '#f3f4f6',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                            title="Clear filters"
                        >
                            <X size={14} />
                        </button>
                    )}
                </Box>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 4,
                mb: 5,
                width: '100%'
            }}>
                {stats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </Box>

            {/* Main Visuals Section */}
            {/* Charts Section */}
            <Grid container spacing={4} sx={{ mb: 4, width: '100%' }}>
                <Grid item xs={12} lg={7}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="800">Community Growth</Typography>
                        </Box>
                        {/* Refined CSS Line Chart with Y-axis */}
                        <Box sx={{ height: 300, position: 'relative', mt: 2, display: 'flex', px: 2, ml: 4 }}>
                            {/* Y-Axis Labels */}
                            <Box sx={{ position: 'absolute', left: -45, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
                                {[2400, 1800, 1200, 600, 0].map(v => <Typography key={v} variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '11px' }}>{v}</Typography>)}
                            </Box>

                            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flexGrow: 1, position: 'relative', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1, zIndex: 0 }}>
                                        {[1, 2, 3, 4].map(i => <Box key={i} sx={{ borderTop: '1px dashed #64748b', width: '100%' }} />)}
                                    </Box>
                                    <svg viewBox="0 0 800 260" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative', zIndex: 1 }}>
                                        {/* Line 1 (Members) */}
                                        <path d={generateGrowthPath(communityGrowthData, 'members', Math.max(...(communityGrowthData.map(d => d.members) || [1]), 1))} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                                        {generateGrowthCircles(communityGrowthData, 'members', Math.max(...(communityGrowthData.map(d => d.members) || [1]), 1)).map((point) => (
                                            <circle key={`m-${point.idx}`} cx={point.x} cy={point.y} r="4" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                                        ))}

                                        {/* Line 2 (Posts) */}
                                        <path d={generateGrowthPath(communityGrowthData, 'posts', Math.max(...(communityGrowthData.map(d => d.posts) || [1]), 1))} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                                        {generateGrowthCircles(communityGrowthData, 'posts', Math.max(...(communityGrowthData.map(d => d.posts) || [1]), 1)).map((point) => (
                                            <circle key={`p-${point.idx}`} cx={point.x} cy={point.y} r="4" fill="white" stroke="#ec4899" strokeWidth="2" />
                                        ))}
                                    </svg>
                                </Box>
                                {/* X-Axis Labels */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, px: 1 }}>
                                    {communityGrowthData.length > 0 
                                        ? communityGrowthData.map(m => <Typography key={m.month} variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '11px' }}>{m.month}</Typography>)
                                        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => <Typography key={m} variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '11px' }}>{m}</Typography>)
                                    }
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4, mt: 3, justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8b5cf6' }} /><Typography variant="caption" fontWeight="700">Members</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ec4899' }} /><Typography variant="caption" fontWeight="700">Posts</Typography></Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="800">Activity by Time</Typography>
                        </Box>
                        <Box sx={{ height: 300, position: 'relative', display: 'flex', px: 2, ml: 4 }}>
                            {/* Y-Axis Labels */}
                            <Box sx={{ position: 'absolute', left: -45, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', pr: 1 }}>
                                {[100, 75, 50, 25, 0].map(v => <Typography key={v} variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '11px' }}>{v}</Typography>)}
                            </Box>

                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', px: 1, borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', pb: 0, position: 'relative' }}>
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1, zIndex: 0 }}>
                                        {[1, 2, 3].map(i => <Box key={i} sx={{ borderTop: '1px dashed #64748b', width: '100%' }} />)}
                                    </Box>
                                    {generateActivityBars(activityByTimeData).map((bar) => (
                                        <Box key={bar.idx} sx={{ width: '12%', height: `${bar.height}px`, maxHeight: '240px', bgcolor: '#8b5cf6', borderRadius: '6px 6px 0 0', position: 'relative', zIndex: 1 }} />
                                    ))}
                                </Box>
                                {/* X-Axis Labels */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5 }}>
                                    {activityByTimeData.length > 0
                                        ? activityByTimeData.map(t => <Typography key={t.hour} variant="caption" sx={{ width: '16.66%', textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: '10px' }}>{t.hour}</Typography>)
                                        : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map(t => <Typography key={t} variant="caption" sx={{ width: '16.66%', textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: '10px' }}>{t}</Typography>)
                                    }
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Row */}
            <Grid container spacing={4} sx={{ width: '100%' }}>
                <Grid item xs={12} lg={4}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Typography variant="h6" fontWeight="800" mb={4}>Trending Topics</Typography>
                        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 6 }}>
                            <Box sx={{ width: 160, height: 160, borderRadius: '50%', ...getTrendingTopicsChart(), position: 'relative' }}>
                                <Box sx={{ position: 'absolute', inset: 24, borderRadius: '50%', bgcolor: 'white' }} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {loadingDynamicData ? (
                                <Typography variant="body2" color="#94a3b8">Loading trending topics...</Typography>
                            ) : normalizedTrendingTopics.length > 0 ? normalizedTrendingTopics.map(topic => (
                                <Box key={topic.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: topic.color }} />
                                        <Typography variant="body2" fontWeight="700" color="#64748b">{topic.label}</Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight="800" color="#1e293b">{topic.val}</Typography>
                                </Box>
                            )) : (
                                <Typography variant="body2" color="#94a3b8">No trending topics found for this range.</Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Typography variant="h6" fontWeight="800" mb={4}>Recent Activity</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                            {loadingDynamicData ? (
                                <Typography variant="body2" color="#94a3b8">Loading recent activity...</Typography>
                            ) : recentActivities.length > 0 ? recentActivities.map((activity) => (
                                <Box key={activity.id} sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 2,
                                            bgcolor: activity.color,
                                            color: activity.iconColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        {getIconComponent(activity.icon)}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight="600" color="#334155">
                                            <Box component="span" sx={{ fontWeight: 800 }}>{activity.user}</Box> {activity.action}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">{activity.time}</Typography>
                                    </Box>
                                </Box>
                            )) : (
                                <Typography variant="body2" color="#94a3b8">No recent activity found.</Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </AdminLayout>
    );
};

export default AdminDashboardPage;
