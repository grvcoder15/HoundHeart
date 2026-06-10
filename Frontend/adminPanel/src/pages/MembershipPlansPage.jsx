import React, { useEffect, useMemo, useState } from 'react';
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
    TextField,
    Button,
    CircularProgress,
    Pagination,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const PAGE_SIZE = 10;

const planSlots = [
    { key: 'free-forever', title: 'Free', tierLevel: 'free', billingPeriod: 'forever' },
    { key: 'plus-monthly', title: 'Plus Monthly', tierLevel: 'plus', billingPeriod: 'monthly' },
    { key: 'plus-yearly', title: 'Plus Yearly', tierLevel: 'plus', billingPeriod: 'yearly' },
    { key: 'premium-yearly', title: 'Premium Yearly', tierLevel: 'premium', billingPeriod: 'yearly' }
];

const normalizeTier = (value) => (value || 'free').toString().trim().toLowerCase();
const normalizeBilling = (value) => (value || '').toString().trim().toLowerCase();

const MembershipPlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [savingPlanId, setSavingPlanId] = useState(null);
    const [priceDrafts, setPriceDrafts] = useState({});

    const [tierCounts, setTierCounts] = useState({ free: 0, plus: 0, premium: 0, total: 0 });
    const [loadingCounts, setLoadingCounts] = useState(true);

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [tierDraftByUser, setTierDraftByUser] = useState({});
    const [updatingUserId, setUpdatingUserId] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchTierCounts();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [usersPage, activeSearchQuery]);

    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const response = await apiService.getMembershipPlans();
            const plansData = response?.data || [];
            setPlans(Array.isArray(plansData) ? plansData : []);

            const initialDrafts = {};
            (Array.isArray(plansData) ? plansData : []).forEach((plan) => {
                initialDrafts[plan.planId] = Number(plan.price ?? 0).toFixed(2);
            });
            setPriceDrafts(initialDrafts);
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        } finally {
            setLoadingPlans(false);
        }
    };

    const fetchTierCounts = async () => {
        try {
            setLoadingCounts(true);
            const response = await apiService.getUserTierCounts();
            const counts = response?.data || {};
            setTierCounts({
                free: Number(counts.free || 0),
                plus: Number(counts.plus || 0),
                premium: Number(counts.premium || 0),
                total: Number(counts.total || 0)
            });
        } catch (error) {
            console.error('Error fetching tier counts:', error);
        } finally {
            setLoadingCounts(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await apiService.getUsers({
                search: activeSearchQuery,
                page: usersPage,
                pageSize: PAGE_SIZE
            });

            const payload = response?.data || {};
            const userItems = payload.items || [];
            const total = Number(payload.total || 0);

            setUsers(Array.isArray(userItems) ? userItems : []);
            setUsersTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));

            setTierDraftByUser((prev) => {
                const next = { ...prev };
                userItems.forEach((u) => {
                    if (!next[u.userId]) {
                        next[u.userId] = normalizeTier(u.tierLevel);
                    }
                });
                return next;
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            setUsersTotalPages(1);
        } finally {
            setLoadingUsers(false);
        }
    };

    const planRows = useMemo(() => {
        return planSlots.map((slot) => {
            const matchedPlan = plans.find((plan) => {
                const tier = normalizeTier(plan.tierLevel);
                const billing = normalizeBilling(plan.billingPeriod);

                if (slot.tierLevel === 'free') {
                    return tier === 'free';
                }

                return tier === slot.tierLevel && billing === slot.billingPeriod;
            });

            return {
                ...slot,
                plan: matchedPlan || null
            };
        });
    }, [plans]);

    const handlePlanPriceSave = async (plan) => {
        const draftValue = priceDrafts[plan.planId];
        const parsedPrice = Number(draftValue);

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            return;
        }

        try {
            setSavingPlanId(plan.planId);
            await apiService.updateMembershipPlanPrice(plan.planId, parsedPrice);
            await fetchPlans();
        } catch (error) {
            console.error('Error updating plan price:', error);
        } finally {
            setSavingPlanId(null);
        }
    };

    const handleTierUpdate = async (userId) => {
        const selectedTier = normalizeTier(tierDraftByUser[userId]);

        if (!selectedTier) {
            return;
        }

        try {
            setUpdatingUserId(userId);
            await apiService.updateUserTierLevel(userId, selectedTier);
            await Promise.all([fetchUsers(), fetchTierCounts()]);
        } catch (error) {
            console.error('Error updating tier level:', error);
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <AdminLayout>
            <Box>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', mb: 1 }}>
                        Membership Plans
                    </Typography>
                    <Typography variant="body2" color="#666" fontWeight="500">
                        Manage plan pricing, monitor tier distribution, and manually update user tier levels.
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    mb: 4
                }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Free Members
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#334155' }}>
                            {loadingCounts ? '-' : tierCounts.free}
                        </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #dbeafe', bgcolor: '#eff6ff' }}>
                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                            Plus Members
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#2563eb' }}>
                            {loadingCounts ? '-' : tierCounts.plus}
                        </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #fce7f3', bgcolor: '#fdf2f8' }}>
                        <Typography variant="caption" sx={{ color: '#9d174d', fontWeight: 700, textTransform: 'uppercase' }}>
                            Premium Members
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#db2777' }}>
                            {loadingCounts ? '-' : tierCounts.premium}
                        </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #e9d5ff', bgcolor: '#faf5ff' }}>
                        <Typography variant="caption" sx={{ color: '#7e22ce', fontWeight: 700, textTransform: 'uppercase' }}>
                            Total Users
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ color: '#9333ea' }}>
                            {loadingCounts ? '-' : tierCounts.total}
                        </Typography>
                    </Paper>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf2f7', mb: 4 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ color: '#1a1a1a', mb: 2 }}>
                        Subscription Plans Table
                    </Typography>

                    {loadingPlans ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress sx={{ color: '#a855f7' }} />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #edf2f7' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Plan
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Tier
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Billing
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Price
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {planRows.map((row) => {
                                        const plan = row.plan;
                                        const disabled = !plan;
                                        const isSaving = savingPlanId === plan?.planId;

                                        return (
                                            <TableRow key={row.key} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="600">{row.title}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={row.tierLevel}
                                                        sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {row.billingPeriod}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ width: 220 }}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        inputProps={{ min: 0, step: '0.01' }}
                                                        value={plan ? (priceDrafts[plan.planId] ?? '') : ''}
                                                        onChange={(e) => {
                                                            if (!plan) return;
                                                            const value = e.target.value;
                                                            setPriceDrafts((prev) => ({ ...prev, [plan.planId]: value }));
                                                        }}
                                                        disabled={disabled || isSaving}
                                                        sx={{ width: '100%' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        disabled={disabled || isSaving}
                                                        onClick={() => plan && handlePlanPriceSave(plan)}
                                                        sx={{
                                                            borderRadius: '10px',
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            bgcolor: '#a855f7',
                                                            '&:hover': { bgcolor: '#9333ea' }
                                                        }}
                                                    >
                                                        {isSaving ? 'Saving...' : 'Save Price'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf2f7' }}>
                    <Box sx={{
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', md: 'center' },
                        gap: 2,
                        flexDirection: { xs: 'column', md: 'row' }
                    }}>
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#1a1a1a' }}>
                                User Tier Management
                            </Typography>
                            <Typography variant="body2" color="#6b7280">
                                Upgrade or downgrade member tier levels manually.
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField
                                size="small"
                                placeholder="Search users by name or email"
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setUsersPage(1);
                                        setActiveSearchQuery(userSearchQuery.trim());
                                    }
                                }}
                                sx={{ minWidth: { xs: '100%', md: 280 } }}
                            />
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setUsersPage(1);
                                    setActiveSearchQuery(userSearchQuery.trim());
                                }}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: '#a855f7',
                                    '&:hover': { bgcolor: '#9333ea' }
                                }}
                            >
                                Search
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #edf2f7' }}>
                        {loadingUsers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress sx={{ color: '#a855f7' }} />
                            </Box>
                        ) : users.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography color="#6b7280">No users found</Typography>
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
                                                Current Tier
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                                New Tier
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((user) => {
                                            const currentTier = normalizeTier(user.tierLevel);
                                            const selectedTier = normalizeTier(tierDraftByUser[user.userId] || currentTier);
                                            const changed = selectedTier !== currentTier;
                                            const isUpdating = updatingUserId === user.userId;

                                            return (
                                                <TableRow key={user.userId} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                                                                {user.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                                {user.email}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={currentTier}
                                                            sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ width: 190 }}>
                                                        <Select
                                                            size="small"
                                                            fullWidth
                                                            value={selectedTier}
                                                            onChange={(e) => {
                                                                const value = normalizeTier(e.target.value);
                                                                setTierDraftByUser((prev) => ({ ...prev, [user.userId]: value }));
                                                            }}
                                                        >
                                                            <MenuItem value="free">Free</MenuItem>
                                                            <MenuItem value="plus">Plus</MenuItem>
                                                            <MenuItem value="premium">Premium</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            disabled={!changed || isUpdating}
                                                            onClick={() => handleTierUpdate(user.userId)}
                                                            sx={{
                                                                borderRadius: '10px',
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                bgcolor: '#2563eb',
                                                                '&:hover': { bgcolor: '#1d4ed8' }
                                                            }}
                                                        >
                                                            {isUpdating ? 'Updating...' : 'Update Tier'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {usersTotalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                        <Pagination
                                            count={usersTotalPages}
                                            page={usersPage}
                                            onChange={(_, page) => setUsersPage(page)}
                                            color="primary"
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </TableContainer>
                </Paper>
            </Box>
        </AdminLayout>
    );
};

export default MembershipPlansPage;
