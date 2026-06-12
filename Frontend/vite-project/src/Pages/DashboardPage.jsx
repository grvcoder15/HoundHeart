import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import toast from '../services/toastService';

// Deep comparison utility (used for wellness live-data polling)
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── Wellness API Constant ─────────────
const WELLNESS_API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizeId = (id) => String(id ?? '').trim().toLowerCase();


// Activity Categories Map
const ACTIVITY_CATEGORIES = {
  // Physical
  'Morning Walk': 'Physical',
  'Mindful Walk': 'Physical',
  'Outdoor Adventure': 'Physical',
  'Playtime': 'Physical',
  'Grooming': 'Physical',
  'Feeding Time': 'Physical',
  'Belly Rubs': 'Physical',
  'Training Session': 'Physical',

  // Spiritual / Ritual
  'Chakra Sync': 'Spiritual',
  'Synchronized Breathing': 'Spiritual',
  'Meditation Together': 'Spiritual',
  'Bedtime Blessing': 'Spiritual',
  'Energy Check-in': 'Spiritual',

  // Emotional / Reflection
  'Gratitude Moment': 'Emotional',
  'Morning Intention Setting': 'Emotional',
  'Evening Reflection': 'Emotional'
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const userId = apiService.getCurrentUserId();
  const [isVisible, setIsVisible] = useState({});
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bondTab, setBondTab] = useState('checkins');
  const [progressTimeframe, setProgressTimeframe] = useState('this-week');

  // Handle cross-page actions (like opening change password from other pages)
  useEffect(() => {
    if (window.location.search.includes('action=change-password')) {
      handleOpenChangePassword();
      // Remove the query parameter so it doesn't reopen on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ─── Live Wellness API State (mirrored from AdminPanel WearablesPage) ──────
  const [wlBaseline, setWlBaseline] = useState(null);
  const [wlVitalsCount, setWlVitalsCount] = useState(0);
  const [wlStressStatus, setWlStressStatus] = useState(null);
  const [wlSyncScore, setWlSyncScore] = useState(null);
  const [wlRecentAlerts, setWlRecentAlerts] = useState([]);
  const [wlDogVitals, setWlDogVitals] = useState(null);
  const [wlWeather, setWlWeather] = useState(null);
  const [wlLastUpdated, setWlLastUpdated] = useState(Date.now());
  const [wlIsFirstLoad, setWlIsFirstLoad] = useState(true);
  const [wlIsDeviceConnected, setWlIsDeviceConnected] = useState(false);
  const [wlIsDogConnected, setWlIsDogConnected] = useState(false);
  const [wlIsCreatingBaseline, setWlIsCreatingBaseline] = useState(false);
  const [wlShowResetModal, setWlShowResetModal] = useState(false);
  const wlAutoBaselineAttemptRef = useRef(null);
  const wlAutoBaselineRetryAtRef = useRef(0);
  const wlPrevRef = useRef({
    baseline: null, vitalsCount: 0, stressStatus: null,
    syncScore: null, recentAlerts: null, dogVitals: null, activeAlert: null,
    lat: null, lon: null
  });

  const getBondLevelFromScore = (score) => {
    if (score >= 80) return 'Kindred Spirit 💜';
    if (score >= 50) return 'Deep Bond ❤️';
    if (score >= 20) return 'Growing Connection 🌱';
    return 'New Connection ✨';
  };

  // Fetch all live wellness data
  const fetchWellnessData = async (isBackground = false) => {
    try {
      const realUserId = apiService.getCurrentUserId();
      const realDogId = localStorage.getItem('dogId') || '00000000-0000-0000-0000-000000000000';
      if (!realUserId) { setWlIsFirstLoad(false); return; }

      let lat = wlPrevRef.current.lat;
      let lon = wlPrevRef.current.lon;

      // Resolve location once, then let the summary endpoint return weather with the rest of the dashboard state.
      try {
        if (!isBackground || !lat || !lon) {
          try {
            if ('geolocation' in navigator) {
              const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                });
              });
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
            } else {
              throw new Error('No geolocation support');
            }
          } catch (err) {
            try {
              const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
              const geoData = await geoRes.json();
              lat = geoData.latitude ? parseFloat(geoData.latitude) : 23.3441;
              lon = geoData.longitude ? parseFloat(geoData.longitude) : 85.3096;
            } catch {
              lat = 23.3441;
              lon = 85.3096;
            }
          }

          wlPrevRef.current.lat = lat;
          wlPrevRef.current.lon = lon;
        }
      } catch (e) { /* silent */ }

      const summaryResponse = await apiService.getDashboardWellnessSummary(realUserId, {
        dogId: realDogId,
        clientDate: new Date().toISOString(),
        lat,
        lon
      });

      const summary = summaryResponse?.data || {};
      const deviceSummary = summary.device || {};
      const newBaseline = summary.baseline || null;
      const newStress = summary.stressStatus || null;
      const newSync = summary.syncScore || null;
      const newAlerts = Array.isArray(summary.alerts) ? summary.alerts : [];
      const newDog = summary.dogVitals || null;
      const stats = summary.stats || {};
      const ritualConsistencyData = stats.ritualConsistency || { count: 0, total: 7 };
      const journalCount = stats?.journalEntries?.count ?? 0;
      const bond = summary.bond || {};
      const nextBondedScore = Math.round(bond.score ?? stats.bondedScore ?? 50);
      const nextBondLevel = bond.level || getBondLevelFromScore(nextBondedScore);
      const nextRitualDays = bond.ritualDays ?? ritualConsistencyData.count ?? 0;
      const nextVitalsCount = summary.vitalsCount || 0;

      setWlIsDeviceConnected(!!deviceSummary.isDeviceConnected);
      setWlIsDogConnected(
        !!deviceSummary.isDogConnected ||
        localStorage.getItem('fitbarkConnected') === 'true'
      );

      if (!deepEqual(wlPrevRef.current.baseline, newBaseline)) {
        setWlBaseline(newBaseline);
        wlPrevRef.current.baseline = newBaseline;
      }

      if (wlPrevRef.current.vitalsCount !== nextVitalsCount) {
        setWlVitalsCount(nextVitalsCount);
        wlPrevRef.current.vitalsCount = nextVitalsCount;
      }

      if (!deepEqual(wlPrevRef.current.stressStatus, newStress)) {
        setWlStressStatus(newStress);
        wlPrevRef.current.stressStatus = newStress;
      }

      if (!deepEqual(wlPrevRef.current.syncScore, newSync)) {
        setWlSyncScore(newSync);
        wlPrevRef.current.syncScore = newSync;
      }

      if (!deepEqual(wlPrevRef.current.recentAlerts, newAlerts)) {
        setWlRecentAlerts(newAlerts);
        wlPrevRef.current.recentAlerts = newAlerts;
      }

      setWeeklyProgress(stats.weeklyProgress || 0);
      setRitualConsistency(ritualConsistencyData);
      setJournalEntriesCount(journalCount);
      setBondedScore(nextBondedScore);
      setBondLevel(nextBondLevel);
      setRitualDays(nextRitualDays);
      setIsCheckInDoneToday(!!summary?.checkInStatus?.done);

      if (summary.weather) {
        setWlWeather(summary.weather);
      }

      if (!deepEqual(wlPrevRef.current.dogVitals, newDog)) {
        setWlDogVitals(newDog);
        wlPrevRef.current.dogVitals = newDog;
      }

      // Keep alert mutation separate from the summary GET, but only trigger it when state actually requires it.
      if (newBaseline?.humanBaselineEstablished) {
        try {
          const activeAlertsInDb = newAlerts.filter(a => !a.outcome);

          if (newStress?.isStressed && activeAlertsInDb.length === 0 && realDogId !== '00000000-0000-0000-0000-000000000000') {
            const generateRes = await fetch(`${WELLNESS_API_BASE}/api/alerts/generate/${realUserId}/${realDogId}`, {
              method: 'POST'
            });

            if (generateRes.ok) {
              const generateData = await generateRes.json();
              if (generateData.data) {
                await fetchWellnessData(false);
                return;
              }
            }
          } else if (!newStress?.isStressed && activeAlertsInDb.length > 0) {
            await Promise.all(activeAlertsInDb.map(alert =>
              fetch(`${WELLNESS_API_BASE}/api/alerts/outcome/${alert.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcome: 'recovered' })
              }).then(res => res.json())
            ));

            await fetchWellnessData(false);
            return;
          }
        } catch (e) {
          console.error('Failed to check for stress alerts:', e);
        }
      }

      setWlLastUpdated(Date.now());
      if (wlIsFirstLoad) setWlIsFirstLoad(false);

    } catch (err) {
      console.error('Data fetch error:', err);
      if (wlIsFirstLoad) setWlIsFirstLoad(false);
    }
  };

  // Initial load + background polling — EXACT copy of WearablesPage useEffect
  // Background polling runs globally regardless of active tab
  useEffect(() => {
    fetchWellnessData(false);
    // Pre-baseline: poll every 10s to detect when enough vitals are collected.
    // Post-baseline: poll every 5 minutes — FitBark syncs every 4 min and Fitbit every ~4 min,
    // so refreshing faster than 5 min returns the same data with no score change.
    const pollInterval = (!wlBaseline || !wlBaseline.humanBaselineEstablished) ? 10000 : 300000;
    const interval = setInterval(() => fetchWellnessData(true), pollInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wlBaseline?.humanBaselineEstablished]);

  // Auto-calculate baseline trigger when data threshold is met
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const isBaselineMissing = !wlBaseline || !wlBaseline.humanBaselineEstablished;
    const requiredCountForMode = (wlBaseline?.isTestMode ?? true) ? 6 : 7;
    const wUserId = apiService.getCurrentUserId();
    const attemptKey = wUserId ? `${wUserId}:${requiredCountForMode}:${wlVitalsCount}` : null;
    const nowMs = Date.now();

    if (!isBaselineMissing) {
      wlAutoBaselineAttemptRef.current = null;
      wlAutoBaselineRetryAtRef.current = 0;
      return;
    }

    if (wlVitalsCount < requiredCountForMode || !wlIsDeviceConnected) {
      wlAutoBaselineAttemptRef.current = null;
      wlAutoBaselineRetryAtRef.current = 0;
      return;
    }

    // Avoid rapid retry loops when backend returns "baseline not ready".
    if (wlAutoBaselineRetryAtRef.current > nowMs) {
      return;
    }

    if (!wUserId || wlIsCreatingBaseline || wlAutoBaselineAttemptRef.current === attemptKey) {
      return;
    }

    wlAutoBaselineAttemptRef.current = attemptKey;
    setWlIsCreatingBaseline(true);

    fetch(`${WELLNESS_API_BASE}/api/baseline/calculate/${wUserId}?mode=test`, { method: 'POST' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        const baselineCreated = payload?.data?.Success === true;

        if (!baselineCreated) {
          wlAutoBaselineAttemptRef.current = null;
          wlAutoBaselineRetryAtRef.current = Date.now() + 60000;
          const reason = payload?.data?.Error || payload?.message || 'Baseline not ready yet';
          console.warn('Auto baseline skipped:', reason);
        } else {
          wlAutoBaselineRetryAtRef.current = 0;
        }

        await fetchWellnessData(false);
      })
      .catch(err => {
        console.error('Failed to auto-create baseline:', err);
        wlAutoBaselineAttemptRef.current = null;
        wlAutoBaselineRetryAtRef.current = Date.now() + 60000;
      })
      .finally(() => setWlIsCreatingBaseline(false));
  }, [wlVitalsCount, wlBaseline?.humanBaselineEstablished, wlBaseline?.isTestMode, wlIsDeviceConnected]);

  // Track activeAlert changes
  useEffect(() => {
    wlPrevRef.current.activeAlert = wlRecentAlerts.find(a => !a.outcome);
  }, [wlRecentAlerts]);

  // Create baseline handler
  const handleWlCreateBaseline = async () => {
    const wUserId = apiService.getCurrentUserId();
    if (!wUserId) return;
    wlAutoBaselineAttemptRef.current = null;
    wlAutoBaselineRetryAtRef.current = 0;
    setWlIsCreatingBaseline(true);
    try {
      const response = await fetch(`${WELLNESS_API_BASE}/api/baseline/calculate/${wUserId}?mode=test`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (payload?.data?.Success === false) {
        const reason = payload?.data?.Error || 'Baseline could not be created yet';
        toast.error(reason);
        throw new Error(reason);
      }
      await fetchWellnessData(false);
    } catch (err) { console.error('Failed to create baseline:', err); }
    setWlIsCreatingBaseline(false);
  };

  // Reset baseline handler
  const handleWlResetBaseline = async () => {
    const wUserId = apiService.getCurrentUserId();
    if (!wUserId) return;
    try {
      wlAutoBaselineAttemptRef.current = null;
      await fetch(`${WELLNESS_API_BASE}/api/baseline/reset/${wUserId}`, { method: 'POST' });
      await fetchWellnessData(false);
      setWlShowResetModal(false);
    } catch (err) { console.error('Failed to reset baseline:', err); }
  };

  // Seconds since last wellness update
  const wlSecondsSince = Math.floor((Date.now() - wlLastUpdated) / 1000);

  // Resolve live wellness data: prefer real API data, fall back to simulated
  const wlHasBaseline = wlBaseline?.humanBaselineEstablished || false;
  const wlActiveAlert = wlRecentAlerts.find(a => !a.outcome);
  const wlIsTestMode = wlBaseline?.isTestMode ?? true;
  const wlRequiredCount = wlIsTestMode ? 6 : 7;

  const [selectedHistoricalDate, setSelectedHistoricalDate] = useState(null);
  const [calendarScoresMap, setCalendarScoresMap] = useState({});
  const [calendarDateDetail, setCalendarDateDetail] = useState(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingDateDetail, setIsLoadingDateDetail] = useState(false);
  const [isBackfillingCalendar, setIsBackfillingCalendar] = useState(false);

  // Fetch per-date SyncScore from HumanDailySummaries (last 30 days) — fills calendar dots
  const fetchCalendarScores = async () => {
    if (!userId) return;
    setIsLoadingCalendar(true);
    try {
      const authHeaders = await apiService.getAuthHeaders('/calendar/data');
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const res = await fetch(
        `${WELLNESS_API_BASE}/api/calendar/data/${userId}?startDate=${formatLocalDate(start)}&endDate=${formatLocalDate(end)}`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const json = await res.json();
        const map = {};
        (json.data || []).forEach(d => {
          const key = d.date?.split('T')[0];
          if (key) map[key] = d.score ?? null;
        });
        setCalendarScoresMap(map);
      }
    } catch (e) { console.error('Calendar scores fetch failed:', e); }
    finally { setIsLoadingCalendar(false); }
  };

  // Fetch full detail for a clicked date — reads from HumanDailySummaries (or HumanVitals for today)
  const fetchDateDetail = async (dateStr) => {
    if (!userId || !dateStr) return;
    setIsLoadingDateDetail(true);
    setCalendarDateDetail(null);
    try {
      const authHeaders = await apiService.getAuthHeaders('/calendar/score-details');
      const res = await fetch(
        `${WELLNESS_API_BASE}/api/calendar/score-details/${userId}/${dateStr}`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const json = await res.json();
        setCalendarDateDetail(json.data || null);
      } else {
        setCalendarDateDetail(null);
      }
    } catch (e) { console.error('Date detail fetch failed:', e); setCalendarDateDetail(null); }
    finally { setIsLoadingDateDetail(false); }
  };

  const backfillLast30DaysSummaries = async () => {
    if (!userId || isBackfillingCalendar) return;
    setIsBackfillingCalendar(true);

    try {
      const authHeaders = await apiService.getAuthHeaders('/calendar/generate-summary');
      const today = new Date();
      let successCount = 0;
      const failedDates = [];

      for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
        const target = new Date(today);
        target.setDate(today.getDate() - dayOffset);
        const dateStr = formatLocalDate(target);

        try {
          const res = await fetch(
            `${WELLNESS_API_BASE}/api/calendar/generate-summary/${dateStr}`,
            { method: 'POST', headers: authHeaders }
          );

          if (res.ok) {
            successCount += 1;
          } else {
            failedDates.push(dateStr);
          }
        } catch {
          failedDates.push(dateStr);
        }
      }

      await fetchCalendarScores();
      if (selectedHistoricalDate) {
        await fetchDateDetail(selectedHistoricalDate);
      }

      if (failedDates.length === 0) {
        toast.success(`Calendar backfill complete (${successCount}/30 days).`);
      } else {
        toast.info(`Calendar backfill partial: ${successCount}/30 days. Failed: ${failedDates.length}.`);
      }
    } catch (e) {
      console.error('Calendar backfill failed:', e);
      toast.error('Failed to backfill calendar data. Please try again.');
    } finally {
      setIsBackfillingCalendar(false);
    }
  };

  // Reload calendar scores when wellness tab is opened
  useEffect(() => {
    if (activeTab === 'wellness') fetchCalendarScores();
  }, [activeTab, userId]);

  // historicalScoresMap now points to real API data (SyncScore per date)
  const historicalScoresMap = calendarScoresMap;

  const getHistoricalWellnessData = (score) => {
    if(!score) return { status: 'No Data', hrv: '--', bondSync: '--', hrvStability: 0, sharedActivity: 0, dogCalm: 0, sleep: 0 };
    if(score >= 70) return { status: 'Calm', hrv: parseFloat((48 + score*0.1).toFixed(1)), bondSync: score, hrvStability: Math.min(100, score+5), sharedActivity: Math.min(100, score+2), dogCalm: Math.max(0, score-10), sleep: Math.min(100, score+3) };
    if(score >= 50) return { status: 'Moderate', hrv: parseFloat((35 + score*0.15).toFixed(1)), bondSync: score, hrvStability: score, sharedActivity: Math.min(100, score+5), dogCalm: Math.max(0, score-5), sleep: Math.max(0, score-2) };
    return { status: 'Stressed', hrv: parseFloat((25 + score*0.2).toFixed(1)), bondSync: score, hrvStability: Math.max(0, score-5), sharedActivity: Math.min(100, score+10), dogCalm: Math.max(0, score-15), sleep: Math.max(0, score-10) };
  };

  const liveWellnessData = wlSyncScore
    ? {
        hrv: wlSyncScore.humanHRV ?? wlStressStatus?.currentHRV ?? '--',
        status: wlSyncScore.humanStatus?.label ?? (wlSyncScore.score >= 70 ? 'Calm' : wlSyncScore.score >= 45 ? 'Moderate' : 'Stressed'),
        bondSync: wlSyncScore.score,
        hrvStability: wlSyncScore.hrvStabilityScore ?? 0,
        sharedActivity: wlSyncScore.sharedActivityScore ?? 0,
        dogCalm: wlSyncScore.dogCalmScore ?? 0,
        sleep: wlSyncScore.sleepQualityScore ?? 0,
        humanScore: wlSyncScore.humanHealthScore ?? null,
        humanSummary: wlSyncScore.humanStatus?.summary ?? '',
        dogStatus: wlSyncScore.dogStatus?.label ?? 'Unknown',
        dogScore: wlSyncScore.dogHealthScore ?? null,
        dogSummary: wlSyncScore.dogStatus?.summary ?? '',
      }
    : { hrv: '--', status: 'No Data', bondSync: null, hrvStability: 0, sharedActivity: 0, dogCalm: 0, sleep: 0, humanScore: null, humanSummary: '', dogStatus: 'Unknown', dogScore: null, dogSummary: '' };
  const wellnessData = selectedHistoricalDate
    ? getHistoricalWellnessData(historicalScoresMap[selectedHistoricalDate])
    : liveWellnessData;

  const getScoreColor = (score) => score >= 65 ? 'text-green-500' : score >= 45 ? 'text-orange-400' : 'text-red-500';
  const getBarColor = (score) => score >= 65 ? 'bg-green-500' : score >= 45 ? 'bg-orange-400' : 'bg-red-500';
  const getStatusDot = (status) => status === 'Calm' ? 'bg-green-500' : status === 'Moderate' ? 'bg-orange-400' : status === 'No Data' ? 'bg-gray-300' : 'bg-red-500';
  const getStatusTextColor = (status) => status === 'Calm' ? 'text-green-700' : status === 'Moderate' ? 'text-orange-500' : 'text-red-600';
  const isStressed = wellnessData.status === 'Stressed';
  const isModerate = wellnessData.status === 'Moderate';
  const formatLastUpdated = (s) => s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;

  // Baseline State
  const [baselineData, setBaselineData] = useState({ hr: 72, hrv: 48.4, steps: 566, sleep: 83 });
  const [showRecalibrateConfirm, setShowRecalibrateConfirm] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [recalibrateProgress, setRecalibrateProgress] = useState(0);

  const handleStartRecalibrate = () => {
    setShowRecalibrateConfirm(false);
    setIsRecalibrating(true);
    setRecalibrateProgress(0);
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += 1;
      setRecalibrateProgress(Math.round((elapsed / 30) * 100));
      if (elapsed >= 30) {
        clearInterval(timer);
        // Generate new random baseline values
        setBaselineData({
          hr: Math.floor(Math.random() * 15) + 65,           // 65–80 bpm
          hrv: parseFloat((Math.random() * 20 + 38).toFixed(1)), // 38–58 ms
          steps: Math.floor(Math.random() * 400) + 450,      // 450–850
          sleep: Math.floor(Math.random() * 20) + 72,        // 72–92
        });
        setIsRecalibrating(false);
        setRecalibrateProgress(0);
      }
    }, 1000);
  };
  const [showRitualView, setShowRitualView] = useState(false);
  const [showProgressView, setShowProgressView] = useState(false);
  const [currentChakraStep, setCurrentChakraStep] = useState(1);
  const [selectedBreathingPattern, setSelectedBreathingPattern] = useState('4-7-8');
  const [showBreathingDropdown, setShowBreathingDropdown] = useState(false);
  const [selectedTargetCycles, setSelectedTargetCycles] = useState('10');
  const [showTargetCyclesDropdown, setShowTargetCyclesDropdown] = useState(false);
  const [userEnergy, setUserEnergy] = useState(7);
  const [dogEnergy, setDogEnergy] = useState(8);
  const [energyAlignment, setEnergyAlignment] = useState(6);
  const [hoursTogether, setHoursTogether] = useState(4);
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [checkInItems, setCheckInItems] = useState([]);
  const [ratingsById, setRatingsById] = useState({});

  const [bondingActivities, setBondingActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [completedActivityIds, setCompletedActivityIds] = useState(new Set());
  const [isSavingActivities, setIsSavingActivities] = useState(false);

  // Reflection Modal State
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [activeReflectionActivity, setActiveReflectionActivity] = useState(null);
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // User data state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    dogName: '',
    initials: ''
  });

  // Dog profile photo state
  const [dogProfilePhoto, setDogProfilePhoto] = useState('');

  // Bonded Score state
  const [bondedScore, setBondedScore] = useState(50); // Start with base 50
  const [bondLevel, setBondLevel] = useState('New Connection ✨');
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Daily Rituals State
  const [rituals, setRituals] = useState([]);
  const [dailyBonusEarned, setDailyBonusEarned] = useState(false);
  const [isRitualLoading, setIsRitualLoading] = useState(false);

  const fallbackRitualTemplate = [
    { title: 'Morning Intention Setting', description: 'Start your day with a clear intention.', duration: '5 min', category: 'Morning' },
    { title: 'Gratitude Moment', description: 'Reflect on what you are grateful for.', duration: '2 min', category: 'Morning' },
    { title: 'Energy Check-in', description: 'Assess your current energy levels.', duration: '1 min', category: 'Morning' },
    { title: 'Mindful Walk', description: 'Take a walk with full awareness.', duration: '15 min', category: 'Afternoon' },
    { title: 'Evening Reflection', description: 'Reflect on the events of the day.', duration: '10 min', category: 'Evening' },
    { title: 'Bedtime Blessing', description: 'Send a blessing before sleep.', duration: '5 min', category: 'Evening' }
  ];

  const buildFallbackRituals = (activitiesList, todayIds) => {
    return fallbackRitualTemplate.map((item, idx) => {
      const matchedActivity = (activitiesList || []).find(a =>
        (a.activityName || a.ActivityName || '').trim().toLowerCase() === item.title.toLowerCase()
      );

      const activityId = matchedActivity
        ? normalizeId(matchedActivity.activityId || matchedActivity.ActivityId)
        : null;
      const isCompleted = activityId ? todayIds.has(activityId) : false;

      return {
        id: activityId || `fallback-${idx + 1}`,
        title: item.title,
        description: item.description,
        duration: item.duration,
        category: item.category,
        isCompleted,
        originallyCompleted: isCompleted,
        source: 'activity',
        activityId,
        points: matchedActivity?.points ?? matchedActivity?.Points ?? 2
      };
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // Daily Ritual Persistence — localStorage with auto daily reset
  // ═══════════════════════════════════════════════════════════════════
  const getTodayDateString = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const getStoredRitualCompletions = () => {
    try {
      const stored = localStorage.getItem('dailyRitualCompletions');
      if (!stored) return new Set();
      const parsed = JSON.parse(stored);
      const today = getTodayDateString();
      // New day → reset
      if (parsed.date !== today) {
        localStorage.setItem('dailyRitualCompletions', JSON.stringify({ date: today, completedIds: [] }));
        return new Set();
      }
      return new Set(parsed.completedIds || []);
    } catch { return new Set(); }
  };

  const persistRitualCompletion = (ritualId, completed) => {
    try {
      const today = getTodayDateString();
      const stored = localStorage.getItem('dailyRitualCompletions');
      let completedIds = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) completedIds = parsed.completedIds || [];
      }
      const idSet = new Set(completedIds.map(String));
      if (completed) idSet.add(String(ritualId));
      else idSet.delete(String(ritualId));
      localStorage.setItem('dailyRitualCompletions', JSON.stringify({ date: today, completedIds: Array.from(idSet) }));
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === 'bond-building' && bondTab === 'daily-rituals' && userId) {
      fetchRituals();
    }
  }, [activeTab, bondTab, userId]);

  const fetchRituals = async () => {
    try {
      setIsRitualLoading(true);
      const currentUserId = apiService.getCurrentUserId();
      if (!currentUserId) return;

      const data = await apiService.getRitualSuggestions(currentUserId);
      console.log('📋 Rituals API Response:', data);

      const payload = data?.data || data || {};
      const apiRituals = payload?.rituals || payload?.Rituals || [];

      if (Array.isArray(apiRituals) && apiRituals.length > 0) {
        const storedIds = getStoredRitualCompletions();
        const mappedRituals = apiRituals.map(r => ({
          ...r,
          source: 'api',
          isCompleted: storedIds.has(String(r.id || r.Id)) || !!r.isCompleted,
          originallyCompleted: !!r.isCompleted
        }));
        console.log('✅ API Rituals loaded:', mappedRituals);
        setRituals(mappedRituals);
        setDailyBonusEarned(payload?.dailyBonusEarned || payload?.DailyBonusEarned || false);
        return;
      }

      console.warn('⚠️ Ritual suggestions empty, using fallback ritual checklist');

      // Build fallback list from bonding activities + today's completed records
      let activitiesList = bondingActivities;
      let todayIds = new Set(completedActivityIds);

      if (!activitiesList || activitiesList.length === 0) {
        const [activitiesResponse, todayResponse] = await Promise.all([
          apiService.getBondingActivities(),
          apiService.getUserActivitiesToday(currentUserId, new Date().toISOString())
        ]);

        activitiesList = Array.isArray(activitiesResponse)
          ? activitiesResponse
          : (activitiesResponse?.data && Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);

        activitiesList = activitiesList.map(a => ({
          ...a,
          activityId: normalizeId(a.activityId || a.ActivityId),
          activityName: a.activityName || a.ActivityName,
          points: a.points ?? a.Points ?? 2
        }));

        const todayPayload = todayResponse?.data || todayResponse || {};
        const todayData = Array.isArray(todayPayload)
          ? todayPayload
          : (Array.isArray(todayPayload.activities)
            ? todayPayload.activities
            : (Array.isArray(todayPayload.Activities) ? todayPayload.Activities : []));

        todayIds = new Set(
          todayData
            .map(item => normalizeId(item?.activityId || item?.ActivityId || item?.activityID || item?.activity?.id))
            .filter(Boolean)
        );
      }

      const storedIds = getStoredRitualCompletions();
      const fallbackRituals = buildFallbackRituals(activitiesList, todayIds).map(r => ({
        ...r,
        isCompleted: storedIds.has(String(r.id)) || r.isCompleted
      }));
      console.log('✅ Fallback Rituals loaded:', fallbackRituals);
      setRituals(fallbackRituals);
      setDailyBonusEarned(false);
    } catch (error) {
      console.error('❌ Failed to fetch rituals', error);
    } finally {
      setIsRitualLoading(false);
    }
  };

  const handleRitualToggle = (ritualId, isCompleted) => {
    const newCompleted = !isCompleted;
    setRituals(prev => prev.map(r => r.id === ritualId ? { ...r, isCompleted: newCompleted } : r));
    // Persist immediately so tick survives page refresh/navigation all day
    persistRitualCompletion(ritualId, newCompleted);
  };

  const handleSaveRituals = async () => {
    const ritualsToSave = rituals.filter(r => r.isCompleted && !r.originallyCompleted);

    if (ritualsToSave.length === 0) {
      toast.info("No new rituals to save.");
      return;
    }

    try {
      setIsRitualLoading(true);
      const currentUserId = apiService.getCurrentUserId();
      if (!currentUserId) {
        toast.error('Please log in to save rituals.');
        return;
      }

      let bonusAwarded = false;

      // API-based ritual completions
      const apiRitualsToSave = ritualsToSave.filter(r => r.source !== 'activity');
      for (const ritual of apiRitualsToSave) {
        const response = await apiService.completeRitual(currentUserId, ritual.id);
        const completePayload = response?.data || response || {};
        if (completePayload?.bonusAwarded || response?.bonusAwarded) {
          bonusAwarded = true;
        }
      }

      // Fallback activity-based ritual completions
      const activityRitualsToSave = ritualsToSave.filter(r => r.source === 'activity' && r.activityId);
      if (activityRitualsToSave.length > 0) {
        const payload = {
          UserId: currentUserId,
          Date: new Date().toISOString(),
          Activities: activityRitualsToSave.map(r => ({
            ActivityId: r.activityId,
            Score: r.points || ritualPointsMap[r.title] || 2
          }))
        };
        await apiService.saveUserActivitiesScore(payload);
      }

      // For api-source completions, update ritualCheckboxes immediately so
      // "Activities Today" counter reflects them before loadBondingActivities resolves.
      if (apiRitualsToSave.length > 0) {
        const reverseRitualNameMapping = {
          "Morning Intention Setting": "morningIntention",
          "Energy Check-in": "energyCheckin",
          "Mindful Walk": "mindfulWalk",
          "Gratitude Moment": "gratitudeMoment",
          "Evening Reflection": "eveningReflection",
          "Bedtime Blessing": "bedtimeBlessing"
        };
        setRitualCheckboxes(prev => {
          const updated = { ...prev };
          apiRitualsToSave.forEach(r => {
            const key = reverseRitualNameMapping[r.title];
            if (key) updated[key] = true;
          });
          return updated;
        });
      }

      await fetchRituals();
      await loadBondingActivities();
      fetchWellnessData(false);

      if (bonusAwarded) {
        setDailyBonusEarned(true);
        toast.success("Rituals saved! Daily bonus earned! (+2 pts)");
      } else {
        toast.success("Rituals saved successfully.");
      }

    } catch (error) {
      console.error('Error saving rituals', error);
      toast.error("Failed to save rituals.");
    } finally {
      setIsRitualLoading(false);
    }
  };
  const [ritualDays, setRitualDays] = useState(0);
  const [isCheckInDoneToday, setIsCheckInDoneToday] = useState(false);

  // Journal entries state
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Daily Rituals checkbox state
  const [ritualCheckboxes, setRitualCheckboxes] = useState({
    morningIntention: false,
    energyCheckin: false,
    mindfulWalk: false,
    gratitudeMoment: false,
    eveningReflection: false,
    bedtimeBlessing: false
  });

  // ═══════════════════════════════════════════════════════════════════
  // Bonding Activity Persistence — localStorage with auto daily reset
  // ═══════════════════════════════════════════════════════════════════
  const getStoredActivityCompletions = () => {
    try {
      const stored = localStorage.getItem('dailyActivityCompletions');
      if (!stored) return new Set();
      const parsed = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date !== today) {
        localStorage.removeItem('dailyActivityCompletions');
        return new Set(); // New day — reset
      }
      return new Set(parsed.completedIds || []);
    } catch { return new Set(); }
  };

  const persistActivityCompletion = (activityId, completed) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('dailyActivityCompletions');
      let completedIds = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) completedIds = parsed.completedIds || [];
      }
      const idSet = new Set(completedIds.map(String));
      if (completed) idSet.add(String(activityId));
      else idSet.delete(String(activityId));
      localStorage.setItem('dailyActivityCompletions', JSON.stringify({
        date: today,
        completedIds: Array.from(idSet)
      }));
    } catch { /* silent */ }
  };

  const clearStoredActivityCompletions = () => {
    try {
      // Keep date entry but wipe pending IDs since server is now source of truth
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('dailyActivityCompletions', JSON.stringify({ date: today, completedIds: [] }));
    } catch { /* silent */ }
  };

  // Dashboard Stats State
  const [ritualConsistency, setRitualConsistency] = useState({ count: 0, total: 7 });
  const [journalEntriesCount, setJournalEntriesCount] = useState(0);

  // Dynamic Ritual Points State
  const [ritualPointsMap, setRitualPointsMap] = useState({});
  const [ritualIdMap, setRitualIdMap] = useState({});
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isSavingRituals, setIsSavingRituals] = useState(false);

  // Chakra Sync State
  const [suggestedRitual, setSuggestedRitual] = useState('');
  const [ritualDescription, setRitualDescription] = useState('');
  const [harmonyScore, setHarmonyScore] = useState(0);
  const [recommendedChakra, setRecommendedChakra] = useState(null);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInstance, setAudioInstance] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Helper for formatting time
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };





  // Synchronized Breathing State
  const [breathingPatterns, setBreathingPatterns] = useState([]);
  const [targetCycles, setTargetCycles] = useState([]);
  const [isBreathingSessionActive, setIsBreathingSessionActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('ready'); // ready, inhale, hold, exhale, holdAfterExhale
  const [timeLeftInPhase, setTimeLeftInPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);

  // Refs for timer management
  const timerRef = React.useRef(null);
  const isSessionActiveRef = React.useRef(false);
  const currentCycleRef = React.useRef(0);

  // Sync ref with state
  useEffect(() => {
    isSessionActiveRef.current = isBreathingSessionActive;
  }, [isBreathingSessionActive]);

  // Fetch Breathing Data
  useEffect(() => {
    const fetchBreathingData = async () => {
      try {
        const patterns = await apiService.getBreathingPatterns();
        const cycles = await apiService.getTargetCycles();

        console.log('📊 Breathing data received - Patterns:', patterns, 'Cycles:', cycles);

        // Fallback breathing patterns if API returns empty
        const defaultPatterns = [
          {
            id: '4-7-8',
            name: '4-7-8 Breathing',
            description: 'Calming breathing pattern: 4 count inhale, 7 count hold, 8 count exhale',
            timings: { inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 }
          },
          {
            id: 'box-breathing',
            name: 'Box Breathing',
            description: 'Balanced breathing: 4 count inhale, 4 hold, 4 exhale',
            timings: { inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 0 }
          },
          {
            id: 'coherent',
            name: 'Coherent Breathing',
            description: 'Rhythmic breathing: 5 count inhale, 5 count exhale',
            timings: { inhale: 5, hold: 0, exhale: 5, holdAfterExhale: 0 }
          }
        ];

        // Fallback target cycles if API returns empty
        const defaultCycles = [
          { id: '1', name: '1 Cycle', cycles: 1 },
          { id: '5', name: '5 Cycles', cycles: 5 },
          { id: '10', name: '10 Cycles', cycles: 10 }
        ];

        let patternData = patterns;
        let cycleData = cycles;

        // Use fallback if no API data
        if (!patterns || patterns.length === 0) {
          console.warn('⚠️ No breathing patterns from API, using defaults');
          patternData = defaultPatterns;
        }

        if (!cycles || cycles.length === 0) {
          console.warn('⚠️ No target cycles from API, using defaults');
          cycleData = defaultCycles;
        }

        if (patternData && patternData.length > 0) {
          // Normalize timings from API response (nested or flat)
          const processedPatterns = patternData.map(p => {
            const apiTimings = p.timings || p.Timings || {};
            return {
              ...p,
              timings: {
                inhale: apiTimings.inhale || apiTimings.Inhale || p.inhaleDuration || 4,
                hold: apiTimings.hold || apiTimings.Hold || p.holdDuration || 0,
                exhale: apiTimings.exhale || apiTimings.Exhale || p.exhaleDuration || 4,
                holdAfterExhale: apiTimings.holdAfterExhale || apiTimings.HoldAfterExhale || p.holdAfterExhaleDuration || 0
              }
            };
          });
          console.log('✅ Processed patterns:', processedPatterns);
          setBreathingPatterns(processedPatterns);
          setSelectedBreathingPattern(processedPatterns[0].id);
        }

        if (cycleData && cycleData.length > 0) {
          console.log('✅ Setting target cycles:', cycleData);
          setTargetCycles(cycleData);
          setSelectedTargetCycles(cycleData[0].id);
        }
      } catch (error) {
        console.error('Error fetching breathing data:', error);
        // Set fallback defaults on error
        const defaultPatterns = [
          {
            id: '4-7-8',
            name: '4-7-8 Breathing',
            description: 'Calming breathing pattern: 4 count inhale, 7 count hold, 8 count exhale',
            timings: { inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 }
          }
        ];
        const defaultCycles = [
          { id: '1', name: '1 Cycle', cycles: 1 },
          { id: '5', name: '5 Cycles', cycles: 5 }
        ];
        setBreathingPatterns(defaultPatterns);
        setSelectedBreathingPattern(defaultPatterns[0].id);
        setTargetCycles(defaultCycles);
        setSelectedTargetCycles(defaultCycles[0].id);
      }
    };
    fetchBreathingData();
  }, []);

  // Breathing Session Logic
  const handleStartBreathingSession = () => {
    if (isBreathingSessionActive) return;

    const pattern = breathingPatterns.find(p => p.id === selectedBreathingPattern);
    const target = targetCycles.find(c => c.id === selectedTargetCycles);

    if (!pattern || !target) {
      toast.error("Please select a valid pattern and target cycle.");
      return;
    }

    setIsBreathingSessionActive(true);
    isSessionActiveRef.current = true; // Force update ref immediately to avoid race condition
    setCurrentCycle(0);
    currentCycleRef.current = 0;
    startBreathingCycle(pattern);
  };

  const handleStopBreathingSession = () => {
    setIsBreathingSessionActive(false);
    isSessionActiveRef.current = false;
    setBreathingPhase('ready');
    setTimeLeftInPhase(0);
    setCurrentCycle(0);
    currentCycleRef.current = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startBreathingCycle = (pattern) => {
    if (!pattern || !pattern.timings) return;
    runPhase('inhale', pattern.timings.inhale, pattern);
  };

  const runPhase = (phase, duration, pattern) => {
    if (!isSessionActiveRef.current) return;

    setBreathingPhase(phase);
    setTimeLeftInPhase(duration);

    if (timerRef.current) clearInterval(timerRef.current);

    let timeLeft = duration;
    timerRef.current = setInterval(() => {
      if (!isSessionActiveRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      timeLeft -= 1;
      setTimeLeftInPhase(timeLeft);

      if (timeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handlePhaseComplete(phase, pattern);
      }
    }, 1000);
  };

  const handlePhaseComplete = (currentPhase, pattern) => {
    if (!isSessionActiveRef.current) return;

    const timings = pattern.timings;

    // Transition Logic
    if (currentPhase === 'inhale') {
      if (timings.hold > 0) {
        runPhase('hold', timings.hold, pattern);
      } else {
        runPhase('exhale', timings.exhale, pattern);
      }
    } else if (currentPhase === 'hold') {
      runPhase('exhale', timings.exhale, pattern);
    } else if (currentPhase === 'exhale') {
      if (timings.holdAfterExhale > 0) {
        runPhase('holdAfterExhale', timings.holdAfterExhale, pattern);
      } else {
        completeCycle(pattern);
      }
    } else if (currentPhase === 'holdAfterExhale') {
      completeCycle(pattern);
    }
  };

  const completeCycle = (pattern) => {
    const target = targetCycles.find(c => c.id === selectedTargetCycles);
    const maxCycles = target ? parseInt(target.cycles) : 10;

    if (!isSessionActiveRef.current) return;

    // Use currentCycleRef for robust logic (avoid stale closures / state update issues)
    const nextCycle = (currentCycleRef.current || 0) + 1;
    currentCycleRef.current = nextCycle;
    setCurrentCycle(nextCycle);

    if (nextCycle >= maxCycles) {
      finishSession(pattern, nextCycle);
    } else {
      startBreathingCycle(pattern);
    }
  };

  const finishSession = async (pattern, completedCount) => {
    console.log("Starting finishSession...", { pattern, completedCount });
    setIsBreathingSessionActive(false);
    isSessionActiveRef.current = false; // Ensure ref is synced
    setBreathingPhase('ready');
    setCurrentCycle(0);
    currentCycleRef.current = 0;

    try {
      // Calculate duration
      let duration = 0;
      if (pattern && pattern.timings) {
        const cycleDuration = (pattern.timings.inhale || 0) + (pattern.timings.hold || 0) + (pattern.timings.exhale || 0) + (pattern.timings.holdAfterExhale || 0);
        duration = cycleDuration * completedCount;
      }
      console.log("Calculated Duration:", duration);

      const targetCycleObj = targetCycles.find(c => c.id === selectedTargetCycles);
      const targetCount = targetCycleObj ? parseInt(targetCycleObj.cycles) : 10;

      const payload = {
        patternId: pattern ? pattern.id : selectedBreathingPattern,
        patternName: pattern ? pattern.name : 'Unknown Pattern',
        targetCycles: targetCount,
        completedCycles: completedCount || 0,
        durationSeconds: duration
      };

      console.log("Sending payload:", payload);

      const response = await apiService.completeBreathingSession(payload);
      console.log("API Response:", response);

      if (response && (response.points > 0 || response.message)) {
        const points = response.points || 0;
        if (points > 0) {
          toast.success(`Session Complete! +${points} Bonded Points`);
          // Refresh the whole dashboard snapshot after score-affecting actions.
          await fetchWellnessData(false);
        } else {
          toast.info("Session Complete! Daily limit reached.");
        }
      } else {
        console.warn("Unexpected API response structure");
        toast.info("Session Complete!");
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error("Session completed, but failed to save progress.");
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);


  // Fetch ritual points from API
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setIsLoadingPoints(true);
        // Use getBondingActivities instead of getAllPoints to get the actual rituals with IDs
        const points = await apiService.getBondingActivities();

        const pointsMap = {};
        const idMap = {};
        const list = Array.isArray(points) ? points : (points?.data || []);

        if (Array.isArray(list)) {
          list.forEach(p => {
            // Support ActivityName/ActivityId from BondingActivity model
            // Fallback to Name/Id just in case
            const name = p.ActivityName || p.activityName || p.name || p.Name;
            const pts = p.Points !== undefined ? p.Points : (p.points !== undefined ? p.points : 0);
            const id = p.ActivityId || p.activityId || p.id || p.Id;

            if (name) {
              pointsMap[name] = pts;
              idMap[name] = id;

              // Also store normalized version for easier lookup
              const normalized = name.trim().toLowerCase();
              pointsMap[normalized] = pts;
              idMap[normalized] = id;
            }
          });
        }
        setRitualPointsMap(pointsMap);
        setRitualIdMap(idMap);
        console.log('Ritual Maps loaded:', { idMapKeys: Object.keys(idMap), pointsMap });
      } catch (error) {
        console.error('Error fetching ritual points:', error);
      } finally {
        setIsLoadingPoints(false);
      }
    };

    fetchPoints();
  }, []);

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      await fetchWellnessData(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // 1. Reusable fetch functions for refreshing data


  const fetchBondedScore = async () => {
    try {
      await fetchWellnessData(false);
    } catch (error) {
      console.error('Error fetching bonded score:', error);
      const storedScore = localStorage.getItem('bondedScore');
      if (storedScore) setBondedScore(parseInt(storedScore, 10));
      setBondLevel('Sync Pending');
    }
  };

  const fetchCheckInStatus = async () => {
    try {
      await fetchWellnessData(false);
    } catch (err) {
      console.error('Error fetching check-in status:', err);
    }
  };

  // Save Daily Check-in
  const handleSaveDailyCheckin = async () => {
    try {
      setIsSavingCheckin(true);
      const userId = apiService.getCurrentUserId();
      const checkIns = checkInItems.map(ci => ({ CheckInId: ci.checkInId, Rating: ratingsById[ci.checkInId] ?? null }));

      const res = await apiService.updateUserCheckIns(userId, checkIns);
      // If we reach here without an error/exception, the request succeeded (200 range)
      toast.success(res?.message || 'Daily check-ins updated successfully.');

      // Refresh dashboard snapshot once instead of refetching multiple slices separately.
      fetchWellnessData(false);
      if (res && res.stats) {
        // Update local stats immediately if returned
        setWeeklyProgress(res.stats.weeklyProgress || 0);
        setRitualConsistency(res.stats.ritualConsistency || { count: 0, total: 7 });
        setJournalEntriesCount(res.stats.journalEntries?.count || 0);

        if (res.scoreUpdate) {
          setBondedScore(res.scoreUpdate.newScore);
        }
      }

      // Refresh ratings from server to reflect persisted values
      const serverCheckIns = await apiService.getUserCheckIns(userId);
      if (Array.isArray(serverCheckIns) && serverCheckIns.length > 0) {
        const updated = { ...ratingsById };
        const today = formatLocalDate(new Date()); // YYYY-MM-DD (local)

        // Only use TODAY's check-ins (filter out old/missed entries)
        serverCheckIns.forEach(uci => {
          if (uci.checkInId && uci.createdOn) {
            const entryDate = uci.createdOn.split('T')[0];
            // Only update if this is today's entry
            if (entryDate === today) {
              updated[uci.checkInId] = typeof uci.rating === 'number' ? uci.rating : updated[uci.checkInId] ?? 0;
            }
          }
        });

        console.log('🔄 Updated ratings from server:', updated);
        setRatingsById(updated);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save daily check-in');
    } finally {
      setIsSavingCheckin(false);
    }
  };

  // Load check-in definitions once (IDs + questions)
  useEffect(() => {
    const loadCheckIns = async () => {
      try {
        const items = await apiService.getAllCheckIns();
        setCheckInItems(items);

        // Start with 0 for all
        const initial = {};
        items.forEach(ci => {
          initial[ci.checkInId] = 0;
        });

        // Merge in server-saved ratings for this user, if any
        const userId = apiService.getCurrentUserId();
        if (userId) {
          const serverCheckIns = await apiService.getUserCheckIns(userId);
          if (Array.isArray(serverCheckIns)) {
            const today = formatLocalDate(new Date()); // YYYY-MM-DD (local)
            let foundHours = 4; // Default

            // Only use TODAY's check-ins (filter out old/missed entries)
            serverCheckIns.forEach(uci => {
              if (uci?.checkInId && typeof uci?.rating === 'number' && uci?.createdOn) {
                const entryDate = uci.createdOn.split('T')[0];

                // Only load today's ratings
                if (entryDate === today) {
                  initial[uci.checkInId] = uci.rating;

                  // Also update hoursTogether if this is the hours check-in
                  const checkInDef = items.find(item => item.checkInId === uci.checkInId);
                  if (checkInDef && checkInDef.questions.toLowerCase().includes('hours spent')) {
                    foundHours = uci.rating;
                  }
                }
              }
            });

            console.log('🔄 Initial ratings loaded from server (today only):', initial);
            setHoursTogether(foundHours);
          }
        }

        setRatingsById(initial);
      } catch (_) { }
    };
    loadCheckIns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const user = localStorage.getItem('user');
        const userObj = user ? JSON.parse(user) : {};

        const name = userObj.fullName || userObj.profileName || userObj.name || 'User';
        const email = userObj.email || '';
        const dogName = (localStorage.getItem('dogName') || userObj.dogName || 'Your Dog');

        console.log('Dashboard loading user data:', { userObj, name, email, dogName });

        // Generate initials from name
        const initials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);

        setUserData({
          name,
          email,
          dogName,
          initials
        });

        // Load dog profile photo (sanitize stored value like profile settings does)
        const rawDogPhoto = localStorage.getItem('DogprofilPhotoUrl');
        const dogPhoto = (!rawDogPhoto || rawDogPhoto === 'null' || rawDogPhoto === 'undefined') ? '' : rawDogPhoto;
        setDogProfilePhoto(dogPhoto || '');

        console.log('User data loaded:', { name, email, dogName, initials });
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to default values
        setUserData({
          name: 'User',
          email: '',
          dogName: 'Your Dog',
          initials: 'U'
        });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    // Initial check-in state is already covered by the unified dashboard summary polling.
  }, []);

  const loadBondingActivities = async () => {
    try {
      const currentUserId = apiService.getCurrentUserId();
      if (!currentUserId) return;

      setIsLoadingActivities(true);
      setActivitiesError('');

      // Parallel fetch: Activities + Today's Status
      const [activitiesResponse, todayResponse] = await Promise.all([
        apiService.getBondingActivities(),
        apiService.getUserActivitiesToday(currentUserId, new Date().toISOString())
      ]);

      const activities = Array.isArray(activitiesResponse)
        ? activitiesResponse
        : (activitiesResponse?.data && Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);

      // Today's endpoint returns wrapped payload: { data: { activities: [...] } }
      // Normalize all known shapes to an array before mapping.
      const todayPayload = todayResponse?.data || todayResponse || {};
      const todayData =
        Array.isArray(todayPayload)
          ? todayPayload
          : (Array.isArray(todayPayload.activities)
            ? todayPayload.activities
            : (Array.isArray(todayPayload.Activities) ? todayPayload.Activities : []));

      const todayIds = new Set(
        todayData
          .map(item => normalizeId(item?.activityId || item?.ActivityId || item?.activityID || item?.activity?.id))
          .filter(Boolean)
      );

      // Map categories and preserve backend interaction type if valid
      const activitiesWithProps = activities.map(a => ({
        ...a,
        activityId: normalizeId(a.activityId || a.ActivityId),
        activityName: a.activityName || a.ActivityName,
        points: a.points ?? a.Points ?? 2,
        category: a.category || ACTIVITY_CATEGORIES[a.activityName || a.ActivityName] || 'Physical',
        interactionType: a.interactionType || 'Checkbox'
      }));

      // Fallback: if Chakra was completed in this session/day, keep it marked.
      const chakraLocalKey = `chakraSyncCompletedDate:${currentUserId}`;
      const chakraCompletedDate = localStorage.getItem(chakraLocalKey);
      const todayLocalDate = formatLocalDate(new Date());
      if (chakraCompletedDate === todayLocalDate) {
        activitiesWithProps
          .filter(a => (a.activityName || '').trim().toLowerCase() === 'chakra sync')
          .forEach(a => todayIds.add(normalizeId(a.activityId)));
      }

      // Merge with localStorage pending completions (ticked but not yet saved to server)
      const storedActivities = getStoredActivityCompletions();
      storedActivities.forEach(id => todayIds.add(id));

      setBondingActivities(activitiesWithProps);
      setCompletedActivityIds(todayIds);

      // Update Ritual Checkboxes based on today's activities
      const newRituals = {
        morningIntention: false,
        energyCheckin: false,
        mindfulWalk: false,
        gratitudeMoment: false,
        eveningReflection: false,
        bedtimeBlessing: false
      };

      const ritualNameMapping = {
        morningIntention: "Morning Intention Setting",
        energyCheckin: "Energy Check-in",
        mindfulWalk: "Mindful Walk",
        gratitudeMoment: "Gratitude Moment",
        eveningReflection: "Evening Reflection",
        bedtimeBlessing: "Bedtime Blessing"
      };

      Object.entries(ritualNameMapping).forEach(([key, name]) => {
        // Find activity by name (case-insensitive if needed, but names are consistent)
        const activity = activitiesWithProps.find(a => a.activityName === name);
        if (activity && todayIds.has(normalizeId(activity.activityId))) {
          newRituals[key] = true;
        }
      });

      setRitualCheckboxes(newRituals);

    } catch (error) {
      console.error('Error fetching bonding activities:', error);
      setActivitiesError(error?.message || 'Failed to load bonding activities. Please try again later.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadBondingActivities();
  }, []);

  // Save Activities Handler
  const handleSaveActivities = async () => {
    try {
      const userId = apiService.getCurrentUserId();
      if (!userId) {
        toast.error('Please log in to save activities.');
        return;
      }

      const activityIds = Array.from(completedActivityIds);
      if (activityIds.length === 0) {
        toast.error('Please select at least one activity.');
        return;
      }

      setIsSavingActivities(true);

      // Map selected IDs to { ActivityId, Score } objects
      const activitiesToSave = activityIds.map(id => {
        const normalizedId = normalizeId(id);
        const activity = bondingActivities.find(a => normalizeId(a.activityId) === normalizedId);
        if (!activity) return null;

        // Use dynamic point from map if available, else fallback to activity.points
        const score = ritualPointsMap[activity.activityName] || activity.points || 2;

        return {
          ActivityId: activity.activityId,
          Score: score
        };
      }).filter(Boolean);

      const payload = {
        UserId: userId,
        Date: new Date().toISOString(), // Use local client time
        Activities: activitiesToSave
      };

      const response = await apiService.saveUserActivitiesScore(payload);

      toast.success(response?.message || 'Activities saved successfully!');

      // Persist server-confirmed activity IDs to localStorage so they survive refresh all day
      const today = new Date().toISOString().split('T')[0];
      const serverConfirmedIds = activityIds.map(String);
      localStorage.setItem('dailyActivityCompletions', JSON.stringify({
        date: today,
        completedIds: serverConfirmedIds
      }));

      // Refresh data from server to persist checkbox state and score
      await loadBondingActivities();
      await fetchWellnessData(false);

    } catch (error) {
      console.error('Save activities error:', error);
      toast.error(error?.message || 'Failed to save activities.');
    } finally {
      setIsSavingActivities(false);
    }
  };



  // Fetch journal entries function
  const fetchJournalEntries = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No userId found, cannot fetch journal entries');
        return;
      }

      setIsLoadingEntries(true);
      const response = await apiService.getUserJournalEntries(userId);
      console.log('Journal entries API Response:', response);

      // Handle wrapped + paged payloads consistently with Journal page
      const payload = response?.data || response || {};
      const entriesRaw =
        payload?.entries ||
        payload?.Entries ||
        response?.entries ||
        response?.Entries ||
        (Array.isArray(payload) ? payload : []);
      const entries = Array.isArray(entriesRaw) ? entriesRaw : [];

      // Transform API response to match expected format
      const transformedEntries = entries.map(entry => {
        let tagsArray = [];
        if (entry.tags) {
          if (Array.isArray(entry.tags)) {
            tagsArray = entry.tags;
          } else if (typeof entry.tags === 'string') {
            tagsArray = entry.tags.trim() ? [entry.tags] : [];
          }
        }

        const rawEntryType = String(entry.entryType || entry.EntryType || '').toLowerCase();
        const normalizedType = rawEntryType.includes('memory') ? 'memory-reflection' : 'letter';

        return {
          id: entry.id || entry.entryId || entry.journalEntryId || Date.now(),
          type: normalizedType,
          content: entry.content || '',
          tags: tagsArray,
          letterTo: entry.letterTo || entry.lettrTo || null,
          createdAt: entry.createdOn || entry.createdAt || entry.dateCreated || new Date().toISOString(),
          title: entry.title || (normalizedType === 'letter' ? `Letter to ${entry.letterTo || entry.lettrTo || 'My Dog'}` : 'Memory Reflection'),
          mediaUrl: entry.mediaUrl,
          mediaType: entry.mediaType,
          imageUrl: entry.imageUrl
        };
      });

      setJournalEntries(transformedEntries);
      console.log('Journal entries loaded:', transformedEntries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Load journal entries on component mount
  useEffect(() => {
    const loadJournalEntries = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          await fetchJournalEntries();
        }
      } catch (error) {
        console.error('Error loading journal entries on mount:', error);
      }
    };

    loadJournalEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chakra Sync State
  // ─── Initialize from localStorage (persists for today, resets next day) ───
  const getStoredChakraValues = () => {
    try {
      const stored = localStorage.getItem('dailyChakraSync');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date !== today) {
        localStorage.removeItem('dailyChakraSync');
        return null; // New day — reset to defaults
      }
      return parsed.values;
    } catch { return null; }
  };

  const _storedChakra = getStoredChakraValues();
  const [rootChakra, setRootChakra] = useState(_storedChakra?.root ?? 5);
  const [sacralChakra, setSacralChakra] = useState(_storedChakra?.sacral ?? 5);
  const [solarPlexusChakra, setSolarPlexusChakra] = useState(_storedChakra?.solarPlexus ?? 5);
  const [heartChakra, setHeartChakra] = useState(_storedChakra?.heart ?? 5);
  const [throatChakra, setThroatChakra] = useState(_storedChakra?.throat ?? 5);
  const [thirdEyeChakra, setThirdEyeChakra] = useState(_storedChakra?.thirdEye ?? 5);
  const [crownChakra, setCrownChakra] = useState(_storedChakra?.crown ?? 5);
  const [isSyncing, setIsSyncing] = useState(false);


  // New: Behaviors State (Source 8)
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);

  const handleBehaviorToggle = (behavior) => {
    setSelectedBehaviors(prev => {
      if (prev.includes(behavior)) {
        return prev.filter(b => b !== behavior);
      } else {
        return [...prev, behavior];
      }
    });
  };

  const handleChakraSync = async () => {
    setIsSyncing(true);
    try {
      const syncData = {
        UserId: userId,
        PetId: null,
        RootScore: rootChakra,
        SacralScore: sacralChakra,
        SolarPlexusScore: solarPlexusChakra,
        HeartScore: heartChakra,
        ThroatScore: throatChakra,
        ThirdEyeScore: thirdEyeChakra,
        CrownScore: crownChakra,
        Behaviors: selectedBehaviors // Send selected behaviors
      };

      console.log('Syncing Chakra with data:', syncData);

      const response = await apiService.syncChakra(syncData);

      console.log('Chakra Sync Response:', response);

      // Extract data from response wrapper
      const syncData_response = response?.data || response;

      if (syncData_response) {
        setHarmonyScore(syncData_response.harmonyScore || 0);
        setSuggestedRitual(syncData_response.dominantBlockage ? `${syncData_response.dominantBlockage} Chakra Healing` : 'Chakra Sync Ritual');
        setRitualDescription(syncData_response.dominantBlockage
          ? `Focus on your ${syncData_response.dominantBlockage} chakra to restore balance and harmony.`
          : 'Align your energy centers with your companion through guided meditation.');

        // Update UI with adjusted scores if available
        if (syncData_response.adjustedScores) {
          setRootChakra(syncData_response.adjustedScores.rootScore || syncData_response.adjustedScores.RootScore);
          setSacralChakra(syncData_response.adjustedScores.sacralScore || syncData_response.adjustedScores.SacralScore);
          setSolarPlexusChakra(syncData_response.adjustedScores.solarPlexusScore || syncData_response.adjustedScores.SolarPlexusScore);
          setHeartChakra(syncData_response.adjustedScores.heartScore || syncData_response.adjustedScores.HeartScore);
          setThroatChakra(syncData_response.adjustedScores.throatScore || syncData_response.adjustedScores.ThroatScore);
          setThirdEyeChakra(syncData_response.adjustedScores.thirdEyeScore || syncData_response.adjustedScores.ThirdEyeScore);
          setCrownChakra(syncData_response.adjustedScores.crownScore || syncData_response.adjustedScores.CrownScore);
        }

        if (syncData_response.dominantBlockage) {
          const chakra = chakraData.find(c => c.name.includes(syncData_response.dominantBlockage));
          if (chakra) {
            setRecommendedChakra({
              ...chakra,
              audio: syncData_response.audioUrl && syncData_response.audioUrl !== 'Audio not available for this chakra yet.'
                ? syncData_response.audioUrl
                : chakra.audio
            });
            // Store audio URL for playback
            if (syncData_response.audioUrl && syncData_response.audioUrl !== 'Audio not available for this chakra yet.') {
              localStorage.setItem('currentChakraAudio', syncData_response.audioUrl);
            } else {
              localStorage.removeItem('currentChakraAudio');
            }
          }
        }

        toast.success(`Harmony Score: ${Math.round(syncData_response.harmonyScore || 0)}/10`);
        setShowRitualView(true);

        // Persist today's chakra values so sliders stay after refresh/navigate
        const finalValues = {
          root: syncData_response.adjustedScores?.rootScore ?? syncData_response.adjustedScores?.RootScore ?? rootChakra,
          sacral: syncData_response.adjustedScores?.sacralScore ?? syncData_response.adjustedScores?.SacralScore ?? sacralChakra,
          solarPlexus: syncData_response.adjustedScores?.solarPlexusScore ?? syncData_response.adjustedScores?.SolarPlexusScore ?? solarPlexusChakra,
          heart: syncData_response.adjustedScores?.heartScore ?? syncData_response.adjustedScores?.HeartScore ?? heartChakra,
          throat: syncData_response.adjustedScores?.throatScore ?? syncData_response.adjustedScores?.ThroatScore ?? throatChakra,
          thirdEye: syncData_response.adjustedScores?.thirdEyeScore ?? syncData_response.adjustedScores?.ThirdEyeScore ?? thirdEyeChakra,
          crown: syncData_response.adjustedScores?.crownScore ?? syncData_response.adjustedScores?.CrownScore ?? crownChakra,
        };
        localStorage.setItem('dailyChakraSync', JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          values: finalValues
        }));
      }
    } catch (error) {
      console.error('Sync failed', error);
      toast.error("Failed to sync chakras. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };


  // Chakra sequence data
  const chakraData = [
    {
      id: 1,
      name: "Root Chakra",
      location: "Base of spine",
      color: "red",
      timer: "1:00",
      breathing: "Deep, slow breaths",
      affirmation: "I am grounded and secure",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the base of spine",
        "Breathe deeply and visualize red light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 2,
      name: "Sacral Chakra",
      location: "Below navel",
      color: "orange",
      timer: "1:00",
      breathing: "Rhythmic breathing",
      affirmation: "I flow with creativity and joy",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the below navel",
        "Breathe deeply and visualize orange light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 3,
      name: "Solar Plexus",
      location: "Above navel",
      color: "yellow",
      timer: "1:00",
      breathing: "Energizing breaths",
      affirmation: "I am confident and powerful",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the above navel",
        "Breathe deeply and visualize yellow light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 4,
      name: "Heart Chakra",
      location: "Center of chest",
      color: "green",
      timer: "1:30",
      breathing: "Heart-centered breathing",
      affirmation: "I give and receive love freely",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the center of chest",
        "Breathe deeply and visualize green light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 5,
      name: "Throat Chakra",
      location: "Base of throat",
      color: "blue",
      timer: "1:00",
      breathing: "Vocal breathing",
      affirmation: "I speak my truth clearly",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the base of throat",
        "Breathe deeply and visualize blue light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 6,
      name: "Third Eye",
      location: "Between eyebrows",
      color: "indigo",
      timer: "1:30",
      breathing: "Mindful awareness",
      affirmation: "I see with clarity and wisdom",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the between eyebrows",
        "Breathe deeply and visualize indigo light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    },
    {
      id: 7,
      name: "Crown Chakra",
      location: "Top of head",
      color: "purple",
      timer: "1:30",
      breathing: "Divine connection",
      affirmation: "I am connected to universal wisdom",
      instructions: [
        "Sit comfortably with your dog nearby",
        "Focus on the top of head",
        "Breathe deeply and visualize purple light",
        "Repeat the affirmation silently",
        "Feel the energy connecting you and your companion"
      ],
      audio: "/smooth-jazz-podcast-instrumental-background-music-355744.mp3"
    }
  ];



  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const user = localStorage.getItem('user');

    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to landing page');
      navigate('/', { replace: true });
      return;
    }

    // Fetch current subscription silently
    const fetchSubscription = async () => {
      try {
        const response = await apiService.makeRequest('/Subscription/current', { method: 'GET' });
        const subData = response && response.hasOwnProperty('data') ? response.data : response;
        setCurrentSubscription(subData);
      } catch (e) {
        // subscription fetch failure is non-blocking
      }
    };
    fetchSubscription();
  }, [navigate]);

  // Scroll animation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Handle browser back button - redirect to landing page
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);

    // Push a state to the history so back button works
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
    // Navigate to appropriate page based on action
    switch (action) {
      case 'daily-checkin':
        setActiveTab('bond-building');
        setBondTab('checkins');
        break;
      case 'chakra-sync':
        navigate('/rituals');
        break;

      case 'add-memory':
        navigate('/journal');
        break;
      default:
        break;
    }
  };

  const handleUpgrade = () => {
    console.log('Upgrade to Premium clicked');
    setShowPricingModal(true);
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handlePlanToggle = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  const handleCreateEntry = () => {
    console.log('Create First Entry clicked');
    navigate('/journal');
  };

  const handleViewAll = () => {
    console.log('View All memories clicked');
    navigate('/journal');
  };

  const handleJoinCircle = () => {
    console.log('Join Circle clicked');
    navigate('/community');
  };

  const handleReadMore = () => {
    console.log('Read More clicked');
    navigate('/community');
  };

  const getCurrentTierLevel = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return 'free';
      const parsed = JSON.parse(storedUser);
      return String(parsed?.tierLevel || 'free').toLowerCase().trim();
    } catch {
      return 'free';
    }
  };

  const hasChakraSyncAccess = (() => {
    const tier = getCurrentTierLevel();
    if (tier === 'plus' || tier === 'premium') {
      return true;
    }

    const planName = String(currentSubscription?.planName || '').toLowerCase();
    return planName.includes('plus') || planName.includes('premium');
  })();

  const hasUnlimitedMemories = (() => {
    const tier = getCurrentTierLevel();
    if (tier === 'plus' || tier === 'premium') {
      return true;
    }

    const planName = String(currentSubscription?.planName || '').toLowerCase();
    return planName.includes('plus') || planName.includes('premium');
  })();

  const handleStartRitual = async () => {
    console.log('Start Guided Chakra Ritual clicked');

    // Prepare data for sync
    const chakraData = {
      userId: apiService.getCurrentUserId(),
      RootScore: rootChakra,
      SacralScore: sacralChakra,
      SolarPlexusScore: solarPlexusChakra,
      HeartScore: heartChakra,
      ThroatScore: throatChakra,
      ThirdEyeScore: thirdEyeChakra,
      CrownScore: crownChakra
    };

    try {
      const response = await apiService.syncChakra(chakraData);
      if (response) {
        setSuggestedRitual(response.suggestedRitual);
        setRitualDescription(response.ritualDescription);
        setHarmonyScore(response.harmonyScore);
        setShowRitualView(true);
        toast.success("Chakra alignment calculated!");
      }
    } catch (err) {
      console.error("Sync failed", err);
      toast.error("Failed to sync chakras");
    }
  };

  const handleBackFromRitual = () => {
    console.log('Back from ritual clicked');
    setShowRitualView(false);
  };

  const handleBeginRitual = () => {
    console.log('Begin Ritual clicked');
    setCurrentChakraStep(1); // Reset to first chakra
    setRecommendedChakra(chakraData[0]);
    if (chakraData[0]?.audio) {
      localStorage.setItem('currentChakraAudio', chakraData[0].audio);
    }
    setShowProgressView(true);
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      if (audioInstance) {
        audioInstance.pause();
        setIsPlaying(false);
      }
    } else {
      const currentStepChakra = chakraData[currentChakraStep - 1];
      let audioUrl = recommendedChakra?.audio || localStorage.getItem('currentChakraAudio') || currentStepChakra?.audio;

      if (audioUrl && audioUrl !== 'Audio not available for this chakra yet.') {
        let currentAudio = audioInstance;

        if (!currentAudio || currentAudio.src !== audioUrl) {
          currentAudio = new Audio(audioUrl);

          currentAudio.onloadedmetadata = () => {
            setAudioDuration(currentAudio.duration);
          };

          currentAudio.ontimeupdate = () => {
            setAudioCurrentTime(currentAudio.currentTime);
            setAudioProgress((currentAudio.currentTime / currentAudio.duration) * 100);
          };

          currentAudio.onended = async () => {
            setIsPlaying(false);
            setAudioProgress(100);
            const userId = apiService.getCurrentUserId();
            if (userId) {
              try {
                const response = await apiService.completeChakraRitual(userId);
                const completionData = response?.data || response || {};
                const completionMessage = (completionData?.message || response?.message || '').toLowerCase();
                const wasAwarded = completionData?.bonusAwarded === true;
                const alreadyDone = completionMessage.includes('already completed');

                if (wasAwarded) {
                  toast.success("Harmony Ritual Complete! +2 Bonded Points Awarded. ✨");
                } else if (alreadyDone) {
                  toast.success("Chakra ritual already completed for today.");
                } else {
                  toast.success("Chakra ritual completion saved.");
                }

                // Persist local completion marker to avoid same-session visual mismatch.
                localStorage.setItem(`chakraSyncCompletedDate:${userId}`, formatLocalDate(new Date()));

                // Immediately mark Chakra Sync complete in local UI to avoid redirect loop.
                setCompletedActivityIds(prev => {
                  const next = new Set(prev);
                  bondingActivities
                    .filter(a => (a.activityName || '').trim().toLowerCase() === 'chakra sync')
                    .forEach(a => next.add(normalizeId(a.activityId)));
                  return next;
                });

                fetchWellnessData(false); // Immediate dashboard refresh from unified summary
                await loadBondingActivities(); // Refresh completed activities state from backend
              } catch (err) {
                console.error('Failed to award ritual bonus:', err);
              }
            }
          };
          setAudioInstance(currentAudio);
        }

        currentAudio.play();
        setIsPlaying(true);
      } else {
        toast.error("No audio available for this chakra yet.");
      }
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * audioDuration;
    if (audioInstance) {
      audioInstance.currentTime = seekTime;
      setAudioProgress(e.target.value);
    }
  };

  const handleResetAudio = () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    }
  };

  const handleBackFromProgress = () => {
    console.log('Back from progress clicked');
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    }
    setShowProgressView(false);
  };

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;



  const handleOpenChangePassword = () => {
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordFields({
      current: false,
      new: false,
      confirm: false
    });
    setNewPasswordTouched(false);
    setIsNewPasswordValid(false);
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePasswordModal(false);
    setIsUpdatingPassword(false);
  };

  const handleChangePasswordInput = (field, value) => {
    setChangePasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation for new password
    if (field === 'newPassword') {
      if (!newPasswordTouched) {
        setNewPasswordTouched(true);
      }
      setIsNewPasswordValid(passwordRegex.test(value));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswordFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (!passwordRegex.test(newPassword.trim())) {
      toast.error('New password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    const storedUser = localStorage.getItem('user');
    let email = '';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        email = user.email || user.Email || '';
      } catch (error) {
        console.error('Error parsing user data for change password:', error);
      }
    }

    if (!email) {
      toast.error('Could not determine user email. Please log in again.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await apiService.changePassword(
        email,
        currentPassword.trim(),
        newPassword.trim()
      );
      const message = response?.message || response?.Message || 'Password changed successfully.';
      toast.success(message);
      handleCloseChangePassword();
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Chakra navigation functions
  const handlePreviousChakra = () => {
    if (currentChakraStep > 1) {
      const newStep = currentChakraStep - 1;
      setCurrentChakraStep(newStep);
      setRecommendedChakra(chakraData[newStep - 1]);
      if (chakraData[newStep - 1]?.audio) {
        localStorage.setItem('currentChakraAudio', chakraData[newStep - 1].audio);
      }
    }
  };

  const handleNextChakra = () => {
    if (currentChakraStep < 7) {
      const newStep = currentChakraStep + 1;
      setCurrentChakraStep(newStep);
      setRecommendedChakra(chakraData[newStep - 1]);
      if (chakraData[newStep - 1]?.audio) {
        localStorage.setItem('currentChakraAudio', chakraData[newStep - 1].audio);
      }
    }
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100">
      {/* Top Navigation Bar */}
      <Navbar currentPage="dashboard" onUpgrade={handleUpgrade} onChangePassword={handleOpenChangePassword} />
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 md:p-4 relative animate-fadeIn space-y-4">
            <button
              onClick={handleCloseChangePassword}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswordFields.current ? 'text' : 'password'}
                    value={changePasswordForm.currentPassword}
                    onChange={(e) => handleChangePasswordInput('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPasswordFields.current ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.089.174-2.137.5-3.125M21.5 6.875A9.969 9.969 0 0122 9c0 5.523-4.477 10-10 10-.702 0-1.388-.07-2.053-.204" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswordFields.new ? 'text' : 'password'}
                    value={changePasswordForm.newPassword}
                    onChange={(e) => handleChangePasswordInput('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${newPasswordTouched && !isNewPasswordValid ? 'border-red-500' : newPasswordTouched && isNewPasswordValid ? 'border-green-500' : 'border-gray-200'
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPasswordFields.new ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.089.174-2.137.5-3.125M21.5 6.875A9.969 9.969 0 0122 9c0 5.523-4.477 10-10 10-.702 0-1.388-.07-2.053-.204" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                  {newPasswordTouched && isNewPasswordValid && (
                    <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {newPasswordTouched && (
                  <p className={`text-xs ${isNewPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isNewPasswordValid ? (
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Password meets all requirements
                      </span>
                    ) : (
                      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
                    )}
                  </p>
                )}
                {!newPasswordTouched && (
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters and include uppercase, lowercase, number, and special character.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswordFields.confirm ? 'text' : 'password'}
                    value={changePasswordForm.confirmPassword}
                    onChange={(e) => handleChangePasswordInput('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPasswordFields.confirm ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.089.174-2.137.5-3.125M21.5 6.875A9.969 9.969 0 0122 9c0 5.523-4.477 10-10 10-.702 0-1.388-.07-2.053-.204" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseChangePassword}
                  className="px-5 py-2 rounded-lg border border-red-400 text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${isUpdatingPassword
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                >
                  {isUpdatingPassword ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div
          id="welcome-section"
          data-animate
          className={`mb-4 transition-all duration-1000 delay-200 ${isVisible['welcome-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <h1 className="text-lg font-bold text-gray-900 mb-2">Welcome back, {userData.name}</h1>
          <p className="text-lg text-gray-600">Continue strengthening your spiritual bond with {userData.dogName}</p>
        </div>

        {/* Navigation Tabs */}
        <div
          id="nav-tabs"
          data-animate
          className={`mb-4 transition-all duration-1000 delay-300 ${isVisible['nav-tabs'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 rounded-md transition-colors ${activeTab === 'overview'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bond-building')}
              className={`flex-1 px-4 py-3 rounded-md transition-colors ${activeTab === 'bond-building'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Bond Building
            </button>
            <button
              onClick={() => setActiveTab('wellness')}
              className={`flex-1 px-4 py-3 rounded-md transition-colors ${activeTab === 'wellness'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Wellness
            </button>
            <button
              onClick={() => setActiveTab('meditation')}
              className={`flex-1 px-4 py-3 rounded-md transition-colors ${activeTab === 'meditation'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Meditation
            </button>
            {/* <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-3 rounded-md transition-colors ${activeTab === 'insights'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Insights
            </button> */}
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Main Statistics Panel */}
            <div
              id="stats-panel"
              data-animate
              className={`bg-white rounded-2xl shadow-lg p-4 mb-4 transition-all duration-1000 delay-400 ${isVisible['stats-panel'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bonded Score */}
                <div className="text-center">
                  {/* Circular Progress Indicator */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {/* Background Circle */}
                    <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
                      {/* Background circle (gray) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      {/* Progress circle (gradient) - fills based on bondedScore */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#bondedScoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - bondedScore / 100)}`}
                        className="transition-all duration-1000 ease-out"
                      />
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="bondedScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Center content with score - shows bondedScore value */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {bondedScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bonded Score</h3>
                  <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {bondLevel}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">This Week's Progress</span>
                      <span className="text-sm font-medium text-gray-900">+{weeklyProgress} points</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (weeklyProgress / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">Ritual Consistency</span>
                      <span className="text-sm font-medium text-gray-900">{ritualConsistency.count}/{ritualConsistency.total} days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(ritualConsistency.count / ritualConsistency.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">Journal Entries</span>
                      <span className="text-sm font-medium text-gray-900">{journalEntriesCount} this month</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (journalEntriesCount / 30) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Pet Profile */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {dogProfilePhoto ? (
                      <img
                        src={dogProfilePhoto}
                        alt="Dog Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 text-lg">🐕</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{userData.dogName || 'Your Dog'}</h3>
                  {/* <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    calm
                  </div> */}
                </div>

              </div>
            </div>

            {/* Quick Actions */}
            <div
              id="quick-actions"
              data-animate
              className={`mb-4 transition-all duration-1000 delay-600 ${isVisible['quick-actions'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chakra Sync - Plus/Premium */}
                <button
                  onClick={() => hasChakraSyncAccess ? handleQuickAction('chakra-sync') : handleUpgrade()}
                  title={hasChakraSyncAccess ? 'Open Chakra Sync' : 'Plus/Premium Feature - Upgrade to access'}
                  className={`bg-white text-gray-800 p-4 rounded-xl shadow-sm relative transition-all duration-300 ${hasChakraSyncAccess
                    ? 'hover:shadow-lg transform hover:scale-105 border-2 border-transparent'
                    : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                  {!hasChakraSyncAccess && (
                    <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>⭐</span>
                      <span>Premium</span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-lg shadow-md ${hasChakraSyncAccess ? '' : 'opacity-60'}`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${hasChakraSyncAccess ? 'text-gray-900' : 'text-gray-500'}`}>Chakra Sync</h3>
                    <p className={`text-sm ${hasChakraSyncAccess ? 'text-gray-500' : 'text-gray-400'}`}>Align your energy with your dog</p>
                  </div>
                </button>

                {/* Daily Check-in */}
                <button
                  onClick={() => handleQuickAction('daily-checkin')}
                  className={`bg-white text-gray-800 p-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-sm border-2 ${isCheckInDoneToday ? 'border-green-400' : 'border-transparent'}`}
                >
                  <div className="text-center relative">
                    {isCheckInDoneToday && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-bounce">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br ${isCheckInDoneToday ? 'from-green-500 to-green-600' : 'from-pink-500 to-pink-600'} text-white text-lg shadow-md`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Daily Check-in</h3>
                    <p className="text-sm text-gray-500">{isCheckInDoneToday ? 'Completed today! ✨' : 'Reflect on your bond today'}</p>
                  </div>
                </button>

                {/* Add Memory */}
                <button
                  onClick={() => handleQuickAction('add-memory')}
                  className="bg-white text-gray-800 p-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-sm relative"
                >
                  {!hasUnlimitedMemories && (
                    <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                      Free: 5 Max
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg shadow-md">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Add Memory</h3>
                    <p className="text-sm text-gray-500">Capture a special moment</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Section */}
            <div
              id="bottom-section"
              data-animate
              className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-1000 delay-800 ${isVisible['bottom-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              {/* Recent Memories */}
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 border-2 border-white rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Memories</h3>
                  </div>
                  <button
                    onClick={handleViewAll}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View All
                  </button>
                </div>

                {(() => {
                  // Filter to show only memory-reflection entries and keep only the most recent one
                  const memoryEntries = journalEntries
                    .filter(entry => entry.type === 'memory-reflection')
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 1);

                  // Show loading state
                  if (isLoadingEntries) {
                    return (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading memories...</p>
                      </div>
                    );
                  }

                  // Show entries if available
                  if (memoryEntries.length > 0) {
                    return (
                      <div className="space-y-4">
                        {memoryEntries.map((entry) => {
                          // Truncate content to 150 characters for preview
                          const contentPreview = entry.content.length > 150
                            ? entry.content.substring(0, 150) + '...'
                            : entry.content;

                          return (
                            <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                                  Memory
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-2">
                                {contentPreview}
                              </p>
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {/* Show image thumbnail if available */}
                              {entry.imageUrl && (
                                <div className="mt-3">
                                  <img
                                    src={entry.imageUrl}
                                    alt="Memory"
                                    className="w-full h-20 object-cover rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Add Create Entry Button Below Recent Memories */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={handleCreateEntry}
                            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 text-purple-600 font-medium transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add New Memory</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Show empty state with create button if no memories
                  return (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">No memories yet. Start journaling!</p>
                      <button
                        onClick={handleCreateEntry}
                        className="border border-purple-500 text-purple-500 px-4 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300"
                      >
                        Create First Entry
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Premium Status Card */}
              {currentSubscription && currentSubscription.planName ? (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-4 border border-purple-100">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{currentSubscription.planName}</h3>
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    {[
                      { icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: 'Advanced Aura Tracking', desc: 'Deep energy field analysis' },
                      { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Monthly Healing Circles', desc: 'Exclusive community events' },
                      { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Legacy Export', desc: 'Download your complete journal' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{f.label}</h4>
                          <p className="text-xs text-gray-500">{f.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  {currentSubscription.currentPeriodEnd && (
                    <div className="bg-white rounded-xl p-3 border border-purple-100 text-sm">
                      <span className="text-gray-500">Renews on </span>
                      <span className="font-semibold text-gray-800">
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/subscription')}
                    className="w-full mt-4 border border-purple-300 text-purple-700 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 text-sm"
                  >
                    Manage Subscription
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Unlock Premium</h3>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Advanced Aura Tracking</h4>
                          <p className="text-sm text-gray-600">Deep energy field analysis</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Monthly Healing Circles</h4>
                          <p className="text-sm text-gray-600">Exclusive community events</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Legacy Export</h4>
                          <p className="text-sm text-gray-600">Download your complete journal</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Wellness Tab Content */}
        {activeTab === 'wellness' && (
          <>
            {/* ── Reset Baseline Confirmation Modal (real API) ─────────────── */}
            {wlShowResetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Reset Baseline?</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">This will reset your current baseline and restart the calibration period.</p>
                  <p className="text-xs text-gray-400 mb-4">Are you sure you want to proceed?</p>
                  <div className="flex space-x-3">
                    <button onClick={() => setWlShowResetModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={handleWlResetBaseline} className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition shadow-md">Yes, Reset</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Recalibrate (simulated) Confirmation Modal ───────────────── */}
            {showRecalibrateConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 animate-fadeIn">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Recalibrate Baseline?</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Your baseline metrics will be <span className="font-semibold text-pink-600">regenerated</span> based on the next 30 seconds of your live data.</p>
                  <p className="text-xs text-gray-400 mb-4">Please stay still and relaxed during the measurement for accurate results.</p>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowRecalibrateConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={handleStartRecalibrate} className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition shadow-md">Yes, Recalibrate</button>
                  </div>
                </div>
              </div>
            )}

            {/* Recalibrating Measuring Overlay */}
            {isRecalibrating && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
                  <div className="relative w-28 h-28 mx-auto mb-4">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#recalGrad)" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - recalibrateProgress / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                      <defs>
                        <linearGradient id="recalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-pink-600">{recalibrateProgress}%</span>
                      <span className="text-xs text-gray-400">{30 - Math.round(recalibrateProgress * 0.3)}s</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Measuring Your Baseline</h3>
                  <p className="text-sm text-gray-500 mb-4">Please stay calm and relaxed. We're collecting your HRV, heart rate, activity, and sleep patterns...</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Heart Rate', icon: '❤️', done: recalibrateProgress > 25 },
                      { label: 'HRV Analysis', icon: '📊', done: recalibrateProgress > 50 },
                      { label: 'Activity Scan', icon: '🏃', done: recalibrateProgress > 75 },
                      { label: 'Sleep Pattern', icon: '😴', done: recalibrateProgress > 90 },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                        item.done ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'
                      }`}>
                        <span className="text-lg">{item.icon}</span>
                        <span className={`text-sm font-medium flex-1 text-left ${item.done ? 'text-green-700' : 'text-gray-500'}`}>{item.label}</span>
                        {item.done
                          ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          : <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ONBOARDING: Setting up your wellness profile ─────────────── */}
            {wlIsFirstLoad ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading your wellness data...</p>
                </div>
              </div>
            ) : !wlHasBaseline ? (
              /* ── No baseline yet: show onboarding card ─────────────────── */
              <div className="flex items-center justify-center py-10">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
                  {/* Paw icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97 0-9-3.13-9-7 0-1.5.6-2.89 1.63-4.01M12 21c4.97 0 9-3.13 9-7 0-1.5-.6-2.89-1.63-4.01M12 21V9m0 0C10.34 9 9 7.66 9 6s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                      </svg>
                    </div>
                  </div>

                  <h2 className="text-lg font-extrabold text-gray-900 mb-2">Setting up your wellness profile</h2>

                  {!wlIsDeviceConnected ? (
                    <div className="py-6">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Device Not Connected</h3>
                        <p className="text-gray-500 max-w-xs text-sm">Please connect your HumanWatch device first to start collecting your wellness data and create your baseline.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-500 mb-4">
                        {wlBaseline?.humanBaselineEstablished
                          ? 'Your baseline is complete!'
                          : wlVitalsCount >= wlRequiredCount
                          ? 'Ready to create baseline!'
                          : `~${Math.ceil((wlRequiredCount - wlVitalsCount) * 1.5)} min remaining`}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${wlBaseline?.humanBaselineEstablished ? 100 : Math.min((wlVitalsCount / wlRequiredCount) * 95, 95)}%`,
                            background: wlBaseline?.humanBaselineEstablished
                              ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                              : wlVitalsCount >= wlRequiredCount
                              ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                              : 'linear-gradient(90deg,#ec4899,#f43f5e)'
                          }}
                        ></div>
                      </div>

                      {/* Sensitivity pill */}
                      {/* <div
                        className="inline-block px-5 py-1.5 rounded-full text-white text-sm font-bold mb-5"
                        style={{ background: wlVitalsCount >= wlRequiredCount ? '#22c55e' : '#9ca3af' }}
                      >
                        {wlVitalsCount >= wlRequiredCount
                          ? 'Ready to create baseline'
                          : `${wlVitalsCount} of ${wlRequiredCount} records — Collecting data`}
                      </div> */}

                      {/* High temp warning */}
                      {wlWeather?.temperatureCelsius > 30 && (
                        <div className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 mb-5 text-sm text-orange-600 font-semibold">
                          <span>🌡️</span>
                          <span>
                            High temp detected ({Math.round(wlWeather.temperatureCelsius)}°C) — Baseline will auto-adjust for heat
                          </span>
                        </div>
                      )}

                      {/* Create baseline button (shows when enough records are collected) */}
                      {wlVitalsCount >= wlRequiredCount ? (
                        <button
                          onClick={handleWlCreateBaseline}
                          disabled={wlIsCreatingBaseline}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-base hover:from-pink-600 hover:to-rose-600 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {wlIsCreatingBaseline ? (
                            <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Creating...</span></>
                          ) : (
                            <span>Create My Baseline ✓</span>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-base cursor-not-allowed select-none">
                          Loading...
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* ── Baseline established: show live wellness dashboard ──────── */
              <div className={`space-y-4 transition-all duration-500 ${isRecalibrating ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>

              {/* Header info row */}
              <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{wlWeather?.locationName || 'Detecting location...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedHistoricalDate ? (
                    <button
                      onClick={() => setSelectedHistoricalDate(null)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-1.5 rounded-full text-white shadow-md hover:from-blue-600 hover:to-indigo-600 transition"
                    >
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="font-semibold text-sm">Today / Live Data</span>
                    </button>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${wlActiveAlert ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span>Last updated {wlSecondsSince}s ago</span>
                    </>
                  )}
                </div>
                {wlWeather && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    <span>{Math.round(wlWeather.temperatureCelsius || 0)}°C • {wlWeather.condition || ''}</span>
                  </div>
                )}
              </div>

              {/* ── You + Dog status cards ──────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* You Card — driven by real API */}
                {(() => {
                  const hasAlert = !!wlActiveAlert;
                  const humanStatus = wlSyncScore?.humanStatus;
                  const currentHRV = wlSyncScore?.humanHRV ?? wlActiveAlert?.hrvAtAlert ?? wlStressStatus?.currentHRV ?? null;
                  const baselineHRV = wlBaseline?.avgHRV ?? null;
                  const statusLabel = humanStatus?.label ?? (hasAlert ? 'Stressed' : 'Calm');
                  const humanScore = humanStatus?.score ?? wlSyncScore?.humanHealthScore ?? null;
                  const isHumanStressed = statusLabel === 'Stressed';
                  const isHumanModerate = statusLabel === 'Moderate';
                  return (
                    <div className={`rounded-2xl p-4 shadow-sm border relative transition-all duration-700 ${
                      isHumanStressed ? 'bg-red-50 border-red-200' : isHumanModerate ? 'bg-orange-50 border-orange-100' : 'bg-blue-50/50 border-blue-100'
                    }`}>
                      <div className="absolute top-6 right-6">
                        <svg className={`w-6 h-6 ${isHumanStressed ? 'text-red-500' : isHumanModerate ? 'text-orange-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </div>
                      <div className="text-sm font-medium text-gray-500 mb-4">You</div>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-3 h-3 rounded-full ${isHumanStressed ? 'bg-red-500 animate-pulse' : isHumanModerate ? 'bg-orange-400' : 'bg-green-500'}`}></div>
                        <div className={`text-lg font-bold ${isHumanStressed ? 'text-red-600' : isHumanModerate ? 'text-orange-500' : 'text-green-700'}`}>{statusLabel}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">HRV: <span className="font-medium text-gray-900">{currentHRV != null ? `${currentHRV.toFixed(1)} ms` : '—'}</span></div>
                        {humanScore != null && <div className="text-sm text-gray-600">Health Score: <span className="font-medium text-gray-900">{humanScore}/100</span></div>}
                        {baselineHRV != null && <div className="text-xs text-gray-400">Baseline: {baselineHRV.toFixed(1)} ms</div>}
                        {currentHRV != null && baselineHRV != null && currentHRV < baselineHRV && (
                          <div className={`text-xs font-semibold mt-1 ${currentHRV < 35 ? 'text-red-500' : 'text-orange-500'}`}>
                            ↓ {(baselineHRV - currentHRV).toFixed(1)} ms below baseline
                          </div>
                        )}
                        {currentHRV != null && baselineHRV != null && currentHRV >= baselineHRV && (
                          <div className="text-xs font-semibold mt-1 text-green-600">↑ Above baseline</div>
                        )}
                        {humanStatus?.summary && <div className="text-xs text-gray-500 pt-1">{humanStatus.summary}</div>}
                      </div>
                    </div>
                  );
                })()}

                {/* Dog Card — driven by real API */}
                {!wlIsDogConnected ? (
                  <div className="rounded-2xl p-4 shadow-sm border bg-orange-50/50 border-orange-100 relative">
                    <div className="flex flex-col items-center justify-center space-y-4 py-6">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-400" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Your Dog's Device</h3>
                        <p className="text-gray-500 text-sm max-w-xs">Please connect your dog's FitBark collar to start collecting health data and create your dog's wellness baseline.</p>
                      </div>
                      <button
                        onClick={() => navigate('/integrations')}
                        className="mt-2 px-4 py-2 bg-orange-400 text-white rounded-full text-sm font-medium hover:bg-orange-500 transition-colors"
                      >
                        Connect Dog Device
                      </button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const dogStatus = wlSyncScore?.dogStatus;
                    const dogState = dogStatus?.label || wlDogVitals?.state || 'Unknown';
                    const dogCalm = dogStatus?.score ?? wlSyncScore?.dogHealthScore ?? wlDogVitals?.calmScore ?? wlSyncScore?.dogCalmScore ?? null;
                    const dogActivity = wlDogVitals?.activityScore ?? null;
                    const dogAnxious = dogState === 'Anxious' || (dogCalm != null && dogCalm < 30);
                    const dogRestless = dogState === 'Restless' || (!dogAnxious && dogCalm != null && dogCalm < 55);
                    return (
                      <div className={`rounded-2xl p-4 shadow-sm border relative transition-all duration-700 ${dogAnxious ? 'bg-red-50 border-red-200' : dogRestless ? 'bg-orange-50 border-orange-100' : 'bg-orange-50/50 border-orange-100'
                        }`}>
                        <div className="absolute top-6 right-6">
                          <svg className={`w-6 h-6 ${dogAnxious ? 'text-red-500' : dogRestless ? 'text-orange-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        </div>
                        <div className="text-sm font-medium text-gray-500 mb-4">Your Dog</div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-3 h-3 rounded-full ${dogAnxious ? 'bg-red-500' : dogRestless ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
                          <div className={`text-lg font-bold ${dogAnxious ? 'text-red-600' : dogRestless ? 'text-orange-500' : 'text-orange-500'}`}>
                            {dogCalm != null ? (dogAnxious ? 'Anxious' : dogRestless ? 'Restless' : dogState) : dogState}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dogCalm != null && <div className="text-sm text-gray-600">Health Score: <span className="font-medium text-gray-900">{dogCalm}/100</span></div>}
                          {dogActivity != null && <div className="text-sm text-gray-600">Activity: <span className="font-medium text-gray-900">{dogActivity}</span></div>}
                          {dogStatus?.summary && <div className="text-xs text-gray-500 pt-1">{dogStatus.summary}</div>}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* ── Bond Sync Score ─────────────────────────────────────────── */}
              {(wlSyncScore || (selectedHistoricalDate && calendarDateDetail)) && (() => {
                const isHistory = !!(selectedHistoricalDate && calendarDateDetail);
                const activeScore = isHistory ? calendarDateDetail.score : wlSyncScore.score;
                const activeTitle = isHistory ? calendarDateDetail.scoreTitle : wlSyncScore.scoreTitle;
                const activeDesc = isHistory ? calendarDateDetail.scoreDescription : wlSyncScore.scoreDescription;
                const activeAction = isHistory ? calendarDateDetail.scoreAction : wlSyncScore.scoreAction;
                const activeDisclaimer = isHistory ? calendarDateDetail.disclaimer : wlSyncScore.disclaimer;
                return (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                    {isHistory && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                          📅 {new Date(selectedHistoricalDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => { setSelectedHistoricalDate(null); setCalendarDateDetail(null); }}
                          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
                        >✕ Back to Today</button>
                      </div>
                    )}
                    <div className={`text-6xl font-bold mb-2 transition-colors duration-700 ${getScoreColor(activeScore)}`}>
                      {isLoadingDateDetail ? '…' : activeScore}
                    </div>
                    <div className="text-sm font-medium text-gray-500 mb-4">Bond Sync Score</div>

                    {/* Live sub-metrics (only shown for today) */}
                    {!isHistory && (
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'HRV Stability',   value: wlSyncScore.hrvStabilityScore },
                          { label: 'Shared Activity', value: wlSyncScore.sharedActivityScore },
                          { label: 'Dog Calm',         value: wlSyncScore.dogCalmScore },
                          { label: 'Sleep',            value: wlSyncScore.sleepQualityScore },
                        ].map(metric => (
                          <div key={metric.label} className="text-left space-y-2">
                            <div className="text-xs text-gray-600">{metric.label}</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-700 ${getBarColor(metric.value)}`}
                                style={{ width: `${metric.value}%` }}
                              ></div>
                            </div>
                            <div className="text-xs font-semibold text-gray-800">{metric.value}/100</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Historical metric tiles */}
                    {isHistory && calendarDateDetail.detailedMetrics && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { icon: '❤️', label: 'Avg Heart Rate', value: calendarDateDetail.detailedMetrics.avgHeartRate > 0 ? `${Math.round(calendarDateDetail.detailedMetrics.avgHeartRate)} bpm` : 'Processing...' },
                          { icon: '📡', label: 'Avg HRV', value: calendarDateDetail.detailedMetrics.avgHRV > 0 ? `${calendarDateDetail.detailedMetrics.avgHRV.toFixed(1)} ms` : 'Processing...' },
                          { icon: '👟', label: 'Total Steps', value: calendarDateDetail.detailedMetrics.totalSteps > 0 ? calendarDateDetail.detailedMetrics.totalSteps.toLocaleString() : 'Processing...' },
                          { icon: '😴', label: 'Avg Sleep (min)', value: calendarDateDetail.detailedMetrics.avgSleepScore > 0 ? `${Math.round(calendarDateDetail.detailedMetrics.avgSleepScore)} min` : 'Processing...' },
                          { icon: '🧠', label: 'Avg Stress', value: calendarDateDetail.detailedMetrics.avgStressScore > 0 ? Math.round(calendarDateDetail.detailedMetrics.avgStressScore) : 'Processing...' },
                          { icon: '📊', label: 'Data Points', value: calendarDateDetail.detailedMetrics.dataPointsCount || '--' },
                        ].map((m, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center text-center">
                            <span className="text-base mb-1">{m.icon}</span>
                            <span className="text-sm font-bold text-gray-800">{m.value}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Bond Narrative */}
                    {activeTitle && (
                      <div className="mt-10 border-t border-gray-100 pt-8 text-left">
                        <h3 className={`text-lg font-bold mb-3 ${getScoreColor(activeScore)}`}>
                          {activeTitle}
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {activeDesc}
                        </p>
                        {activeAction && (
                          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">What To Do</h4>
                            <p className="text-slate-700 text-sm leading-relaxed">{activeAction}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 italic">{activeDisclaimer}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Wellness Alert / All Good box ────────────────────────────── */}
              {/* {(() => {
                const hasAlert = !!wlActiveAlert;
                const suggestion = wlActiveAlert?.suggestion || '';
                return (
                  <div className={`rounded-2xl p-4 border shadow-sm transition-all duration-700 ${
                    hasAlert ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'
                  }`}>
                    <h3 className={`text-lg font-bold mb-2 ${hasAlert ? 'text-red-700' : 'text-green-700'}`}>
                      {hasAlert ? '⚠️ Wellness Alert!' : 'All Good! ✓'}
                    </h3>
                    <p className={`text-sm mb-4 ${hasAlert ? 'text-red-800' : 'text-green-800'}`}>
                      {hasAlert
                        ? (suggestion || 'Your stress levels are elevated. Go check on your dog — your bond needs attention! 🐾')
                        : 'Your vitals are within normal range. Keep up the great work! 💚'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hasAlert && wlActiveAlert.dogStateAtAlert && (
                        <span className="text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm bg-purple-500">
                          Dog: {wlActiveAlert.dogStateAtAlert}
                        </span>
                      )}
                      {hasAlert && wlActiveAlert.hrvAtAlert != null && (
                        <span className="text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm bg-red-500">
                          HRV: {wlActiveAlert.hrvAtAlert.toFixed(1)} ms
                        </span>
                      )}
                      {!hasAlert && (
                        <>
                          <span className="text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm bg-green-500">
                            HRV: {(wlStressStatus?.currentHRV ?? wlBaseline?.avgHRV ?? 0).toFixed(1)} ms
                          </span>
                          <span className="text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm bg-green-600">✓ Normal</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      {hasAlert
                        ? `Monitoring your vitals... We'll let you know when you're back to normal.`
                        : `We're continuously monitoring your wellness. Stay calm and connected with your dog.`}
                    </p>
                  </div>
                );
              })()} */}

              {/* ── Baseline Info Card ───────────────────────────────────────── */}
              {(wlBaseline || (selectedHistoricalDate && calendarDateDetail?.detailedMetrics)) && (() => {
                const isHistory = !!(selectedHistoricalDate && calendarDateDetail?.detailedMetrics);
                const m = isHistory ? calendarDateDetail.detailedMetrics : null;
                return (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    {/* High-temp notice — live only */}
                    {!isHistory && wlWeather?.temperatureCelsius > 30 && (
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 mb-4 text-sm text-orange-600 font-semibold">
                        <span>🌡️</span>
                        <span>
                          {Math.round(wlWeather.temperatureCelsius)}°C detected — HR +{((wlWeather.temperatureCelsius - 30) * 0.5).toFixed(1)} bpm and
                          HRV -{((wlWeather.temperatureCelsius - 30) * 0.3).toFixed(1)} ms adjustment applied
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Avg HR</div>
                        <div className="text-lg font-bold text-gray-900">
                          {isHistory ? `${Math.round(m.avgHeartRate ?? 0)} bpm` : `${Math.round(wlBaseline.avgHeartRate ?? 0)} bpm`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Avg HRV</div>
                        <div className="text-lg font-bold text-gray-900">
                          {isHistory ? `${(m.avgHRV ?? 0).toFixed(1)} ms` : `${(wlBaseline.avgHRV ?? 0).toFixed(1)} ms`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">{isHistory ? 'Total Steps' : 'Avg Steps'}</div>
                        <div className="text-lg font-bold text-gray-900">
                          {isHistory ? Math.round(m.totalSteps ?? 0).toLocaleString() : Math.round(wlBaseline.avgSteps ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Sleep Score</div>
                        <div className="text-lg font-bold text-gray-900">
                          {isHistory ? Math.round(m.avgSleepScore ?? 0) : Math.round(wlBaseline.avgSleepScore ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Progress Calendar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Progress Calendar</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={backfillLast30DaysSummaries}
                      disabled={isBackfillingCalendar || isLoadingCalendar}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isBackfillingCalendar ? 'Backfilling...' : 'Backfill Last 30 Days'}
                    </button>
                    <select
                      value={progressTimeframe}
                      onChange={(e) => setProgressTimeframe(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none"
                    >
                      <option value="this-week">This Week</option>
                      <option value="last-week">Last Week</option>
                      <option value="this-month">This Month</option>
                    </select>
                  </div>
                </div>

              {(() => {
                const today = new Date();
                const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                // We use historicalScoresMap directly from component state
                const mockScores = historicalScoresMap;

                const getDotColor = (score) => {
                  if (score === null || score === undefined) return 'bg-gray-200';
                  if (score >= 70) return 'bg-green-500';
                  if (score >= 50) return 'bg-orange-400';
                  return 'bg-red-500';
                };
                const getScoreTextColor = (score) => {
                  if (score === null || score === undefined) return 'text-gray-300';
                  if (score >= 70) return 'text-green-600';
                  if (score >= 50) return 'text-orange-500';
                  return 'text-red-500';
                };
                const getCellBg = (score, isToday, isSelected) => {
                  if (isSelected) return 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300 transform scale-105 shadow-md';
                  if (isToday) return 'bg-blue-50 border-blue-300 ring-2 ring-blue-200';
                  if (score === null || score === undefined) return 'bg-gray-50 border-gray-100 hover:border-gray-200';
                  if (score >= 70) return 'bg-green-50 border-green-100 hover:border-green-200';
                  if (score >= 50) return 'bg-orange-50 border-orange-100 hover:border-orange-200';
                  return 'bg-red-50 border-red-100 hover:border-red-200';
                };

                const handleDateClick = (dateObj, isFuture) => {
                  if (isFuture) return;
                  const dateStr = formatLocalDate(dateObj);
                  const todayStr = formatLocalDate(today);
                  if (dateStr === todayStr) {
                    setSelectedHistoricalDate(null);
                    setCalendarDateDetail(null);
                  } else {
                    setSelectedHistoricalDate(dateStr);
                    fetchDateDetail(dateStr);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                };

                if (progressTimeframe === 'this-month') {
                  // Full calendar grid for current month
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  while (cells.length % 7 !== 0) cells.push(null);

                  return (
                    <div>
                      <p className="text-center text-sm font-semibold text-gray-600 mb-4">{monthName}</p>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_NAMES.map(d => (
                          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, idx) => {
                          if (!day) return <div key={`empty-${idx}`} className="h-16" />;
                          // Match the ISO date logic used for keys
                          const dObj = new Date(year, month, day);
                          const dateKey = formatLocalDate(dObj);
                          
                          const score = mockScores[dateKey];
                          const isToday = dObj.toDateString() === today.toDateString();
                          const isFuture = dObj > today;
                          const isSelected = dateKey === selectedHistoricalDate;
                          return (
                            <div 
                              key={dateKey} 
                              onClick={() => handleDateClick(dObj, isFuture)}
                              className={`h-16 rounded-xl border p-1 flex flex-col items-center justify-between transition-all duration-300 ${!isFuture ? 'cursor-pointer hover:-translate-y-1' : ''} ${isFuture ? 'bg-gray-50 border-gray-100 opacity-40' : getCellBg(score, isToday, isSelected)}`}
                            >
                              <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>{day}</span>
                              {!isFuture && (
                                <>
                                  <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(score)}`}></div>
                                  <span className={`text-[10px] font-semibold ${getScoreTextColor(score)}`}>
                                    {score != null ? score : '--'}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Weekly view (this-week / last-week)
                const dayOfWeek = today.getDay();
                const startOfThisWeek = new Date(today);
                startOfThisWeek.setDate(today.getDate() - dayOfWeek + 1); // Monday start
                const startDate = new Date(startOfThisWeek);
                if (progressTimeframe === 'last-week') startDate.setDate(startDate.getDate() - 7);

                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(startDate);
                  d.setDate(startDate.getDate() + i);
                  return d;
                });

                return (
                  <div>
                    <p className="text-center text-sm font-semibold text-gray-600 mb-4">
                      {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((d, i) => {
                        const dateKey = formatLocalDate(d);
                        const score = mockScores[dateKey];
                        const isToday = d.toDateString() === today.toDateString();
                        const isFuture = d > today;
                        const isSelected = dateKey === selectedHistoricalDate;
                        return (
                          <div 
                            key={dateKey} 
                            onClick={() => handleDateClick(d, isFuture)}
                            className={`rounded-2xl border p-3 flex flex-col items-center space-y-2 transition-all duration-300 ${!isFuture ? 'cursor-pointer hover:-translate-y-1' : ''} ${isFuture ? 'bg-gray-50 border-gray-100 opacity-40' : getCellBg(score, isToday, isSelected)}`}
                          >
                            <span className="text-xs font-semibold text-gray-400">{DAY_NAMES[(d.getDay())]}</span>
                            <span className={`text-lg font-bold ${isToday ? 'text-blue-600' : isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{d.getDate()}</span>
                            {!isFuture && <div className={`w-3 h-3 rounded-full ${getDotColor(score)}`}></div>}
                            {!isFuture && (
                              <span className={`text-xs font-bold ${getScoreTextColor(score)}`}>{score != null ? score : '--'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Legend */}
              <div className="flex justify-center space-x-6 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span>Calm (≥70)</span></div>
                <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div><span>Moderate (50–69)</span></div>
                <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span>Stressed (&lt;50)</span></div>
                <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div><span>No data</span></div>
              </div>

              {/* Date detail is shown in the main dashboard area above, not here */}
              {false && (
                <div id="calendar-detail-panel" className="mt-4 pt-6 border-t border-gray-100">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-gray-800">
                      📅 {new Date(selectedHistoricalDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <button
                      onClick={() => { setSelectedHistoricalDate(null); setCalendarDateDetail(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {isLoadingDateDetail ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm text-gray-500">Loading data...</span>
                    </div>
                  ) : calendarDateDetail ? (
                    <div className="space-y-4">
                      {/* Bond Sync Score */}
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-extrabold ${
                          calendarDateDetail.score >= 70 ? 'text-green-500'
                          : calendarDateDetail.score >= 50 ? 'text-orange-400'
                          : 'text-red-500'
                        }`}>{calendarDateDetail.score}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{calendarDateDetail.scoreTitle}</p>
                          <p className="text-xs text-gray-400">
                            Bond Sync Score · {calendarDateDetail.trend === 'realtime' ? 'Live data' : `Trend: ${calendarDateDetail.trend ?? 'stable'}`}
                          </p>
                        </div>
                      </div>

                      {/* Metrics grid — real values from HumanDailySummaries, 'Processing...' if null/0 */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            label: 'Avg Heart Rate',
                            value: calendarDateDetail.detailedMetrics?.avgHeartRate > 0
                              ? `${Math.round(calendarDateDetail.detailedMetrics.avgHeartRate)} bpm`
                              : 'Processing...',
                            icon: '❤️',
                            hasData: calendarDateDetail.detailedMetrics?.avgHeartRate > 0
                          },
                          {
                            label: 'Avg HRV',
                            value: calendarDateDetail.detailedMetrics?.avgHRV > 0
                              ? `${calendarDateDetail.detailedMetrics.avgHRV.toFixed(1)} ms`
                              : 'Processing...',
                            icon: '📡',
                            hasData: calendarDateDetail.detailedMetrics?.avgHRV > 0
                          },
                          {
                            label: 'Total Steps',
                            value: calendarDateDetail.detailedMetrics?.totalSteps > 0
                              ? calendarDateDetail.detailedMetrics.totalSteps.toLocaleString()
                              : 'Processing...',
                            icon: '👟',
                            hasData: calendarDateDetail.detailedMetrics?.totalSteps > 0
                          },
                          {
                            label: 'Avg Sleep (min)',
                            value: calendarDateDetail.detailedMetrics?.avgSleepScore > 0
                              ? `${Math.round(calendarDateDetail.detailedMetrics.avgSleepScore)} min`
                              : 'Processing...',
                            icon: '😴',
                            hasData: calendarDateDetail.detailedMetrics?.avgSleepScore > 0
                          },
                          {
                            label: 'Avg Stress',
                            value: calendarDateDetail.detailedMetrics?.avgStressScore > 0
                              ? Math.round(calendarDateDetail.detailedMetrics.avgStressScore)
                              : 'Processing...',
                            icon: '🧠',
                            hasData: calendarDateDetail.detailedMetrics?.avgStressScore > 0
                          },
                          {
                            label: 'Data Points',
                            value: calendarDateDetail.detailedMetrics?.dataPointsCount > 0
                              ? calendarDateDetail.detailedMetrics.dataPointsCount
                              : '--',
                            icon: '📊',
                            hasData: true
                          },
                        ].map((m, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center text-center">
                            <span className="text-lg mb-1">{m.icon}</span>
                            <span className={`text-sm font-bold ${m.hasData ? 'text-gray-800' : 'text-gray-400 text-xs italic'}`}>{m.value}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{m.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* What This Means */}
                      {calendarDateDetail.scoreDescription && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-blue-700 mb-1">What This Means</p>
                          <p className="text-xs text-blue-800 leading-relaxed">{calendarDateDetail.scoreDescription}</p>
                        </div>
                      )}

                      {/* What To Do */}
                      {calendarDateDetail.scoreAction && (
                        <div className="bg-green-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-green-700 mb-1">What To Do</p>
                          <p className="text-xs text-green-800 leading-relaxed">{calendarDateDetail.scoreAction}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-lg mb-3">📭</div>
                      <p className="text-sm font-semibold text-gray-600">No data available for this date</p>
                      <p className="text-xs text-gray-400 mt-1">Daily summary has not been generated yet for this day</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
            )}
          </>
        )}



        {/* Bond Building Tab Content */}
        {activeTab === 'bond-building' && (
          <div className="space-y-4">
            {/* Bonded Score Card */}
            <div className="mb-4">
              <div className="bg-purple-50 rounded-2xl p-4 shadow-lg relative overflow-hidden">
                {/* Content Container */}
                <div className="flex items-start justify-between relative z-10">
                  {/* Left Section - Title and Subtitle */}
                  <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900 mb-2">
                      Bonded Score<sup className="text-lg">™</sup>
                    </h1>
                    <p className="text-lg text-purple-600">Growing Connection</p>

                    {/* Key Metrics - Bottom Section */}
                    <div className="flex space-x-8 mt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 mb-1">
                          {Object.values(ritualCheckboxes).filter(Boolean).length + completedActivityIds.size}
                        </div>
                        <div className="text-sm text-gray-900">Activities Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 mb-1">{hoursTogether}h</div>
                        <div className="text-sm text-gray-900">Time Together</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 mb-1">7</div>
                        <div className="text-sm text-gray-900">Chakra Harmony</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Orange Circle with Score */}
                  <div className="flex-shrink-0 ml-8 relative">
                    <div className="relative">
                      {/* Orange Gradient Circle */}
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-xl flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{bondedScore}</span>
                      </div>
                      {/* Yellow Star Icon */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full mb-4">
              <button
                onClick={() => setBondTab('checkins')}
                className={`flex-1 px-4 py-3 rounded-md transition-colors ${bondTab === 'checkins'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Check-ins
              </button>
              <button
                onClick={() => setBondTab('daily-rituals')}
                className={`flex-1 px-4 py-3 rounded-md transition-colors ${bondTab === 'daily-rituals'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Daily Rituals
              </button>
              <button
                onClick={() => setBondTab('Chakra-sync')}
                className={`flex-1 px-4 py-3 rounded-md transition-colors ${bondTab === 'Chakra-sync'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Chakra Sync
              </button>
              <button
                onClick={() => setBondTab('activities')}
                className={`flex-1 px-4 py-3 rounded-md transition-colors ${bondTab === 'activities'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Activities
              </button>
              {/* <button
                onClick={() => setBondTab('insights')}
                className={`flex-1 px-4 py-3 rounded-md transition-colors ${bondTab === 'insights'
                    ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Insights
              </button> */}
            </div>

            {/* Daily Rituals Tab Content */}
            {bondTab === 'daily-rituals' && (
              <>
                {/* Strengthen Your Bond Section */}
                <div className="bg-green-50 rounded-xl p-4 mb-4">
                  {(() => {
                    const completedCount = rituals.filter(r => r.isCompleted).length;
                    const totalRituals = rituals.length;
                    console.log('🎯 Progress Calculation:', { completedCount, totalRituals, rituals });
                    
                    // Handle empty rituals case
                    if (totalRituals === 0) {
                      console.warn('⚠️ No rituals available for today');
                      return (
                        <div className="bg-green-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Today's Spiritual Practice</h3>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">No rituals today</span>
                          </div>
                          <p className="text-gray-600 text-center py-4">No rituals suggested for today. Check back later!</p>
                        </div>
                      );
                    }
                    
                    const completionPercentage = Math.round((completedCount / totalRituals) * 100);
                    const progressBarWidth = (completedCount / totalRituals) * 100;
                    console.log('📊 Completion %:', completionPercentage, 'Progress bar width:', progressBarWidth);

                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Today's Spiritual Practice</h3>
                          </div>
                          {dailyBonusEarned ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Daily Bonus Complete!</span>
                          ) : (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Earn +2 pts today</span>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Daily Progress</span>
                            <span className="text-sm font-medium text-green-600">{completedCount}/{totalRituals} completed</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-700 h-2 rounded-full transition-all duration-300" style={{ width: `${progressBarWidth}%` }}></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          {/* Simplified stats for now since points are centralized */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600 mb-1">{completionPercentage}%</div>
                            <div className="text-sm text-gray-600">Complete</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Morning Rituals */}
                <div className="bg-yellow-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Morning Rituals</h3>
                  </div>

                  <div className="space-y-4">
                    {rituals.filter(r => r.category === 'Morning').length === 0 && <p className="text-sm text-gray-500 italic">No morning rituals found.</p>}
                    {rituals.filter(r => r.category === 'Morning').map(ritual => (
                      <div key={ritual.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={ritual.isCompleted}
                            onChange={() => handleRitualToggle(ritual.id, ritual.isCompleted)}
                            className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${ritual.isCompleted ? 'text-green-700' : 'text-gray-900'}`}>{ritual.title}</h4>
                            <p className="text-sm text-gray-600">{ritual.description}</p>
                            {ritual.isCompleted && (
                              <div className="flex items-center space-x-2 mt-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600">Completed</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{ritual.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Afternoon Rituals */}
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Afternoon Rituals</h3>
                  </div>

                  <div className="space-y-4">
                    {rituals.filter(r => r.category === 'Afternoon').length === 0 && <p className="text-sm text-gray-500 italic">No afternoon rituals found.</p>}
                    {rituals.filter(r => r.category === 'Afternoon').map(ritual => (
                      <div key={ritual.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={ritual.isCompleted}
                            onChange={() => handleRitualToggle(ritual.id, ritual.isCompleted)}
                            className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${ritual.isCompleted ? 'text-green-700' : 'text-gray-900'}`}>{ritual.title}</h4>
                            <p className="text-sm text-gray-600">{ritual.description}</p>
                            {ritual.isCompleted && (
                              <div className="flex items-center space-x-2 mt-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600">Completed</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{ritual.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evening Rituals */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.57.46-3.03 1.24-4.26C6.11 9.5 8.89 11 12 11s5.89-1.5 6.76-3.26C19.54 8.97 20 10.43 20 12c0 4.41-3.59 8-8 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Evening Rituals</h3>
                  </div>

                  <div className="space-y-4">
                    {rituals.filter(r => r.category === 'Evening').length === 0 && <p className="text-sm text-gray-500 italic">No evening rituals found.</p>}
                    {rituals.filter(r => r.category === 'Evening').map(ritual => (
                      <div key={ritual.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={ritual.isCompleted}
                            onChange={() => handleRitualToggle(ritual.id, ritual.isCompleted)}
                            className="w-5 h-5 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${ritual.isCompleted ? 'text-green-700' : 'text-gray-900'}`}>{ritual.title}</h4>
                            <p className="text-sm text-gray-600">{ritual.description}</p>
                            {ritual.isCompleted && (
                              <div className="flex items-center space-x-2 mt-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600">Completed</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{ritual.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Rituals Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveRituals}
                    disabled={isRitualLoading || !rituals.some(r => r.isCompleted && !r.originallyCompleted)}
                    className={`px-4 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${isRitualLoading
                      ? 'bg-gray-400 cursor-not-allowed transform-none'
                      : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                      }`}
                  >
                    {isRitualLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Rituals</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Check-ins Tab Content */}
            {bondTab === 'checkins' && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Check-in</h3>

                {/* Dynamic check-ins from API */}
                {checkInItems.map((ci, idx) => {
                  const id = ci.checkInId;
                  const question = ci.questions;
                  const isHours = (question || '').toLowerCase().includes('hours spent');
                  const max = isHours ? 10 : 10;  // Backend counts max 10 hours
                  const isBehavior = (question || '').toLowerCase().includes('behavior');
                  const defaultValue = 0;  // All sliders start at 0
                  const value = ratingsById[id] ?? defaultValue;
                  const widthPct = Math.min(100, Math.max(0, (value / max) * 100));
                  const barClasses = [
                    'from-blue-500 to-cyan-500',
                    'from-orange-500 to-yellow-500',
                    'from-purple-500 to-pink-500',
                    'from-green-500 to-emerald-500'
                  ][idx % 4];
                  return (
                    <div className="mb-4" key={id}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-900">{question} ({value}/{max})</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${barClasses} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={max}
                          value={value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            console.log(`📊 Slider changed: ${question.substring(0, 30)}... = ${val}`);
                            setRatingsById(prev => ({ ...prev, [id]: val }));
                            if (isHours) setHoursTogether(val);
                          }}
                          className="absolute top-0 w-full h-6 opacity-0 cursor-pointer z-10"
                          style={{ marginTop: '-8px' }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                          <span>{ci.lowEnergyLabel || (isHours ? '0 Hours' : 'Low')}</span>
                          <span>{ci.highEnergyLabel || (isHours ? '10+ Hours' : 'High')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Save Button (visible in Check-ins tab) */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveDailyCheckin}
                    disabled={isSavingCheckin}
                    className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors ${isSavingCheckin
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                  >
                    {isSavingCheckin ? 'Saving...' : 'Save Daily Check-in'}
                  </button>
                </div>
              </div>
            )}



            {/* Chakra Sync Tab Content */}
            {bondTab === 'Chakra-sync' && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                {!showRitualView && !showProgressView && (
                  <>
                    {/* Header */}
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Chakra Alignment Meditation</h3>
                      <p className="text-gray-600">Sync your energy centers with your companion</p>
                    </div>

                    {/* Dog Behavior Input - REVERTED per user request */}


                    {/* Chakra List */}
                    <div className="space-y-4 mb-4">
                      {/* Root Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          1
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-orange-600">Root Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{rootChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(rootChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={rootChakra}
                              onChange={(e) => setRootChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-md"></div>
                      </div>

                      {/* Sacral Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          2
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Sacral Chakra</span>
                            <span className="text-sm font-medium text-green-600">{sacralChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(sacralChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={sacralChakra}
                              onChange={(e) => setSacralChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-full shadow-md"></div>
                      </div>

                      {/* Solar Plexus Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          3
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-yellow-600">Solar Plexus Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{solarPlexusChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(solarPlexusChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={solarPlexusChakra}
                              onChange={(e) => setSolarPlexusChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 rounded-full shadow-md"></div>
                      </div>

                      {/* Heart Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          4
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Heart Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{heartChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(heartChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={heartChakra}
                              onChange={(e) => setHeartChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                      </div>

                      {/* Throat Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          5
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Throat Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{throatChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(throatChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={throatChakra}
                              onChange={(e) => setThroatChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full shadow-md"></div>
                      </div>

                      {/* Third Eye Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          6
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Third Eye Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{thirdEyeChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(thirdEyeChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={thirdEyeChakra}
                              onChange={(e) => setThirdEyeChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-full shadow-md"></div>
                      </div>

                      {/* Crown Chakra */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          7
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Crown Chakra</span>
                            <span className="text-sm font-medium text-gray-900">{crownChakra}/10</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-violet-500 via-violet-600 to-violet-700 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(crownChakra / 10) * 100}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={crownChakra}
                              onChange={(e) => setCrownChakra(parseInt(e.target.value))}
                              className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 rounded-full shadow-md"></div>
                      </div>
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={handleChakraSync}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Sync Chakras & Get Recommendation</span>
                    </button>
                  </>
                )}

                {showRitualView && !showProgressView && (
                  <>
                    {/* Ritual View */}
                    <div className="text-center mb-4">
                      {/* Header with star icons */}
                      <div className="flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <h3 className="text-lg font-bold text-purple-800">{suggestedRitual || 'Chakra Sync Ritual'}</h3>
                        <svg className="w-6 h-6 text-purple-600 ml-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>

                      {/* Subtitle */}
                      <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
                        {ritualDescription || "Align your energy centers with your companion through guided meditation. This sacred practice will deepen your spiritual connection and harmonize your energies."}
                      </p>

                      {/* Harmony Score Display */}
                      {harmonyScore > 0 && (
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4 max-w-md mx-auto">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Your Chakra Harmony Score</p>
                            <p className="text-lg font-bold text-purple-600">{Math.round(harmonyScore)}/10</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {harmonyScore >= 8 ? '✨ Excellent harmony!' : harmonyScore >= 6 ? '🌟 Good balance' : '💫 Room for improvement'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Duration */}
                      <p className="text-purple-600 font-medium">Total Duration: 9 minutes</p>
                    </div>

                    {/* Chakra Circles */}
                    <div className="flex justify-center space-x-4 mb-4">
                      {/* Root */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Root</span>
                      </div>

                      {/* Sacral */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Sacral</span>
                      </div>

                      {/* Solar */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Solar</span>
                      </div>

                      {/* Heart */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Heart</span>
                      </div>

                      {/* Throat */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Throat</span>
                      </div>

                      {/* Third */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Third</span>
                      </div>

                      {/* Crown */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-violet-500 border-2 border-white rounded-full flex items-center justify-center mb-2 mx-auto">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Crown</span>
                      </div>
                    </div>

                    {/* What to expect section */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">What to expect:</h4>
                      <ul className="space-y-2 text-left">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Guided breathing for each chakra</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Positive affirmations for alignment</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Energy visualization techniques</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">Synchronized connection with your dog</span>
                        </li>
                      </ul>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={handleBackFromRitual}
                        className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                      </button>

                      <button
                        onClick={handleBeginRitual}
                        className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                      >
                        <span>Begin Ritual</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}

                {showProgressView && (
                  <>
                    {/* Progress View */}
                    <div className="space-y-4">
                      {/* Header Section */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Chakra Healing Ritual</h3>
                          <span className="text-purple-600 font-semibold">Focused Session</span>
                        </div>
                        <div className="w-full bg-purple-100 rounded-full h-3 mb-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Recommended for you</span>
                        </div>
                      </div>

                      {/* Main Chakra Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        {/* Chakra Header */}
                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center mb-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${recommendedChakra?.color === 'red' ? 'bg-red-500' :
                              recommendedChakra?.color === 'orange' ? 'bg-orange-500' :
                                recommendedChakra?.color === 'yellow' ? 'bg-yellow-500' :
                                  recommendedChakra?.color === 'green' ? 'bg-green-500' :
                                    recommendedChakra?.color === 'blue' ? 'bg-blue-500' :
                                      recommendedChakra?.color === 'indigo' ? 'bg-indigo-500' :
                                        recommendedChakra?.color === 'purple' ? 'bg-purple-500' :
                                          'bg-gray-500'
                              }`}></div>
                            <h4 className={`text-lg font-semibold ${recommendedChakra?.color === 'red' ? 'text-red-600' :
                              recommendedChakra?.color === 'orange' ? 'text-orange-600' :
                                recommendedChakra?.color === 'yellow' ? 'text-yellow-600' :
                                  recommendedChakra?.color === 'green' ? 'text-green-600' :
                                    recommendedChakra?.color === 'blue' ? 'text-blue-600' :
                                      recommendedChakra?.color === 'indigo' ? 'text-indigo-600' :
                                        recommendedChakra?.color === 'purple' ? 'text-purple-600' :
                                          'text-gray-600'
                              }`}>
                              {recommendedChakra?.name || 'Root Chakra'}
                            </h4>
                            <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                          </div>
                          <p className="text-sm text-gray-600">{recommendedChakra?.location || 'Base of spine'}</p>
                        </div>

                        {/* Harmony Score Display */}
                        {harmonyScore > 0 && (
                          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4 max-w-md mx-auto">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 mb-1">Your Chakra Harmony Score</p>
                              <p className="text-lg font-bold text-purple-600">{Math.round(harmonyScore)}/10</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {harmonyScore >= 8 ? '✨ Excellent harmony!' : harmonyScore >= 6 ? '🌟 Good balance' : '💫 Room for improvement'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Chakra Visualization */}
                        <div className="text-center mb-4">
                          <div className={`w-32 h-32 bg-${recommendedChakra?.color || 'red'}-500 border-4 border-white rounded-full mx-auto mb-4 shadow-lg flex items-center justify-center animate-pulse`}>
                            {isPlaying && (
                              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>

                          {/* Progress Bar & Timer */}
                          <div className="max-w-xs mx-auto mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                              <span>{formatTime(audioCurrentTime)}</span>
                              <span>{formatTime(audioDuration)}</span>
                            </div>
                            <input
                              type="range"
                              value={audioProgress}
                              onChange={handleSeek}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>

                          <div className="text-lg font-bold text-gray-900 mb-2 font-mono">
                            {isPlaying ? formatTime(audioCurrentTime) : (recommendedChakra?.timer || '1:00')}
                          </div>
                          <p className="text-sm text-gray-600 italic">"{recommendedChakra?.breathing || 'Deep, slow breaths'}"</p>
                        </div>

                        {/* Affirmation */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 transform transition-all hover:scale-102">
                          <p className="text-center text-purple-800 font-medium italic">
                            "{recommendedChakra?.affirmation || 'I am grounded and secure'}"
                          </p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-center items-center space-x-4">
                          <button
                            onClick={handlePreviousChakra}
                            disabled={currentChakraStep === 1}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${currentChakraStep === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:scale-110'
                              }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          <button
                            onClick={handlePlayAudio}
                            className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'} text-white px-4 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-3`}
                          >
                            {isPlaying ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                            <span className="text-lg">{isPlaying ? 'Pause' : 'Start Ritual'}</span>
                          </button>

                          <button
                            onClick={handleResetAudio}
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all hover:rotate-180"
                            title="Reset Audio"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>

                          <button
                            onClick={handleNextChakra}
                            disabled={currentChakraStep === 7}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${currentChakraStep === 7
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:scale-110'
                              }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Meditation Instructions */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">Meditation Instructions:</h4>
                        <ol className="space-y-2 text-blue-800">
                          {chakraData[currentChakraStep - 1].instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start">
                              <span className="font-semibold mr-2">{index + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Back Button */}
                      <div className="flex justify-start">
                        <button
                          onClick={handleBackFromProgress}
                          className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Back</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}

            {bondTab === 'activities' && (
              <div className="space-y-4">
                {/* Header Section */}
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Bonding Activities</h2>
                  <p className="text-lg text-gray-600">Complete activities to strengthen your spiritual connection</p>
                </div>

                {/* Activities List */}
                <div className="space-y-4">
                  {isLoadingActivities ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 text-center text-gray-600">
                      Loading bonding activities...
                    </div>
                  ) : activitiesError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                      {activitiesError}
                    </div>
                  ) : bondingActivities.length === 0 ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 text-center text-gray-600">
                      No bonding activities available right now. Please check back later.
                    </div>
                  ) : (
                    bondingActivities.map((activity) => {
                      const category = activity.category || 'Physical';
                      const interactionType = activity.interactionType || 'Checkbox';

                      // Check by ID (string/int safe comparison needed?)
                      // Assuming IDs are Guids (strings) in both Activity and UserLog
                      const activityId = normalizeId(activity.activityId);
                      const isCompleted = completedActivityIds.has(activityId);

                      const handleActivityClick = () => {
                        // 1. Prevent action if already completed (Read-Only)
                        if (isCompleted) return;

                        // 2. Handle Logic based on InteractionType
                        if (interactionType === 'Redirect') {
                          // Use legacy name mapping for specific routes if needed
                          if (activity.activityName === 'Chakra Sync') {
                            // Switch to Bond Building -> Chakra Rituals
                            // Setup state for Chakra Rituals view if needed, or just navigate
                            // Since it's on the same page, we might need to change tabs/state
                            setActiveTab('bond-building');
                            setBondTab('Chakra-sync');
                            // If it relies on a route, navigate there. 
                            // But DashboardPage seems to handle all tabs.
                            // Let's assume we just switch tabs.
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          if (activity.activityName === 'Synchronized Breathing' || activity.activityName === 'Meditation Together') {
                            setActiveTab('meditation');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          if (activity.activityName === 'Energy Check-in') {
                            setActiveTab('bond-building');
                            setBondTab('checkins');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          if (activity.activityName === 'Bedtime Blessing') {
                            setActiveTab('bond-building');
                            setBondTab('daily-rituals');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                        }

                        // 3. Handle Input/Reflection
                        if (interactionType === 'Input') {
                          setActiveReflectionActivity(activity);
                          setReflectionText('');
                          setShowReflectionModal(true);
                          return;
                        }

                        // 4. Default: Physical Activities (Toggle)
                        // Note: only persist to localStorage after server Save, not on click
                        setCompletedActivityIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(activityId)) {
                            newSet.delete(activityId);
                          } else {
                            newSet.add(activityId);
                          }
                          return newSet;
                        });
                      };

                      return (
                        <div
                          key={activity.activityId}
                          onClick={handleActivityClick}
                          className={`rounded-xl p-4 border transition-colors ${isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                              >
                                {isCompleted ? (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    />
                                  </svg>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-600">+{ritualPointsMap[activity.activityName] || activity.points}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{activity.activityName}</h3>
                                <p className="text-sm text-gray-600">+{ritualPointsMap[activity.activityName] || activity.points} bonding points</p>
                              </div>
                            </div>
                            {isCompleted ? (
                              <div className="text-green-600 font-medium">Completed</div>
                            ) : (
                              <div className="text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                </div>

                {/* Save Activities Button */}
                {bondingActivities.length > 0 && (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSaveActivities}
                      disabled={isSavingActivities || completedActivityIds.size === 0}
                      className={`px-4 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${isSavingActivities || completedActivityIds.size === 0
                        ? 'bg-gray-400 cursor-not-allowed transform-none'
                        : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                        }`}
                    >
                      {isSavingActivities ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Activities</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bond Building Insights Content - Commented out
            {bondTab === 'insights' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Weekly Trend</h3>
                        <p className="text-sm text-gray-600">Your bond has improved 15% this week</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Best Time for Bonding</h3>
                        <p className="text-sm text-gray-600">Your highest scores occur during morning sessions</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Recommendation</h3>
                        <p className="text-sm text-gray-600">Try synchronized breathing exercises to improve alignment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            */}
          </div>
        )}

        {/* Meditation Tab Content */}
        {activeTab === 'meditation' && (
          <div className="w-full">
            {/* Left Section - Synchronized Breathing */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {/* Header */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Synchronized Breathing</h3>
              </div>

              <p className="text-gray-600 mb-4">Align your breath with your companion's natural rhythm</p>

              {/* Breathing Pattern */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Breathing Pattern</label>
                <div className="relative">
                  <button
                    onClick={() => !isBreathingSessionActive && setShowBreathingDropdown(!showBreathingDropdown)}
                    disabled={isBreathingSessionActive}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center bg-white ${isBreathingSessionActive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <span className="text-gray-900">
                      {breathingPatterns.find(pattern => pattern.id === selectedBreathingPattern)?.name || 'Loading...'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showBreathingDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showBreathingDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {breathingPatterns.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => {
                            setSelectedBreathingPattern(pattern.id);
                            setShowBreathingDropdown(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 flex justify-between items-center ${selectedBreathingPattern === pattern.id ? 'bg-purple-50' : ''
                            }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{pattern.name}</div>
                            <div className="text-sm text-gray-500">{pattern.description}</div>
                          </div>
                          {selectedBreathingPattern === pattern.id && (
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {breathingPatterns.find(p => p.id === selectedBreathingPattern)?.description}
                </p>
              </div>

              {/* Target Cycles */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Cycles</label>
                  <div className="relative">
                    <button
                      onClick={() => !isBreathingSessionActive && setShowTargetCyclesDropdown(!showTargetCyclesDropdown)}
                      disabled={isBreathingSessionActive}
                      className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center transition-colors ${isBreathingSessionActive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    >
                      <span className="text-gray-700 text-sm">
                        {targetCycles.find(cycle => cycle.id === selectedTargetCycles)?.cycles} {targetCycles.find(cycle => cycle.id === selectedTargetCycles)?.durationDescription}
                      </span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${showTargetCyclesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showTargetCyclesDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {targetCycles.map((cycle) => (
                          <button
                            key={cycle.id}
                            onClick={() => {
                              setSelectedTargetCycles(cycle.id);
                              setShowTargetCyclesDropdown(false);
                            }}
                            className={`w-full p-3 text-left hover:bg-gray-50 flex justify-between items-center ${selectedTargetCycles === cycle.id ? 'bg-purple-50' : ''
                              }`}
                          >
                            <span className="text-gray-900">{cycle.cycles} cycles {cycle.durationDescription}</span>
                            {selectedTargetCycles === cycle.id && (
                              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Breathing Visualizer */}
              <div className="text-center mb-4 h-64 flex flex-col items-center justify-center">
                <motion.div
                  className="bg-gradient-to-br from-blue-400 to-blue-200 rounded-full mb-4 flex items-center justify-center shadow-lg relative"
                  style={{ borderRadius: "50%" }} // Force circle shape
                  animate={
                    isBreathingSessionActive
                      ? {
                        width: breathingPhase === 'inhale' ? 220 : 160,
                        height: breathingPhase === 'inhale' ? 220 : 160,
                        opacity: breathingPhase === 'inhale' ? 1 : 0.8,
                        scale: breathingPhase === 'inhale' ? 1.1 : 1, // Add scale for better effect
                      }
                      : { width: 160, height: 160, opacity: 0.8, scale: 1 }
                  }
                  transition={{
                    duration: isBreathingSessionActive
                      ? (breathingPhase === 'inhale'
                        ? (breathingPatterns.find(p => p.id === selectedBreathingPattern)?.timings?.inhale || 4)
                        : breathingPhase === 'exhale'
                          ? (breathingPatterns.find(p => p.id === selectedBreathingPattern)?.timings?.exhale || 8)
                          : 0.5) // Faster transition for hold
                      : 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-white text-lg font-medium">
                      {!isBreathingSessionActive
                        ? "Ready"
                        : breathingPhase === 'inhale'
                          ? "Breathe In..."
                          : breathingPhase === 'hold'
                            ? "Hold..."
                            : breathingPhase === 'exhale'
                              ? "Breathe Out..."
                              : "Hold..."}
                    </span>
                    {isBreathingSessionActive && (
                      <span className="text-white text-sm mt-1">{timeLeftInPhase}s</span>
                    )}
                  </div>
                </motion.div>
                <div className="mt-4 flex flex-col items-center">
                  {isBreathingSessionActive ? (
                    <p className="text-gray-900 font-medium mb-1">
                      Cycle {currentCycle + 1} of {targetCycles.find(c => c.id === selectedTargetCycles)?.cycles || 10}
                    </p>
                  ) : null}
                  <p className={`text-gray-600 transition-all duration-300 ${isBreathingSessionActive ? 'text-xs' : 'text-base'}`}>
                    Place your hand on your companion and breathe together
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">{currentCycle}/{targetCycles.find(c => c.id === selectedTargetCycles)?.cycles || 10} cycles</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentCycle / (parseInt(targetCycles.find(c => c.id === selectedTargetCycles)?.cycles) || 10)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-4">
                {!isBreathingSessionActive ? (
                  <button
                    onClick={handleStartBreathingSession}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Start Session</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopBreathingSession}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Stop Session</span>
                  </button>
                )}
                <button className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Section - Guided Meditation Library */}
            {/* <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Guided Meditation Library</h3>
              </div>

              <p className="text-gray-600 mb-4">Access our library of guided meditations designed for you and your companion</p>

              <div className="space-y-4 mb-4">
                <div className="border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">Energy Alignment Meditation</h4>
                      <p className="text-sm text-gray-500">15 minutes • Beginner</p>
                    </div>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Start Session
                    </button>
                  </div>
                </div>

                <div className="border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">Chakra Healing Journey</h4>
                      <p className="text-sm text-gray-500">25 minutes • Intermediate</p>
                    </div>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Start Session
                    </button>
                  </div>
                </div>

                <div className="border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">Deep Soul Connection</h4>
                      <p className="text-sm text-gray-500">30 minutes • Advanced</p>
                    </div>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Start Session
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Explore Full Library</span>
              </button>
            </div> */}
          </div>
        )}

        {/* Insights Tab Content */}
        {/* {activeTab === 'insights' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights Coming Soon</h3>
            <p className="text-gray-600">We're developing personalized insights based on your bonding journey.</p>
          </div>
        )} */}
      </div>

      {/* Pricing Modal */}
      {
        showPricingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-orange-600">Upgrade to Premium</h2>
                </div>
                <button
                  onClick={handleClosePricingModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4">
                {/* Subtitle */}
                <p className="text-center text-gray-600 mb-4">
                  Unlock the full potential of your spiritual journey with your dog
                </p>

                {/* Pricing Toggle */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${!isYearlyPlan ? 'text-gray-900' : 'text-gray-500'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={handlePlanToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearlyPlan ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearlyPlan ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${isYearlyPlan ? 'text-gray-900' : 'text-gray-500'}`}>
                        Yearly
                      </span>
                      {isYearlyPlan && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Save 17%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Monthly Plan */}
                  <div className={`border-2 rounded-xl p-4 ${!isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Plan</h3>
                    <div className="text-lg font-bold text-gray-900 mb-1">$19.99<span className="text-lg font-normal">/month</span></div>
                    <p className="text-sm text-gray-600">Billed monthly, cancel anytime</p>
                  </div>

                  {/* Yearly Plan */}
                  <div className={`border-2 rounded-xl p-4 relative ${isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    {isYearlyPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Yearly Plan</h3>
                    <div className="text-lg font-bold text-gray-900 mb-1">$199.99<span className="text-lg font-normal">/year</span></div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg text-gray-500 line-through">$239.00</span>
                      <span className="text-sm text-green-600 font-medium">Save $30.00</span>
                    </div>
                    <p className="text-sm text-gray-600">Billed yearly, cancel anytime</p>
                  </div>
                </div>

                {/* Premium Features */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-4">Premium Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Unlimited Chakra Rituals */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Unlimited Chakra Rituals</h4>
                            <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Access to all 7 chakra alignment practices and advanced guided meditations</p>
                        </div>
                      </div>

                      {/* Exclusive Healing Circles */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Exclusive Healing Circles</h4>
                            <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Monthly premium group sessions and workshops with expert facilitators</p>
                        </div>
                      </div>

                      {/* Priority Support */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Priority Support</h4>
                            <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Direct access to our spiritual guidance team and community moderators</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Advanced Aura Tracking */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm9 0c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm9 0c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Advanced Aura Tracking</h4>
                            <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Deep energy field analysis and detailed bonded score insights</p>
                        </div>
                      </div>

                      {/* Legacy Export & Archive */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">Legacy Export & Archive</h4>
                            <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Download your complete journal as a beautiful PDF and backup all memories</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonials Section */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-4">What Our Premium Members Say</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-2 text-sm">"The premium healing circles have been life-changing for me and Luna. Worth every penny!"</p>
                      <p className="text-gray-500 font-medium text-sm">- Sarah M.</p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-2 text-sm">"Advanced aura tracking helped me understand Max's energy patterns so much better."</p>
                      <p className="text-gray-500 font-medium text-sm">- Michael R.</p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-2 text-sm">"Being able to export our legacy journal brought me so much peace during Bella's final days."</p>
                      <p className="text-gray-500 font-medium text-sm">- Emma L.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleClosePricingModal}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                      onClick={() => {
                        setShowPricingModal(false);
                        navigate('/subscription');
                      }}
                    className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {activeReflectionActivity?.activityName || 'Reflection'}
            </h3>
            <p className="text-gray-600 mb-4">
              Take a moment to reflect. This will be saved to your journal.
            </p>

            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-4"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReflectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isSavingReflection}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!reflectionText.trim()) {
                      toast.error("Please write something before saving.");
                      return;
                    }

                    setIsSavingReflection(true);

                    // 1. API Call: Save Journal Entry
                    const entryData = {
                      UserId: userId,
                      Title: activeReflectionActivity?.activityName,
                      Content: reflectionText,
                      Tags: 'Reflection, Bonding',
                      EntryType: 'Text',
                      Mood: 'Calm', // Default mood
                      Visibility: 'Private'
                    };

                    await apiService.createJournalEntry(entryData);

                    // 2. UI Update: Mark as selected
                    if (activeReflectionActivity) {
                      setCompletedActivityIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(activeReflectionActivity.activityId);
                        return newSet;
                      });
                    }

                    toast.success("Reflection saved to Journal!");
                    setShowReflectionModal(false);

                  } catch (error) {
                    console.error("Error saving reflection:", error);
                    toast.error("Failed to save reflection.");
                  } finally {
                    setIsSavingReflection(false);
                  }
                }}
                disabled={isSavingReflection}
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center ${isSavingReflection ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSavingReflection ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Reflection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div >



  );
};

export default DashboardPage;