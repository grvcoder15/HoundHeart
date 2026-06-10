import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    TextField,
    FormControlLabel,
    Checkbox,
    CircularProgress
} from '@mui/material';
import {
    ShoppingBag,
    MessageSquare,
    Zap,
    CheckCircle2,
    Settings,
    Crown
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../services/apiService';

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [savingPlatform, setSavingPlatform] = useState(false);
    const [savingPricing, setSavingPricing] = useState(false);
    const [message, setMessage] = useState('');

    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [premiumUsers, setPremiumUsers] = useState(0);
    const [totalQueries, setTotalQueries] = useState(0);
    const [pendingQueries, setPendingQueries] = useState(0);
    const [totalWaitlist, setTotalWaitlist] = useState(0);
    const [waitlistStatus, setWaitlistStatus] = useState('Ready for launch');

    const [platformSettings, setPlatformSettings] = useState({
        maintenanceMode: false,
        allowNewRegistrations: true,
        enableSacredGuideSales: true
    });

    const [pricingSettings, setPricingSettings] = useState({
        premiumPlanPrice: '0.00',
        premiumPlusPlanPrice: '0.00',
        sacredGuidePrice: '0.00'
    });

    useEffect(() => {
        const fetchSettingsData = async () => {
            setLoading(true);
            setMessage('');

            const [subStatsRes, queriesRes, sacredRes, platformRes, pricingRes] = await Promise.allSettled([
                apiService.getSubscriptionStats(),
                apiService.getAllExpertQueries(),
                apiService.getSacredGuideDashboard(),
                apiService.getAdminPlatformSettings(),
                apiService.getAdminPricingSettings()
            ]);

            const unwrap = (res) => (res.status === 'fulfilled' ? (res.value?.data ?? null) : null);

            const subStats = unwrap(subStatsRes);
            if (subStats) {
                setMonthlyRevenue(Number(subStats.monthlyRecurringRevenue || 0));
                setPremiumUsers(Number(subStats.activeSubscriptions || 0));
            }

            const queries = unwrap(queriesRes);
            if (Array.isArray(queries)) {
                const total = queries.length;
                const pending = queries.filter(q => String(q.status || '').toLowerCase() === 'pending').length;
                setTotalQueries(total);
                setPendingQueries(pending);
            }

            const sacred = unwrap(sacredRes);
            if (sacred) {
                setTotalWaitlist(Number(sacred.totalWaitlist || 0));
                setWaitlistStatus(sacred.waitlistStatus || 'Ready for launch');
            }

            const platform = unwrap(platformRes);
            if (platform) {
                setPlatformSettings({
                    maintenanceMode: !!platform.maintenanceMode,
                    allowNewRegistrations: !!platform.allowNewRegistrations,
                    enableSacredGuideSales: !!platform.enableSacredGuideSales
                });
            }

            const pricing = unwrap(pricingRes);
            if (pricing) {
                setPricingSettings({
                    premiumPlanPrice: Number(pricing.premiumPlanPrice || 0).toFixed(2),
                    premiumPlusPlanPrice: Number(pricing.premiumPlusPlanPrice || 0).toFixed(2),
                    sacredGuidePrice: Number(pricing.sacredGuidePrice || 0).toFixed(2)
                });
            }

            setLoading(false);
        };

        fetchSettingsData();
    }, []);

    const stats = useMemo(() => ([
        {
            label: 'Monthly Revenue',
            value: `$${Number(monthlyRevenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            icon: <ShoppingBag size={20} />,
            color: '#10b981',
            sub: `${premiumUsers} premium users`
        },
        {
            label: 'Expert Queries',
            value: String(totalQueries),
            icon: <MessageSquare size={20} />,
            color: '#a855f7',
            sub: `${pendingQueries} pending review`
        },
        {
            label: 'Book Waitlist',
            value: String(totalWaitlist),
            icon: <Zap size={20} />,
            color: '#ec4899',
            sub: waitlistStatus || 'Ready for launch'
        },
    ]), [monthlyRevenue, premiumUsers, totalQueries, pendingQueries, totalWaitlist, waitlistStatus]);

    const handlePlatformToggle = (field) => (event) => {
        setPlatformSettings(prev => ({
            ...prev,
            [field]: event.target.checked
        }));
    };

    const handlePricingChange = (field) => (event) => {
        setPricingSettings(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSavePlatformSettings = async () => {
        try {
            setSavingPlatform(true);
            setMessage('');
            await apiService.updateAdminPlatformSettings({
                maintenanceMode: platformSettings.maintenanceMode,
                allowNewRegistrations: platformSettings.allowNewRegistrations,
                enableSacredGuideSales: platformSettings.enableSacredGuideSales
            });
            setMessage('Platform settings saved successfully.');
        } catch (error) {
            console.error('Failed to save platform settings:', error);
            setMessage('Failed to save platform settings.');
        } finally {
            setSavingPlatform(false);
        }
    };

    const handleUpdatePricing = async () => {
        const premiumPlanPrice = Number(pricingSettings.premiumPlanPrice);
        const premiumPlusPlanPrice = Number(pricingSettings.premiumPlusPlanPrice);
        const sacredGuidePrice = Number(pricingSettings.sacredGuidePrice);

        if ([premiumPlanPrice, premiumPlusPlanPrice, sacredGuidePrice].some(v => Number.isNaN(v) || v < 0)) {
            setMessage('Please enter valid non-negative prices.');
            return;
        }

        try {
            setSavingPricing(true);
            setMessage('');
            await apiService.updateAdminPricingSettings({
                premiumPlanPrice,
                premiumPlusPlanPrice,
                sacredGuidePrice
            });
            setPricingSettings({
                premiumPlanPrice: premiumPlanPrice.toFixed(2),
                premiumPlusPlanPrice: premiumPlusPlanPrice.toFixed(2),
                sacredGuidePrice: sacredGuidePrice.toFixed(2)
            });
            setMessage('Pricing settings updated successfully.');
        } catch (error) {
            console.error('Failed to update pricing settings:', error);
            setMessage('Failed to update pricing settings.');
        } finally {
            setSavingPricing(false);
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.03em', mb: 1 }}>
                    Settings
                </Typography>
                {message && (
                    <Typography variant="body2" sx={{ color: message.startsWith('Failed') ? '#ef4444' : '#16a34a', fontWeight: 700 }}>
                        {message}
                    </Typography>
                )}
            </Box>

            {loading ? (
                <Paper elevation={0} sx={{ p: 8, borderRadius: 5, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
                        Loading settings...
                    </Typography>
                </Paper>
            ) : (
                <>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 5,
                width: '100%'
            }}>
                {stats.map((stat, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: stat.color, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</Typography>
                            <Typography variant="h4" fontWeight="800" sx={{ my: 1 }}>{stat.value}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle2 size={12} /> {stat.sub}
                            </Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.2)', display: 'flex' }}>
                            {stat.icon}
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Grid container spacing={4} sx={{ width: '100%' }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <Settings size={20} color="#a855f7" />
                            <Typography variant="h6" fontWeight="800">Platform Settings</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="body2" fontWeight="700" mb={1}>Maintenance Mode</Typography>
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={platformSettings.maintenanceMode} onChange={handlePlatformToggle('maintenanceMode')} />}
                                    label={<Typography variant="caption" fontWeight="600" color="text.secondary">Enable maintenance mode</Typography>}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight="700" mb={1}>New Registrations</Typography>
                                <FormControlLabel
                                    control={<Checkbox checked={platformSettings.allowNewRegistrations} onChange={handlePlatformToggle('allowNewRegistrations')} size="small" sx={{ '&.Mui-checked': { color: '#000' } }} />}
                                    label={<Typography variant="caption" fontWeight="600" color="text.secondary">Allow new user registrations</Typography>}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight="700" mb={1}>Book Sales</Typography>
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={platformSettings.enableSacredGuideSales} onChange={handlePlatformToggle('enableSacredGuideSales')} />}
                                    label={<Typography variant="caption" fontWeight="600" color="text.secondary">Enable Sacred Guide sales</Typography>}
                                />
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSavePlatformSettings}
                                disabled={savingPlatform}
                                sx={{ mt: 2, bgcolor: '#a855f7', py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
                            >
                                {savingPlatform ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <Crown size={20} color="#d946ef" />
                            <Typography variant="h6" fontWeight="800">Pricing Settings</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="caption" fontWeight="700" color="text.secondary">Premium Plan Price</Typography>
                                <TextField fullWidth size="small" value={pricingSettings.premiumPlanPrice} onChange={handlePricingChange('premiumPlanPrice')} sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight="700" color="text.secondary">Premium+ Plan Price</Typography>
                                <TextField fullWidth size="small" value={pricingSettings.premiumPlusPlanPrice} onChange={handlePricingChange('premiumPlusPlanPrice')} sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight="700" color="text.secondary">Sacred Guide Price</Typography>
                                <TextField fullWidth size="small" value={pricingSettings.sacredGuidePrice} onChange={handlePricingChange('sacredGuidePrice')} sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }} />
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleUpdatePricing}
                                disabled={savingPricing}
                                sx={{ mt: 2, bgcolor: '#d946ef', py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#c026d3' } }}
                            >
                                {savingPricing ? 'Updating...' : 'Update Pricing'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
                </>
            )}
        </AdminLayout>
    );
};

export default SettingsPage;
