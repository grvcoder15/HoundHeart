import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import toast from '../services/toastService';


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

  // Helper: Compute bond level text from score (dynamic, never hardcoded)
  const getBondLevelText = (score) => {
    if (score >= 80) return 'Kindred Spirit 💜';
    if (score >= 50) return 'Deep Bond ❤️';
    if (score >= 20) return 'Growing Connection 🌱';
    return 'New Connection ✨';
  };

  const [isVisible, setIsVisible] = useState({});
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bondTab, setBondTab] = useState('checkins');
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
  const [isCheckInDirty, setIsCheckInDirty] = useState(false);
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
  const [bondedScore, setBondedScore] = useState(0); // 0 for new users, API overrides
  const [bondLevel, setBondLevel] = useState('New Connection ✨');
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Daily Rituals State
  const [rituals, setRituals] = useState([]);
  const [dailyBonusEarned, setDailyBonusEarned] = useState(false);
  const [isRitualLoading, setIsRitualLoading] = useState(false);

  // Score Card State
  const [activitiesToday, setActivitiesToday] = useState(0);
  const [timeTogetherDisplay, setTimeTogetherDisplay] = useState('0h');
  const [chakraHarmonyCount, setChakraHarmonyCount] = useState(0);

  // FIX 1: Refresh trigger — increment to force dashboard stats re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // FIX 4: Chakra session completion state
  const [chakraSessionCompleted, setChakraSessionCompleted] = useState(false);

  useEffect(() => {
    if (activeTab === 'bond-building' && bondTab === 'daily-rituals' && userId) {
      fetchRituals();
    }
  }, [activeTab, bondTab, userId]);

  const fetchRituals = async () => {
    try {
      setIsRitualLoading(true);
      const data = await apiService.getRitualSuggestions(userId);
      if (data) {
        // Add 'originallyCompleted' flag to track what was already done
        const mappedRituals = (data.rituals || []).map(r => ({
          ...r,
          originallyCompleted: r.isCompleted
        }));
        setRituals(mappedRituals);
        setDailyBonusEarned(data.dailyBonusEarned || false);
      }
    } catch (error) {
      console.error('Failed to fetch rituals', error);
    } finally {
      setIsRitualLoading(false);
    }
  };

  const handleRitualToggle = (ritualId, isCompleted) => {
    // Just toggle local state
    setRituals(prev => prev.map(r => r.id === ritualId ? { ...r, isCompleted: !isCompleted } : r));
  };

  const handleSaveRituals = async () => {
    const ritualsToSave = rituals.filter(r => r.isCompleted && !r.originallyCompleted);

    if (ritualsToSave.length === 0) {
      toast.info("No new rituals to save.");
      return;
    }

    try {
      setIsRitualLoading(true);
      let bonusAwarded = false;

      // Process all new completions
      for (const ritual of ritualsToSave) {
        const response = await apiService.completeRitual(userId, ritual.id);
        if (response && response.bonusAwarded) {
          bonusAwarded = true;
        }
      }

      // Refresh data
      await fetchRituals();
      // FIX 1: Trigger refreshKey for instant dashboard update
      setRefreshKey(prev => prev + 1);
      fetchBondedScore(); // Refresh score circle immediately

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
  const [lastSyncData, setLastSyncData] = useState(null); // Stores sync scores for completion API

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
  const [isBreathingSessionCompleted, setIsBreathingSessionCompleted] = useState(false);

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

        if (patterns && patterns.length > 0) {
          // Normalize timings from API response (nested or flat)
          const processedPatterns = patterns.map(p => {
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
          setBreathingPatterns(processedPatterns);
          setSelectedBreathingPattern(processedPatterns[0].id);

          // Load saved preferences from DB (override defaults)
          try {
            const prefs = await apiService.getBreathingPreferences();
            if (prefs && !prefs.isDefault) {
              // Match saved pattern by name (IDs may differ between sessions)
              const savedPattern = processedPatterns.find(p => p.name === prefs.patternName);
              if (savedPattern) setSelectedBreathingPattern(savedPattern.id);
              // Match saved cycles
              if (cycles && cycles.length > 0) {
                const savedCycle = cycles.find(c => c.cycles === prefs.targetCycles);
                if (savedCycle) setSelectedTargetCycles(savedCycle.id);
              }
            }
          } catch (prefError) {
            console.error('Error loading breathing preferences:', prefError);
          }
        }

        if (cycles && cycles.length > 0) {
          setTargetCycles(cycles);
          // Only set default if not already set by preferences above
          setSelectedTargetCycles(prev => prev || cycles[0].id);
        }
      } catch (error) {
        console.error('Error fetching breathing data:', error);
        // Fallback or toast error
      }
    };
    fetchBreathingData();
  }, []);

  // Breathing Session Logic
  const handleStartBreathingSession = () => {
    if (isBreathingSessionActive) return;

    // Reset completion state if starting a new session
    setIsBreathingSessionCompleted(false);

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
    setIsBreathingSessionCompleted(false);

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
    // Keep currentCycle for progress display if needed, but the user requested reset text
    // We'll set completed state to true
    setIsBreathingSessionCompleted(true);

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
          // FORCE REFRESH SCORE explicitly
          await fetchBondedScore();
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

  // Fetch Dashboard Stats & Summary
  const fetchDashboardStats = async () => {
    try {
      const userId = apiService.getCurrentUserId();
      if (!userId) return;

      // Use local date string YYYY-MM-DD to avoid UTC midnight shifts
      const localDateString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

      const [stats, summary] = await Promise.all([
        apiService.getDashboardStats(userId, localDateString),
        apiService.getDashboardSummary(userId, localDateString)
      ]);

      if (stats) {
        setWeeklyProgress(stats.weeklyProgress || 0);
        setRitualConsistency(stats.ritualConsistency || { count: 0, total: 7 });
        setJournalEntriesCount(stats.stats?.journalEntries?.count ?? stats.journalEntries?.count ?? 0);
      }

      if (summary) {
        setActivitiesToday(summary.ActivitiesToday || summary.activitiesToday || 0);
        setTimeTogetherDisplay(summary.TimeTogether || summary.timeTogether || '0h');
        setChakraHarmonyCount(summary.ChakraHarmony || summary.chakraHarmony || 0);
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // 1. Reusable fetch functions for refreshing data


  const fetchBondedScore = async () => {
    try {
      const userId = apiService.getCurrentUserId();
      const dogId = localStorage.getItem('dogId') || '00000000-0000-0000-0000-000000000000';

      const response = await apiService.calculateBondedScore(userId, dogId);
      console.log('📊 Dashboard fetchBondedScore response:', response);

      const data = response?.data || response || {};
      const score = data.BondedScore !== undefined ? data.BondedScore : (data.bondedScore ?? 0);
      const level = data.BondLevel || data.bondLevel || getBondLevelText(score);

      setBondedScore(Math.round(score));
      setBondLevel(level);
      setWeeklyProgress(data.WeeklyProgress || data.weeklyProgress || 0);
      setRitualDays(data.RitualDaysCount || data.ritualDaysCount || 0);
    } catch (error) {
      console.error('Error fetching bonded score:', error);
      const storedScore = localStorage.getItem('bondedScore');
      if (storedScore) setBondedScore(parseInt(storedScore, 10));
      setBondLevel('Sync Pending');
    }
  };

  const fetchCheckInStatus = async () => {
    try {
      const userId = apiService.getCurrentUserId();
      if (userId) {
        const res = await apiService.checkCheckInDoneToday(userId);
        setIsCheckInDoneToday(res?.done || false);
      }
    } catch (err) {
      console.error('Error fetching check-in status:', err);
    }
  };

  // 2. Fetch initial data on mount/dependency change


  useEffect(() => {
    fetchBondedScore();
    fetchCheckInStatus();
    fetchDashboardStats();
  }, [refreshKey]); // Re-fetch whenever refreshKey changes (FIX 1)

  // Save Daily Check-in
  const handleSaveDailyCheckin = async () => {
    try {
      setIsSavingCheckin(true);
      const userId = apiService.getCurrentUserId();
      const checkIns = checkInItems.map(ci => ({ CheckInId: ci.checkInId, Rating: ratingsById[ci.checkInId] ?? null }));

      const res = await apiService.updateUserCheckIns(userId, checkIns);
      // If we reach here without an error/exception, the request succeeded (200 range)
      toast.success(res?.message || 'Daily check-ins updated successfully.');

      // Refresh data to reflect changes
      fetchCheckInStatus();
      if (res && res.stats) {
        // Update local stats immediately if returned
        setWeeklyProgress(res.stats.weeklyProgress || 0);
        setRitualConsistency(res.stats.ritualConsistency || { count: 0, total: 7 });
        setJournalEntriesCount(res.stats.journalEntries?.count || 0);

        if (res.scoreUpdate) {
          setBondedScore(res.scoreUpdate.newScore);
        }
      }
      // FIX 1: Always trigger refresh for instant update
      setRefreshKey(prev => prev + 1);
      setIsCheckInDirty(false);

      // Refresh ratings from server to reflect persisted values
      const serverCheckIns = await apiService.getUserCheckIns(userId);
      if (Array.isArray(serverCheckIns) && serverCheckIns.length > 0) {
        const updated = { ...ratingsById };
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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

        // Start with 0 for all sliders — user adjusts manually
        const initial = {};
        items.forEach(ci => {
          initial[ci.checkInId] = 0;
        });

        // Merge in server-saved ratings for this user, if any
        const userId = apiService.getCurrentUserId();
        if (userId) {
          const serverCheckIns = await apiService.getUserCheckIns(userId);
          if (Array.isArray(serverCheckIns)) {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
    fetchCheckInStatus();
    // Refresh score every 5 minutes or when activities change
  }, []);

  const loadBondingActivities = async () => {
    try {
      setIsLoadingActivities(true);
      setActivitiesError('');

      // Parallel fetch: Activities + Today's Status
      const [activitiesResponse, todayResponse] = await Promise.all([
        apiService.getBondingActivities(),
        apiService.getUserActivitiesToday(userId)
      ]);

      const activities = Array.isArray(activitiesResponse)
        ? activitiesResponse
        : (activitiesResponse?.data && Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);

      // Flatten today's activities to a Set of IDs
      // Response structure from controller: { data: [{ activityId: ... }, ...] }
      const todayData = todayResponse.data || [];
      const todayIds = new Set(todayData.map(item => item.activityId || item.ActivityId));

      // Map categories and preserve backend interaction type if valid
      const activitiesWithProps = activities.map(a => ({
        ...a,
        category: a.category || ACTIVITY_CATEGORIES[a.activityName] || 'Physical',
        interactionType: a.interactionType || 'Checkbox'
      }));

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
        const activity = activities.find(a => a.activityName === name);
        if (activity && todayIds.has(activity.activityId)) {
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
        const activity = bondingActivities.find(a => a.activityId === id);
        if (!activity) return null;

        // Use dynamic point from map if available, else fallback to activity.points
        const score = ritualPointsMap[activity.activityName] || activity.points || 2;

        return {
          ActivityId: id,
          Score: score
        };
      }).filter(Boolean);

      const payload = {
        UserId: userId,
        Date: new Date().toLocaleDateString('en-CA'), // Use local YYYY-MM-DD
        Activities: activitiesToSave
      };

      const response = await apiService.saveUserActivitiesScore(payload);

      toast.success(response?.message || 'Activities saved successfully!');

      // Refresh data from server to persist checkbox state and score
      await loadBondingActivities();
      await fetchBondedScore();
      // FIX 1: Trigger refreshKey for instant dashboard update
      setRefreshKey(prev => prev + 1);

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

      // Handle API response structure: { message: "...", entries: [...] }
      const entries = response?.entries || (Array.isArray(response) ? response : (response?.data || []));

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

        return {
          id: entry.id || entry.entryId || entry.journalEntryId || Date.now(),
          type: entry.entryType === 'MemoryReflection' ? 'memory-reflection' : 'letter',
          content: entry.content || '',
          tags: tagsArray,
          letterTo: entry.letterTo || entry.lettrTo || null,
          createdAt: entry.createdOn || entry.createdAt || entry.dateCreated || new Date().toISOString(),
          title: entry.title || (entry.entryType === 'Letter' ? `Letter to ${entry.letterTo || entry.lettrTo || 'My Dog'}` : 'Memory Reflection')
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
  const [rootChakra, setRootChakra] = useState(5);
  const [sacralChakra, setSacralChakra] = useState(5);
  const [solarPlexusChakra, setSolarPlexusChakra] = useState(5);
  const [heartChakra, setHeartChakra] = useState(5);
  const [throatChakra, setThroatChakra] = useState(5);
  const [thirdEyeChakra, setThirdEyeChakra] = useState(5);
  const [crownChakra, setCrownChakra] = useState(5);
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

      if (response) {
        setHarmonyScore(response.harmonyScore || 0);
        setSuggestedRitual(response.dominantBlockage ? `${response.dominantBlockage} Chakra Healing` : 'Chakra Sync Ritual');
        setRitualDescription(response.dominantBlockage
          ? `Focus on your ${response.dominantBlockage} chakra to restore balance and harmony.`
          : 'Align your energy centers with your companion through guided meditation.');

        // Update UI with adjusted scores if available
        if (response.adjustedScores) {
          setRootChakra(response.adjustedScores.rootScore || response.adjustedScores.RootScore);
          setSacralChakra(response.adjustedScores.sacralScore || response.adjustedScores.SacralScore);
          setSolarPlexusChakra(response.adjustedScores.solarPlexusScore || response.adjustedScores.SolarPlexusScore);
          setHeartChakra(response.adjustedScores.heartScore || response.adjustedScores.HeartScore);
          setThroatChakra(response.adjustedScores.throatScore || response.adjustedScores.ThroatScore);
          setThirdEyeChakra(response.adjustedScores.thirdEyeScore || response.adjustedScores.ThirdEyeScore);
          setCrownChakra(response.adjustedScores.crownScore || response.adjustedScores.CrownScore);
        }

        if (response.dominantBlockage) {
          const chakra = chakraData.find(c => c.name.includes(response.dominantBlockage));
          if (chakra) {
            setRecommendedChakra({
              ...chakra,
              audio: response.audioUrl && response.audioUrl !== 'Audio not available for this chakra yet.'
                ? response.audioUrl
                : chakra.audio
            });
            // Store audio URL for playback
            if (response.audioUrl && response.audioUrl !== 'Audio not available for this chakra yet.') {
              localStorage.setItem('currentChakraAudio', response.audioUrl);
            } else {
              localStorage.removeItem('currentChakraAudio');
            }
          }
        }

        toast.success(`Harmony Score: ${Math.round(response.harmonyScore || 0)}/10`);
        setShowRitualView(true);

        // Store sync data so it can be sent to complete-ritual after audio finishes
        setLastSyncData({
          RootScore: rootChakra,
          SacralScore: sacralChakra,
          SolarPlexusScore: solarPlexusChakra,
          HeartScore: heartChakra,
          ThroatScore: throatChakra,
          ThirdEyeScore: thirdEyeChakra,
          CrownScore: crownChakra,
          HarmonyScore: response.harmonyScore || 0,
          DominantBlockage: response.dominantBlockage || null
        });

        // NOTE: No refreshKey here — ChakraLog is NOT saved until audio finishes
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

  const handleStartRitual = async () => {
    console.log('Start Guided Chakra Ritual clicked');

    // Prepare data for sync
    const syncPayload = {
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
      const response = await apiService.syncChakra(syncPayload);
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
    setShowProgressView(true);
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      if (audioInstance) {
        audioInstance.pause();
        setIsPlaying(false);
      }
    } else {
      let audioUrl = recommendedChakra?.audio || localStorage.getItem('currentChakraAudio');

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
            setChakraSessionCompleted(true); // FIX 4: Mark session as completed
            const userId = apiService.getCurrentUserId();
            if (userId) {
              try {
                const response = await apiService.completeChakraRitual(userId, lastSyncData || {});
                if (response?.bonusAwarded || response?.success) {
                  toast.success("Harmony Ritual Complete! +2 Bonded Points Awarded. ✨");
                  fetchBondedScore(); // Immediate score update
                  // FIX 3: Update Chakra Harmony count instantly
                  setRefreshKey(prev => prev + 1);
                }
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
    setChakraSessionCompleted(false); // FIX 4: Reset completion state
  };

  // FIX 4: Start New Chakra — reset and advance to next chakra
  const handleStartNewChakra = () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    }
    setChakraSessionCompleted(false);
    // Advance to next chakra if not at the last one
    if (currentChakraStep < 7) {
      setCurrentChakraStep(prev => prev + 1);
    } else {
      // All chakras completed, go back to ritual view
      setShowProgressView(false);
      toast.success('All 7 chakras completed! 🎉');
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
      setCurrentChakraStep(currentChakraStep - 1);
    }
  };

  const handleNextChakra = () => {
    if (currentChakraStep < 7) {
      setCurrentChakraStep(currentChakraStep + 1);
    }
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100">
      {/* Top Navigation Bar */}
      <Navbar currentPage="dashboard" onUpgrade={handleUpgrade} onChangePassword={handleOpenChangePassword} />
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 relative animate-fadeIn space-y-6">
            <button
              onClick={handleCloseChangePassword}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-2xl font-semibold text-gray-900">Change Password</h3>
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
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${isUpdatingPassword
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div
          id="welcome-section"
          data-animate
          className={`mb-8 transition-all duration-1000 delay-200 ${isVisible['welcome-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {userData.name}</h1>
          <p className="text-xl text-gray-600">Continue strengthening your spiritual bond with {userData.dogName}</p>
        </div>

        {/* Navigation Tabs */}
        <div
          id="nav-tabs"
          data-animate
          className={`mb-8 transition-all duration-1000 delay-300 ${isVisible['nav-tabs'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${activeTab === 'overview'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bond-building')}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${activeTab === 'bond-building'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Bond Building
            </button>
            <button
              onClick={() => setActiveTab('meditation')}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${activeTab === 'meditation'
                ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Meditation
            </button>
            {/* <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-6 py-3 rounded-md transition-colors ${activeTab === 'insights'
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
              className={`bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-1000 delay-400 ${isVisible['stats-panel'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">This Week's Progress</span>
                      <span className="text-sm font-medium text-gray-900">{weeklyProgress >= 0 ? '+' : ''}{weeklyProgress} points</span>
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
                        <span className="text-amber-700 text-2xl">🐕</span>
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
              className={`mb-8 transition-all duration-1000 delay-600 ${isVisible['quick-actions'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chakra Sync */}
                <button
                  onClick={() => handleQuickAction('chakra-sync')}
                  className="bg-white text-gray-800 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Chakra Sync</h3>
                    <p className="text-sm text-gray-500">Align your energy with your dog</p>
                  </div>
                </button>

                {/* Daily Check-in */}
                <button
                  onClick={() => handleQuickAction('daily-checkin')}
                  className={`bg-white text-gray-800 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-sm border-2 ${isCheckInDoneToday ? 'border-green-400' : 'border-transparent'}`}
                >
                  <div className="text-center relative">
                    {isCheckInDoneToday && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-bounce">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br ${isCheckInDoneToday ? 'from-green-500 to-green-600' : 'from-pink-500 to-pink-600'} text-white text-2xl shadow-md`}>
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
                  className="bg-white text-gray-800 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-sm"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl shadow-md">
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
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-1000 delay-800 ${isVisible['bottom-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              {/* Recent Memories */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 border-2 border-white rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Recent Memories</h3>
                  </div>
                  <button
                    onClick={handleViewAll}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View All
                  </button>
                </div>

                {(() => {
                  // Filter to show only memory-reflection entries (not letters) and get the most recent 3
                  const memoryEntries = journalEntries
                    .filter(entry => entry.type === 'memory-reflection')
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3);

                  // Show loading state
                  if (isLoadingEntries) {
                    return (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading memories...</p>
                      </div>
                    );
                  }

                  // Show empty state if no entries
                  if (memoryEntries.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-6">No memories yet. Start journaling!</p>
                        <button
                          onClick={handleCreateEntry}
                          className="border border-purple-500 text-purple-500 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300"
                        >
                          Create First Entry
                        </button>
                      </div>
                    );
                  }

                  // Show entries
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
                              <div className="flex flex-wrap gap-2">
                                {entry.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {entry.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{entry.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Unlock Premium */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Unlock Premium</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
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
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                  </div>

                  <div className="flex items-center justify-between">
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
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                  </div>

                  <div className="flex items-center justify-between">
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
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bond Building Tab Content */}
        {activeTab === 'bond-building' && (
          <div className="space-y-6">
            {/* Bonded Score Card */}
            <div className="mb-8">
              <div className="bg-purple-50 rounded-2xl p-8 shadow-lg relative overflow-hidden">
                {/* Content Container */}
                <div className="flex items-start justify-between relative z-10">
                  {/* Left Section - Title and Subtitle */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Bonded Score<sup className="text-lg">™</sup>
                    </h1>
                    <p className="text-lg text-purple-600">{bondLevel}</p>

                    {/* Key Metrics - Bottom Section */}
                    <div className="flex space-x-8 mt-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {activitiesToday}
                        </div>
                        <div className="text-sm text-gray-900">Activities Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{timeTogetherDisplay}</div>
                        <div className="text-sm text-gray-900">Time Together</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{chakraHarmonyCount}</div>
                        <div className="text-sm text-gray-900">Chakra Harmony</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Orange Circle with Score */}
                  <div className="flex-shrink-0 ml-8 relative">
                    <div className="relative">
                      {/* Orange Gradient Circle */}
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-xl flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">{bondedScore}</span>
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
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full mb-8">
              <button
                onClick={() => setBondTab('checkins')}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${bondTab === 'checkins'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Check-ins
              </button>
              <button
                onClick={() => setBondTab('daily-rituals')}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${bondTab === 'daily-rituals'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Daily Rituals
              </button>
              <button
                onClick={() => setBondTab('Chakra-sync')}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${bondTab === 'Chakra-sync'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Chakra Sync
              </button>
              <button
                onClick={() => setBondTab('activities')}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${bondTab === 'activities'
                  ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Activities
              </button>
              {/* <button
                onClick={() => setBondTab('insights')}
                className={`flex-1 px-6 py-3 rounded-md transition-colors ${bondTab === 'insights'
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
                <div className="bg-green-50 rounded-xl p-6 mb-6">
                  {(() => {
                    const completedCount = rituals.filter(r => r.isCompleted).length;
                    const totalRituals = rituals.length || 1;
                    const completionPercentage = Math.round((completedCount / totalRituals) * 100);
                    const progressBarWidth = (completedCount / totalRituals) * 100;

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

                        <div className="mb-6">
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
                            <div className="text-3xl font-bold text-green-600 mb-1">{completionPercentage}%</div>
                            <div className="text-sm text-gray-600">Complete</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Morning Rituals */}
                <div className="bg-yellow-50 rounded-xl p-6 mb-6">
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
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
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
                <div className="bg-purple-50 rounded-xl p-6">
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
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveRituals}
                    disabled={isRitualLoading || !rituals.some(r => r.isCompleted && !r.originallyCompleted)}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${isRitualLoading
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
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Check-in</h3>

                {/* Dynamic check-ins from API */}
                {checkInItems.map((ci, idx) => {
                  const id = ci.checkInId;
                  const questionRaw = ci.questions || '';
                  // Strip any hardcoded "(X/10)" from the DB question text to avoid double display
                  const question = questionRaw.replace(/\s*\(\d+\/\d+\)\s*/g, '').trim();
                  const isHours = questionRaw.toLowerCase().includes('hours spent');
                  const max = 10;
                  const isBehavior = questionRaw.toLowerCase().includes('behavior');
                  const defaultValue = 0;
                  const value = ratingsById[id] ?? defaultValue;
                  const widthPct = Math.min(100, Math.max(0, (value / max) * 100));
                  const barClasses = [
                    'from-blue-500 to-cyan-500',
                    'from-orange-500 to-yellow-500',
                    'from-purple-500 to-pink-500',
                    'from-green-500 to-emerald-500'
                  ][idx % 4];
                  return (
                    <div className="mb-6" key={id}>
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
                            setIsCheckInDirty(true);
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
                    disabled={isSavingCheckin || !isCheckInDirty}
                    className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors ${(isSavingCheckin || !isCheckInDirty)
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
              <div className="bg-white rounded-xl p-8 shadow-sm">
                {!showRitualView && !showProgressView && (
                  <>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Chakra Alignment Meditation</h3>
                      <p className="text-gray-600">Sync your energy centers with your companion</p>
                    </div>

                    {/* Dog Behavior Input - REVERTED per user request */}


                    {/* Chakra List */}
                    <div className="space-y-6 mb-8">
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
                    <div className="text-center mb-8">
                      {/* Header with star icons */}
                      <div className="flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <h3 className="text-3xl font-bold text-purple-800">{suggestedRitual || 'Chakra Sync Ritual'}</h3>
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
                            <p className="text-4xl font-bold text-purple-600">{Math.round(harmonyScore)}/10</p>
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
                    <div className="flex justify-center space-x-4 mb-8">
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
                    <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
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
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                      </button>

                      <button
                        onClick={handleBeginRitual}
                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
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
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
                      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                        {/* Chakra Header */}
                        <div className="text-center mb-6">
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

                        {/* Chakra Visualization */}
                        <div className="text-center mb-6">
                          <div className={`w-32 h-32 bg-${recommendedChakra?.color || 'red'}-500 border-4 border-white rounded-full mx-auto mb-4 shadow-lg flex items-center justify-center animate-pulse`}>
                            {isPlaying && (
                              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>

                          {/* Progress Bar & Timer */}
                          <div className="max-w-xs mx-auto mb-6">
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

                          <div className="text-3xl font-bold text-gray-900 mb-2 font-mono">
                            {isPlaying ? formatTime(audioCurrentTime) : (recommendedChakra?.timer || '1:00')}
                          </div>
                          <p className="text-sm text-gray-600 italic">"{recommendedChakra?.breathing || 'Deep, slow breaths'}"</p>
                        </div>

                        {/* Affirmation */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 transform transition-all hover:scale-102">
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

                          {/* FIX 4: Conditional button — Start New Chakra after completion */}
                          {chakraSessionCompleted ? (
                            <button
                              onClick={handleStartNewChakra}
                              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-3"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                              <span className="text-lg">Start New Chakra</span>
                            </button>
                          ) : (
                            <button
                              onClick={handlePlayAudio}
                              className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'} text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-3`}
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
                          )}

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
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
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
                          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
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
              <div className="space-y-6">
                {/* Header Section */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Bonding Activities</h2>
                  <p className="text-lg text-gray-600">Complete activities to strengthen your spiritual connection</p>
                </div>

                {/* Activities List */}
                <div className="space-y-4">
                  {isLoadingActivities ? (
                    <div className="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-600">
                      Loading bonding activities...
                    </div>
                  ) : activitiesError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                      {activitiesError}
                    </div>
                  ) : bondingActivities.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-600">
                      No bonding activities available right now. Please check back later.
                    </div>
                  ) : (
                    bondingActivities.map((activity) => {
                      const category = activity.category || 'Physical';
                      const interactionType = activity.interactionType || 'Checkbox';

                      // Check by ID (string/int safe comparison needed?)
                      // Assuming IDs are Guids (strings) in both Activity and UserLog
                      const isCompleted = completedActivityIds.has(activity.activityId);

                      const handleActivityClick = () => {
                        // 1. Prevent action if already completed (Read-Only)
                        if (isCompleted) return;

                        // 2. Special redirect activities — always redirect by name,
                        //    regardless of InteractionType in the database
                        if (activity.activityName === 'Chakra Sync') {
                          setActiveTab('bond-building');
                          setBondTab('Chakra-sync');
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

                        // 3. Handle other Redirect-type activities
                        if (interactionType === 'Redirect') {
                          return; // Already handled above
                        }

                        // 3. Handle Input/Reflection
                        if (interactionType === 'Input') {
                          setActiveReflectionActivity(activity);
                          setReflectionText('');
                          setShowReflectionModal(true);
                          return;
                        }

                        // 4. Default: Physical Activities (Toggle)
                        setCompletedActivityIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(activity.activityId)) {
                            newSet.delete(activity.activityId);
                          } else {
                            newSet.add(activity.activityId);
                          }
                          return newSet;
                        });
                      };

                      return (
                        <div
                          key={activity.activityId}
                          onClick={handleActivityClick}
                          className={`rounded-xl p-6 border transition-colors ${isCompleted
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
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveActivities}
                      disabled={isSavingActivities || completedActivityIds.size === 0}
                      className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${isSavingActivities || completedActivityIds.size === 0
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
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
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
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
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
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
            <div className="bg-white rounded-xl p-8 shadow-sm">
              {/* Header */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Synchronized Breathing</h3>
              </div>

              <p className="text-gray-600 mb-6">Align your breath with your companion's natural rhythm</p>

              {/* Breathing Pattern */}
              <div className="mb-6">
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
                            // Save preference to DB silently
                            const selectedCycle = targetCycles.find(c => c.id === selectedTargetCycles);
                            apiService.saveBreathingPreferences({
                              PatternId: pattern.id,
                              PatternName: pattern.name,
                              TargetCycles: selectedCycle?.cycles || 10
                            });
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
              <div className="flex items-start gap-4 mb-6">
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
                              // Save preference to DB silently
                              const selectedPattern = breathingPatterns.find(p => p.id === selectedBreathingPattern);
                              apiService.saveBreathingPreferences({
                                PatternId: selectedBreathingPattern,
                                PatternName: selectedPattern?.name || '4-7-8',
                                TargetCycles: cycle.cycles
                              });
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
              <div className="text-center mb-6 h-64 flex flex-col items-center justify-center">
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
                    <span className="text-white text-xl font-medium">
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
              <div className="mb-6">
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
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{isBreathingSessionCompleted ? "Start New Session" : "Start Session"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopBreathingSession}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Stop Session</span>
                  </button>
                )}
                <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Section - Guided Meditation Library */}
            {/* <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Guided Meditation Library</h3>
              </div>

              <p className="text-gray-600 mb-6">Access our library of guided meditations designed for you and your companion</p>

              <div className="space-y-4 mb-6">
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

              <button className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Insights Coming Soon</h3>
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
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-orange-600">Upgrade to Premium</h2>
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
              <div className="p-6">
                {/* Subtitle */}
                <p className="text-center text-gray-600 mb-8">
                  Unlock the full potential of your spiritual journey with your dog
                </p>

                {/* Pricing Toggle */}
                <div className="flex justify-center mb-8">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Monthly Plan */}
                  <div className={`border-2 rounded-xl p-6 ${!isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Plan</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-1">$19.99<span className="text-lg font-normal">/month</span></div>
                    <p className="text-sm text-gray-600">Billed monthly, cancel anytime</p>
                  </div>

                  {/* Yearly Plan */}
                  <div className={`border-2 rounded-xl p-6 relative ${isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    {isYearlyPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Yearly Plan</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-1">$199.99<span className="text-lg font-normal">/year</span></div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg text-gray-500 line-through">$239.00</span>
                      <span className="text-sm text-green-600 font-medium">Save $30.00</span>
                    </div>
                    <p className="text-sm text-gray-600">Billed yearly, cancel anytime</p>
                  </div>
                </div>

                {/* Premium Features */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">Premium Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">What Our Premium Members Say</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = 'https://buy.stripe.com/test_eVaeVi0O09haf0A3cc';
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
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
                className={`px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center ${isSavingReflection ? 'opacity-70 cursor-not-allowed' : ''}`}
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






