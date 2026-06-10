import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CircularProgress,
    Button,
    Modal
} from '@mui/material';
import {
    Heart,
    PawPrint,
    MapPin,
    TrendingUp,
    CheckCircle,
    CloudRain,
    Sun,
    Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';

// Constants
const userId = "95c35506-b5fd-45c2-8689-00030ba0a8f2";
const dogId = "3D695674-82F0-475A-B065-A33C9CB34426";
const API_BASE = "http://localhost:5182";

// Deep comparison utility
const deepEqual = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const WearablesPage = () => {
    // State
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [baseline, setBaseline] = useState(null);
    const [vitalsCount, setVitalsCount] = useState(0); // Track actual vitals count
    const [stressStatus, setStressStatus] = useState(null);
    const [syncScore, setSyncScore] = useState(null);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [dogVitals, setDogVitals] = useState(null);
    const [weather, setWeather] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [dismissedAlertId, setDismissedAlertId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
    
    // Refs for previous values to prevent unnecessary re-renders
    const prevDataRef = useRef({
        baseline: null,
        vitalsCount: 0,
        stressStatus: null,
        syncScore: null,
        recentAlerts: null,
        dogVitals: null,
        activeAlert: null
    });

    // Silent background fetch with deep comparison to prevent re-renders
    const fetchData = async (isBackground = false) => {
        try {
            // Fetch baseline
            const baselineRes = await fetch(`${API_BASE}/api/baseline/${userId}`);
            const baselineData = await baselineRes.json();
            const newBaseline = baselineData.success ? baselineData.data : null;
            
            if (!deepEqual(prevDataRef.current.baseline, newBaseline)) {
                setBaseline(newBaseline);
                prevDataRef.current.baseline = newBaseline;
            }

            // Fetch vitals count for progress tracking (when no baseline exists)
            if (!newBaseline || !newBaseline.humanBaselineEstablished) {
                try {
                    // Fetch all vitals and filter by last 15 minutes
                    const vitalsRes = await fetch(`${API_BASE}/api/vitals/human/latest/${userId}`);
                    const vitalsData = await vitalsRes.json();
                    
                    if (vitalsData.success && vitalsData.data) {
                        const count = vitalsData.data.length;
                        console.log(`✓ Vitals count: ${count} total records`);
                        
                        if (prevDataRef.current.vitalsCount !== count) {
                            setVitalsCount(count);
                            prevDataRef.current.vitalsCount = count;
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch vitals count:', e);
                }
            }

            // Fetch stress status
            const stressRes = await fetch(`${API_BASE}/api/stress/check/${userId}`);
            const stressData = await stressRes.json();
            const newStress = stressData.success ? stressData.data : null;
            
            if (!deepEqual(prevDataRef.current.stressStatus, newStress)) {
                setStressStatus(newStress);
                prevDataRef.current.stressStatus = newStress;
            }

            // Fetch sync score
            const syncRes = await fetch(`${API_BASE}/api/bondsync/score/${userId}/${dogId}`);
            const syncData = await syncRes.json();
            const newSync = syncData.success ? syncData.data : null;
            
            if (!deepEqual(prevDataRef.current.syncScore, newSync)) {
                setSyncScore(newSync);
                prevDataRef.current.syncScore = newSync;
            }

            // Fetch alerts
            const alertsRes = await fetch(`${API_BASE}/api/alerts/recent/${userId}`);
            const alertsData = await alertsRes.json();
            const newAlerts = alertsData.data || [];
            
            if (!deepEqual(prevDataRef.current.recentAlerts, newAlerts)) {
                setRecentAlerts(newAlerts);
                prevDataRef.current.recentAlerts = newAlerts;
            }

            // Continuous stress monitoring: Auto-generate alert if stressed
            if (baseline?.humanBaselineEstablished) {
                try {
                    const generateRes = await fetch(`${API_BASE}/api/alerts/generate/${userId}/${dogId}`, {
                        method: 'POST'
                    });
                    
                    if (generateRes.ok) {
                        const generateData = await generateRes.json();
                        
                        console.log('Alert generation check:', generateData);
                        
                        // Check if new alert was created (stress detected)
                        if (generateData.data) {
                            console.log('✓ Stress detected - alert created');
                            // Refetch alerts to include new one
                            const refreshAlertsRes = await fetch(`${API_BASE}/api/alerts/recent/${userId}`);
                            const refreshAlertsData = await refreshAlertsRes.json();
                            const refreshedAlerts = refreshAlertsData.data || [];
                            
                            if (!deepEqual(recentAlerts, refreshedAlerts)) {
                                setRecentAlerts(refreshedAlerts);
                                prevDataRef.current.recentAlerts = refreshedAlerts;
                            }
                        } else {
                            // No stress detected - check CURRENT alerts (newAlerts) for active alerts
                            const activeAlertsInDb = newAlerts.filter(a => !a.outcome);
                            
                            console.log('No stress detected. Active alerts in DB:', activeAlertsInDb.length);
                            
                            if (activeAlertsInDb.length > 0) {
                                console.log('→ Auto-resolving alerts:', activeAlertsInDb.map(a => a.id));
                                // Mark all active alerts as resolved automatically
                                try {
                                    await Promise.all(activeAlertsInDb.map(alert => 
                                        fetch(`${API_BASE}/api/alerts/outcome/${alert.id}`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                outcome: 'recovered'
                                            })
                                        }).then(res => res.json())
                                    ));
                                    
                                    // Refetch alerts to update UI
                                    const refreshAlertsRes = await fetch(`${API_BASE}/api/alerts/recent/${userId}`);
                                    const refreshAlertsData = await refreshAlertsRes.json();
                                    const refreshedAlerts = refreshAlertsData.data || [];
                                    
                                    setRecentAlerts(refreshedAlerts);
                                    prevDataRef.current.recentAlerts = refreshedAlerts;
                                    
                                    console.log('✓ Alerts auto-resolved: User vitals returned to normal');
                                } catch (err) {
                                    console.error('Failed to mark alerts as resolved:', err);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to check for stress alerts:', e);
                }
            }

            // Fetch weather
            try {
                // If this is a foreground load (not background polling), aggressively fetch the exact high-accuracy GPS coordinates again.
                if (!isBackground || !prevDataRef.current.lat) {
                    try {
                        if ("geolocation" in navigator) {
                            const pos = await new Promise((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject, { 
                                    enableHighAccuracy: true, 
                                    timeout: 10000,
                                    maximumAge: 0
                                });
                            });
                            prevDataRef.current.lat = pos.coords.latitude;
                            prevDataRef.current.lon = pos.coords.longitude;
                            if (!isBackground) console.log("✓ Exact High-Accuracy GPS Location active!");
                        } else { throw new Error("No Geo"); }
                    } catch (err) {
                        if (!isBackground) {
                            console.warn("⚠️ Browser Location permission missing or blocked! Falling back to IP-based location. NOTE: Your ISP might route your IP address to a regional hub (like Patna instead of Ranchi). Please ALLOW Location Access (the map pin icon in your URL bar) to see your exact location.");
                        }
                        // Fallback to highly reliable open IP-based location
                        try {
                            const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                            const geoData = await geoRes.json();
                            if (geoData.latitude && geoData.longitude) {
                                prevDataRef.current.lat = parseFloat(geoData.latitude);
                                prevDataRef.current.lon = parseFloat(geoData.longitude);
                            } else { throw new Error("No IP Geo"); }
                        } catch (e) {
                            // Failsafe to Ranchi natively for this specific deployment trace
                            prevDataRef.current.lat = 23.3441;
                            prevDataRef.current.lon = 85.3096;
                        }
                    }
                }

                const lat = prevDataRef.current.lat;
                const lon = prevDataRef.current.lon;

                const weatherRes = await fetch(
                    `${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}`
                );
                const weatherData = await weatherRes.json();
                if (weatherData.success && weatherData.data) {
                    setWeather(weatherData.data);
                    if (!isBackground) {
                        console.log(`✓ Weather pulled successfully for: ${weatherData.data.locationName} (${lat}, ${lon})`);
                    }
                }
            } catch (e) {
                console.error('Weather fetch failed:', e);
            }

            // Fetch dog vitals
            const dogRes = await fetch(`${API_BASE}/api/vitals/dog/latest/${dogId}`);
            const dogData = await dogRes.json();
            const newDog = dogData.success ? dogData.data : null;
            
            if (!deepEqual(prevDataRef.current.dogVitals, newDog)) {
                setDogVitals(newDog);
                prevDataRef.current.dogVitals = newDog;
            }

            setLastUpdated(Date.now());
            if (isFirstLoad) setIsFirstLoad(false);
            
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isFirstLoad) setIsFirstLoad(false);
        }
    };

    // Initial load and background polling
    useEffect(() => {
        fetchData(false);
        
        // Fast polling during onboarding (10s), normal polling after baseline (30s)
        const pollInterval = (!baseline || !baseline.humanBaselineEstablished) ? 10000 : 30000;
        
        const interval = setInterval(() => {
            fetchData(true); // Background fetch
        }, pollInterval);
        
        return () => clearInterval(interval);
    }, [baseline?.humanBaselineEstablished]);

    // Track activeAlert changes for recovery detection (must be before conditional return)
    useEffect(() => {
        const activeAlert = recentAlerts.find(a => !a.outcome);
        prevDataRef.current.activeAlert = activeAlert;
    }, [recentAlerts]);

    // Create baseline
    const handleCreateBaseline = async () => {
        setIsCreatingBaseline(true);
        try {
            await fetch(`${API_BASE}/api/baseline/calculate/${userId}?mode=test`, {
                method: 'POST'
            });
            await fetchData(false);
        } catch (err) {
            console.error('Failed to create baseline:', err);
        }
        setIsCreatingBaseline(false);
    };

    // Recalibrate baseline
    const handleRecalibrate = async () => {
        try {
            await fetch(`${API_BASE}/api/baseline/reset/${userId}`, {
                method: 'POST'
            });
            await fetchData(false);
            setShowConfirmModal(false);
        } catch (err) {
            console.error('Failed to reset baseline:', err);
        }
    };

    // Time since last update
    const secondsSinceUpdate = Math.floor((Date.now() - lastUpdated) / 1000);

    // Get sensitivity pill data
    const getSensitivityPill = () => {
        if (!baseline) return { color: '#9ca3af', text: 'Loading...' };
        
        // Use actual vitals count if baseline not established
        const records = baseline.humanBaselineEstablished 
            ? (baseline.daysOfDataCollected || 0)
            : vitalsCount;
        const isTestMode = baseline.isTestMode ?? true; // Default to test mode for development
        
        if (isTestMode) {
            if (records < 10) return { color: '#9ca3af', text: `${records} of 10 records — Collecting data` };
            return { color: '#22c55e', text: 'Ready to create baseline' };
        }
        
        // Production mode (7 days)
        if (records < 3) return { color: '#9ca3af', text: `Day ${records} of 7 — Baseline in progress` };
        if (records <= 4) return { color: '#f59e0b', text: 'Early detection active' };
        if (records <= 6) return { color: '#3b82f6', text: 'Building baseline' };
        return { color: '#22c55e', text: 'Full sensitivity active' };
    };

    // Get weather icon
    const getWeatherIcon = () => {
        if (!weather) return <Cloud size={20} />;
        const condition = weather.weather?.[0]?.main?.toLowerCase();
        if (condition?.includes('rain')) return <CloudRain size={20} />;
        if (condition?.includes('clear')) return <Sun size={20} />;
        return <Cloud size={20} />;
    };

    // Loading state (first load only)
    if (isFirstLoad) {
        return (
            <AdminLayout>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '60vh' 
                }}>
                    <CircularProgress size={50} sx={{ color: '#ec4899' }} />
                </Box>
            </AdminLayout>
        );
    }

    // STATE A: No baseline - onboarding view
    // Force test mode for development (change to false for production)
    const isTestMode = baseline?.isTestMode ?? true; // Default to test mode
    const requiredCount = isTestMode ? 10 : 7; // 10 records in 15 min (90 sec interval)
    const hasBaseline = baseline?.humanBaselineEstablished || false;
    
    if (!hasBaseline) {
        // Use actual vitals count for progress
        const records = vitalsCount;
        const sensitivity = getSensitivityPill();

        return (
            <AdminLayout>
                <Box sx={{ 
                    bgcolor: '#F8F9FA', 
                    minHeight: 'calc(100vh - 100px)', 
                    py: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card sx={{ 
                            maxWidth: 500, 
                            p: 5, 
                            borderRadius: '24px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                            textAlign: 'center'
                        }}>
                            {/* Paw Icon */}
                            <Box sx={{ 
                                mb: 3, 
                                display: 'flex', 
                                justifyContent: 'center' 
                            }}>
                                <Box sx={{
                                    p: 3,
                                    borderRadius: '50%',
                                    bgcolor: '#fce7f3',
                                    display: 'inline-block'
                                }}>
                                    <PawPrint size={48} color="#ec4899" />
                                </Box>
                            </Box>

                            <Typography variant="h5" fontWeight="800" sx={{ mb: 2, color: '#1e293b' }}>
                                Setting up your wellness profile
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                {baseline?.humanBaselineEstablished
                                    ? 'Your baseline is complete!'
                                    : records >= requiredCount 
                                    ? 'Ready to create baseline!'
                                    : `~${Math.ceil((requiredCount - records) * 1.5)} min remaining`}
                            </Typography>

                            {/* Progress Bar */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ 
                                    width: '100%', 
                                    height: 12, 
                                    bgcolor: '#e5e7eb', 
                                    borderRadius: 6,
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        width: `${baseline?.humanBaselineEstablished ? 100 : Math.min((records / requiredCount) * 95, 95)}%`,
                                        height: '100%',
                                        bgcolor: baseline?.humanBaselineEstablished 
                                            ? '#22c55e' 
                                            : records >= requiredCount 
                                            ? '#fbbf24' 
                                            : '#ec4899',
                                        borderRadius: 6,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </Box>
                            </Box>

                            {/* Sensitivity Pill */}
                            <Box sx={{ 
                                display: 'inline-block',
                                px: 3,
                                py: 1,
                                borderRadius: 5,
                                bgcolor: sensitivity.color,
                                color: 'white',
                                mb: 4,
                                fontWeight: 700,
                                fontSize: '14px'
                            }}>
                                {sensitivity.text}
                            </Box>

                            {weather?.temperatureCelsius > 30 && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: 3,
                                    bgcolor: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    mb: 3,
                                    mt: -2
                                }}>
                                    <Typography variant="caption" color="#ea580c" fontWeight="600">
                                        🌡️ High temp detected ({Math.round(weather.temperatureCelsius)}°C) 
                                        — Baseline will auto-adjust for heat
                                    </Typography>
                                </Box>
                            )}

                            {/* Button (when enough records collected) */}
                            {records >= requiredCount && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={isCreatingBaseline}
                                    onClick={handleCreateBaseline}
                                    sx={{
                                        bgcolor: '#ec4899',
                                        color: 'white',
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        fontSize: '16px',
                                        '&:hover': { bgcolor: '#db2777' },
                                        textTransform: 'none'
                                    }}
                                >
                                    {isCreatingBaseline ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Create My Baseline ✓'
                                    )}
                                </Button>
                            )}
                        </Card>
                    </motion.div>
                </Box>
            </AdminLayout>
        );
    }

    // STATE B: Main Dashboard
    const activeAlert = recentAlerts.find(a => !a.outcome);

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#F8F9FA', minHeight: 'calc(100vh - 100px)', py: 4 }}>
                <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
                    
                    {/* HEADER */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 4,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MapPin size={18} color="#6b7280" />
                            <Typography variant="body2" fontWeight="600" color="#6b7280">
                                {weather?.locationName || 'Loading location...'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#22c55e',
                                animation: 'pulse 2s infinite'
                            }} />
                            <Typography variant="body2" fontWeight="600" color="#6b7280">
                                Last updated {secondsSinceUpdate}s ago
                            </Typography>
                        </Box>

                        {weather && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getWeatherIcon()}
                                <Typography variant="body2" fontWeight="600" color="#6b7280">
                                    {Math.round(weather?.temperatureCelsius || 0)}°C • {weather?.condition || ''}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* SECTION 1: STATUS CARDS */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                        gap: 3,
                        mb: 3
                    }}>
                        {/* User Status */}
                        <Card sx={{ 
                            p: 3, 
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.3s ease'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="caption" color="#6b7280" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                                        You
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: activeAlert ? '#ef4444' : '#22c55e',
                                            ...(activeAlert && { 
                                                animation: 'pulse 2s infinite' 
                                            })
                                        }} />
                                        <Typography variant="h6" fontWeight="800">
                                            {activeAlert ? 'Stressed' : 'Calm'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="#6b7280" sx={{ mb: 0.5 }}>
                                        HRV: <strong>{activeAlert?.hrvAtAlert?.toFixed(1) || stressStatus?.currentHRV?.toFixed(1) || '0.0'} ms</strong>
                                    </Typography>
                                    <Typography variant="caption" color="#9ca3af">
                                        Baseline: {baseline?.avgHRV?.toFixed(1) || '—'} ms
                                    </Typography>
                                </Box>
                                <Heart size={32} color={activeAlert ? '#ef4444' : '#22c55e'} />
                            </Box>
                        </Card>

                        {/* Dog Status */}
                        <Card sx={{ 
                            p: 3, 
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.3s ease',
                            bgcolor: dogVitals?.state?.toLowerCase() === 'active' ? '#f0fdf4' : '#eff6ff'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="caption" color="#6b7280" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                                        Your Dog
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Typography variant="h6" fontWeight="800">
                                            {dogVitals?.state || 'Unknown'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="#6b7280" sx={{ mb: 0.5 }}>
                                        Activity: <strong>{dogVitals?.activityScore || '—'}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="#9ca3af">
                                        Distance: {dogVitals?.distanceMeters ? (
                                            <Box component="span" sx={{ 
                                                color: dogVitals.distanceMeters < 500 ? '#22c55e' : '#ef4444',
                                                fontWeight: 700
                                            }}>
                                                {dogVitals.distanceMeters < 500 ? 'Nearby' : 'Not nearby'}
                                            </Box>
                                        ) : '—'}
                                    </Typography>
                                </Box>
                                <PawPrint size={32} color={dogVitals?.state?.toLowerCase() === 'active' ? '#22c55e' : '#3b82f6'} />
                            </Box>
                        </Card>
                    </Box>

                    {/* SECTION 2: BOND SCORE */}
                    {syncScore && (
                        <Card sx={{ 
                            p: 4, 
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            mb: 3
                        }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    <Typography 
                                        variant="h1" 
                                        fontWeight="900" 
                                        sx={{ 
                                            fontSize: { xs: '3rem', md: '4rem' },
                                            color: syncScore.score >= 70 ? '#22c55e' : 
                                                   syncScore.score >= 50 ? '#3b82f6' : '#f59e0b',
                                            mb: 1,
                                            transition: 'color 0.3s ease'
                                        }}
                                    >
                                        {syncScore.score}
                                    </Typography>
                                </motion.div>
                                <Typography variant="body1" fontWeight="700" color="#6b7280">
                                    Bond Sync Score
                                </Typography>
                            </Box>

                            {/* Component Bars */}
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                gap: 3
                            }}>
                                {[
                                    { label: 'HRV Stability', value: syncScore.hrvStabilityScore },
                                    { label: 'Shared Activity', value: syncScore.sharedActivityScore },
                                    { label: 'Dog Calm', value: syncScore.dogCalmScore },
                                    { label: 'Sleep', value: syncScore.sleepQualityScore }
                                ].map((item, idx) => (
                                    <Box key={idx}>
                                        <Typography variant="caption" fontWeight="600" color="#6b7280" sx={{ mb: 1, display: 'block' }}>
                                            {item.label}
                                        </Typography>
                                        <Box sx={{ 
                                            width: '100%', 
                                            height: 8, 
                                            bgcolor: '#e5e7eb', 
                                            borderRadius: 4,
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{
                                                width: `${item.value}%`,
                                                height: '100%',
                                                bgcolor: item.value >= 70 ? '#22c55e' : 
                                                         item.value >= 50 ? '#3b82f6' : '#f59e0b',
                                                borderRadius: 4,
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </Box>
                                        <Typography variant="caption" fontWeight="700" sx={{ mt: 0.5, display: 'block' }}>
                                            {item.value}/100
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>
                    )}

                    {/* SECTION 3: WELLNESS STATUS CARD (Always visible) */}
                    <Card sx={{ 
                        p: 3, 
                        borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        mb: 3,
                        bgcolor: activeAlert ? '#fef2f2' : '#f0fdf4',
                        border: activeAlert ? '2px solid #fecaca' : '2px solid #86efac',
                        transition: 'all 0.3s ease'
                    }}>
                        <Typography variant="h6" fontWeight="800" color={activeAlert ? '#dc2626' : '#15803d'} sx={{ mb: 2 }}>
                            {activeAlert ? 'Wellness Alert' : 'All Good! ✓'}
                        </Typography>

                        {activeAlert ? (
                            <>
                                <Typography variant="body1" sx={{ mb: 3, color: '#1e293b' }}>
                                    {activeAlert.suggestion}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                    <Box sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 5,
                                        bgcolor: activeAlert.dogStateAtAlert?.toLowerCase() === 'active' ? '#22c55e' : '#8b5cf6',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}>
                                        Dog: {activeAlert.dogStateAtAlert || 'Unknown'}
                                    </Box>
                                    <Box sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 5,
                                        bgcolor: '#ef4444',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}>
                                        HRV: {activeAlert.hrvAtAlert?.toFixed(1)} ms
                                    </Box>
                                </Box>

                                <Typography variant="caption" color="#4b5563" sx={{ fontStyle: 'italic' }}>
                                    Monitoring your vitals... We'll let you know when you're back to normal.
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body1" sx={{ mb: 2, color: '#166534' }}>
                                    Your vitals are within normal range. Keep up the great work! 💚
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 5,
                                        bgcolor: '#22c55e',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}>
                                        HRV: {stressStatus?.currentHRV?.toFixed(1) || baseline?.avgHRV?.toFixed(1) || '—'} ms
                                    </Box>
                                    <Box sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 5,
                                        bgcolor: '#22c55e',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}>
                                        ✓ Normal
                                    </Box>
                                </Box>

                                <Typography variant="caption" color="#6b7280" sx={{ fontStyle: 'italic' }}>
                                    We're continuously monitoring your wellness. Stay calm and connected with your dog.
                                </Typography>
                            </>
                        )}
                    </Card>

                    {/* SECTION 4: BASELINE INFO */}
                    {baseline && (
                        <Card sx={{ 
                            p: 3, 
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            mb: 3
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="800">
                                    Your Baseline
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowConfirmModal(true)}
                                    sx={{
                                        borderColor: '#ec4899',
                                        color: '#ec4899',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        '&:hover': { borderColor: '#db2777', bgcolor: '#fce7f3' }
                                    }}
                                >
                                    Recalibrate Baseline
                                </Button>
                            </Box>

                            {weather?.temperatureCelsius > 30 && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: 3,
                                    bgcolor: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    mb: 2
                                }}>
                                    <Typography variant="caption" color="#ea580c" fontWeight="600">
                                        🌡️ {Math.round(weather.temperatureCelsius)}°C detected 
                                        — HR +{((weather.temperatureCelsius - 30) * 0.5).toFixed(1)} bpm 
                                        and HRV -{((weather.temperatureCelsius - 30) * 0.3).toFixed(1)} ms 
                                        adjustment applied to your baseline
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                gap: 2
                            }}>
                                <Box>
                                    <Typography variant="caption" color="#6b7280">Avg HR</Typography>
                                    <Typography variant="h6" fontWeight="800">{Math.round(baseline.avgHeartRate)} bpm</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="#6b7280">Avg HRV</Typography>
                                    <Typography variant="h6" fontWeight="800">{baseline.avgHRV.toFixed(1)} ms</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="#6b7280">Avg Steps</Typography>
                                    <Typography variant="h6" fontWeight="800">{Math.round(baseline.avgSteps).toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="#6b7280">Sleep Score</Typography>
                                    <Typography variant="h6" fontWeight="800">{Math.round(baseline.avgSleepScore)}</Typography>
                                </Box>
                            </Box>
                        </Card>
                    )}

                    {/* SECTION 5: WEEK VIEW */}
                    <Card sx={{ 
                        p: 3, 
                        borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                        <Typography variant="h6" fontWeight="800" sx={{ mb: 3 }}>
                            This Week
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                // Mock data - replace with actual weekly data from API
                                const colors = ['#22c55e', '#22c55e', '#f59e0b', '#22c55e', '#ef4444', '#22c55e', '#9ca3af'];
                                return (
                                    <Box key={idx} sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="#6b7280" sx={{ mb: 1, display: 'block' }}>
                                            {day}
                                        </Typography>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: colors[idx],
                                            mx: 'auto'
                                        }} />
                                    </Box>
                                );
                            })}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e' }} />
                                <Typography variant="caption" color="#6b7280">Calm</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                                <Typography variant="caption" color="#6b7280">Moderate</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                <Typography variant="caption" color="#6b7280">Stressed</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#9ca3af' }} />
                                <Typography variant="caption" color="#6b7280">No data</Typography>
                            </Box>
                        </Box>
                    </Card>

                </Box>
            </Box>

            {/* CONFIRMATION MODAL */}
            <Modal
                open={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: 400 },
                    bgcolor: 'white',
                    borderRadius: '16px',
                    boxShadow: 24,
                    p: 4
                }}>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>
                        Reset Baseline?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        This will reset your current baseline and start a new calibration period. Are you sure?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowConfirmModal(false)}
                            sx={{ textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleRecalibrate}
                            sx={{
                                bgcolor: '#ec4899',
                                '&:hover': { bgcolor: '#db2777' },
                                textTransform: 'none'
                            }}
                        >
                            Yes, Reset
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}
            </style>
        </AdminLayout>
    );
};

export default WearablesPage; 
