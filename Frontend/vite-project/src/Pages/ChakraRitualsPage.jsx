import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import GreenLeaves from '../assets/images/green_leaves.png';
import apiService from '../services/apiService';
import { useChakraProgress } from '../hooks/useChakraProgress';

const ChakraRitualsPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState({});
  const [activeTab, setActiveTab] = useState('chakra-alignment');
  const [showEnergySyncModal, setShowEnergySyncModal] = useState(false);
  const [showGratitudeFlowModal, setShowGratitudeFlowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGratitudePlaying, setIsGratitudePlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [gratitudeCurrentTime, setGratitudeCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [gratitudeDuration, setGratitudeDuration] = useState(0);
  
  // Ritual top-bar stats (fetched from Dashboard Stats)
  const [ritualStats, setRitualStats] = useState({ bondedScore: 0, dayStreak: 0, energySync: 0 });

  // Fetch & refresh top stats
  const fetchRitualStats = async () => {
    try {
      const uid = apiService.getCurrentUserId();
      if (!uid) return;
      const res = await apiService.getDashboardStats(uid, new Date().toISOString());
      const data = res?.data || res;
      if (data) {
        setRitualStats({
          bondedScore: Math.round(data.bondedScore ?? 0),
          dayStreak: data.ritualConsistency?.count ?? 0,
          energySync: Math.round(data.weeklyProgress ?? 0),
        });
      }
    } catch (e) {
      // non-blocking
    }
  };

  // Chakra data from API
  const [chakrasFromAPI, setChakrasFromAPI] = useState([]);
  const [chakrasLoading, setChakrasLoading] = useState(true);
  const [allChakraProgress, setAllChakraProgress] = useState([]); // Store all chakras' progress
  const [selectedChakra, setSelectedChakra] = useState(null);
  const [showChakraModal, setShowChakraModal] = useState(false);
  const [chakraAudio, setChakraAudio] = useState(null);
  const [isChakraPlaying, setIsChakraPlaying] = useState(false);
  const [chakraCurrentTime, setChakraCurrentTime] = useState(0);
  const [chakraDuration, setChakraDuration] = useState(0);
  const [chakraAudioLoading, setChakraAudioLoading] = useState(false);
  
  // Audio refs
  const audioRef = useRef(null);
  const gratitudeAudioRef = useRef(null);
  const chakraAudioRef = useRef(null);
  const saveProgressOnPauseRef = useRef(null);
  const saveProgressOnEndedRef = useRef(null);
  const selectedChakraIdRef = useRef(null);
  
  // Create audio instances
  const [audio, setAudio] = useState(null);
  const [gratitudeAudio, setGratitudeAudio] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [gratitudeAudioLoading, setGratitudeAudioLoading] = useState(false);

  // Helper function to get audio duration from URL
  const getAudioDuration = (audioUrl) => {
    return new Promise((resolve) => {
      if (!audioUrl) {
        resolve(0);
        return;
      }
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      }, { once: true });
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio metadata for:', audioUrl, e);
        resolve(0);
      }, { once: true });
      audio.load(); // Start loading metadata
    });
  };

  // Fetch chakras and all progress from API on component mount
  useEffect(() => {
    const fetchChakrasAndProgress = async () => {
      try {
        setChakrasLoading(true);
        const userId = apiService.getCurrentUserId();
        
        // Fetch chakras and progress in parallel
        console.log('Starting to fetch chakras and progress...');
        const [chakrasResponse, progressResponse] = await Promise.all([
          apiService.getAllChakras(),
          userId ? apiService.getAllChakraRitualProgress(userId) : Promise.resolve([])
        ]);
        
        console.log('Fetched chakras response:', chakrasResponse);
        console.log('Fetched all progress response:', progressResponse);
        
        // Store all progress
        if (Array.isArray(progressResponse)) {
          setAllChakraProgress(progressResponse);
          console.log(`✅ Loaded progress for ${progressResponse.length} chakras`);
        }
        
        // Ensure chakras response is an array
        if (!Array.isArray(chakrasResponse)) {
          console.warn('Expected array from getAllChakras, got:', typeof chakrasResponse);
          setChakrasFromAPI([]);
          return;
        }
        
        if (chakrasResponse.length === 0) {
          console.warn('Received empty array from API');
          setChakrasFromAPI([]);
          return;
        }
        
        console.log('Transforming', chakrasResponse.length, 'chakras...');
        
        // Map chakra names to colors for display
        const colorMap = {
          'Root Chakra': 'red',
          'Sacral Chakra': 'orange',
          'Solar Plexus': 'yellow',
          'Heart Chakra': 'green',
          'Throat Chakra': 'blue',
          'Third Eye': 'indigo',
          'Crown Chakra': 'purple'
        };
        
        // Transform API response and fetch audio durations concurrently
        console.log('Fetching audio durations for all chakras...');
        const transformedChakras = await Promise.all(
          chakrasResponse.map(async (chakra, index) => {
            console.log(`Processing chakra ${index}:`, chakra.name || chakra.chakraName);
            
            // Fetch audio duration
            let durationSeconds = 0;
            if (chakra.audioUrl) {
              try {
                durationSeconds = await getAudioDuration(chakra.audioUrl);
                console.log(`Audio duration for ${chakra.chakraName}: ${durationSeconds} seconds`);
              } catch (error) {
                console.error(`Failed to get duration for ${chakra.chakraName}:`, error);
              }
            }
            
            return {
              chakraId: chakra.chakraId,
              name: chakra.chakraName,
              audioUrl: chakra.audioUrl,
              color: colorMap[chakra.chakraName] || 'gray',
              description: `Align your energy with ${chakra.chakraName.toLowerCase()} meditation`,
              duration: durationSeconds, // Store as seconds (number)
              isLocked: false,
              icon: '✨'
            };
          })
        );
        
        console.log('All chakras transformed with durations:', transformedChakras);
        setChakrasFromAPI(transformedChakras);
      } catch (error) {
        console.error('Error fetching chakras and progress:', error);
        // Keep empty array on error
        setChakrasFromAPI([]);
        setAllChakraProgress([]);
      } finally {
        setChakrasLoading(false);
      }
    };

    fetchChakrasAndProgress();
    fetchRitualStats();
  }, []);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && 
          !event.target.closest('.profile-dropdown-container') &&
          !event.target.closest('[data-profile-button]') &&
          !event.target.closest('[data-logout-button]')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

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

  // Initialize audio when modals open
  useEffect(() => {
    if (showEnergySyncModal && !audio) {
      setAudioLoading(true);
      const newAudio = new Audio('/smooth-jazz-podcast-instrumental-background-music-355744.mp3');
      newAudio.preload = 'metadata';
      
      newAudio.addEventListener('loadedmetadata', () => {
        setDuration(newAudio.duration);
        setAudioLoading(false);
        console.log('Audio loaded, duration:', newAudio.duration);
      });
      
      newAudio.addEventListener('timeupdate', () => {
        setCurrentTime(newAudio.currentTime);
      });
      
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      newAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setAudioLoading(false);
        // alert('Error loading audio file');
      });
      
      setAudio(newAudio);
    }
    
    if (showGratitudeFlowModal && !gratitudeAudio) {
      console.log('Initializing gratitude audio...');
      setGratitudeAudioLoading(true);
      
      // Use the smooth-jazz song consistently
      const audioSources = [
        '/smooth-jazz-podcast-instrumental-background-music-355744.mp3'
      ];
      
      let currentSourceIndex = 0;
      
      const tryLoadAudio = () => {
        if (currentSourceIndex >= audioSources.length) {
          // console.error('All audio sources failed to load');
          setGratitudeAudioLoading(false);
          // alert('Unable to load audio file. Please check your internet connection.');
          return;
        }
        
        const audioSrc = audioSources[currentSourceIndex];
        console.log(`Trying to load audio: ${audioSrc}`);
        console.log(`Full URL would be: ${window.location.origin}${audioSrc}`);
        const newGratitudeAudio = new Audio(audioSrc);
        newGratitudeAudio.preload = 'auto'; // Changed from 'metadata' to 'auto' for better loading
        
        // Set a timeout for loading
        const loadTimeout = setTimeout(() => {
          console.log(`Audio load timeout for ${audioSrc}`);
          currentSourceIndex++;
          tryLoadAudio();
        }, 5000);
        
        newGratitudeAudio.addEventListener('loadedmetadata', () => {
          clearTimeout(loadTimeout);
          setGratitudeDuration(newGratitudeAudio.duration);
          setGratitudeAudioLoading(false);
          console.log('Gratitude audio loaded, duration:', newGratitudeAudio.duration);
        });

        newGratitudeAudio.addEventListener('canplay', () => {
          console.log('Gratitude audio can play');
        });

        newGratitudeAudio.addEventListener('loadeddata', () => {
          console.log('Gratitude audio data loaded');
        });
        
        newGratitudeAudio.addEventListener('timeupdate', () => {
          setGratitudeCurrentTime(newGratitudeAudio.currentTime);
        });
        
        newGratitudeAudio.addEventListener('ended', () => {
          setIsGratitudePlaying(false);
          setGratitudeCurrentTime(0);
        });
        
        newGratitudeAudio.addEventListener('error', (e) => {
          clearTimeout(loadTimeout);
          // console.error(`Gratitude audio error for ${audioSrc}:`, e);
          currentSourceIndex++;
          tryLoadAudio();
        });
        
        newGratitudeAudio.addEventListener('canplaythrough', () => {
          console.log('Gratitude audio can play through');
        });
        
        newGratitudeAudio.addEventListener('loadstart', () => {
          console.log('Gratitude audio load started');
        });
        
        setGratitudeAudio(newGratitudeAudio);
        console.log('Gratitude audio object created:', newGratitudeAudio);
        
        // Manually trigger loading
        newGratitudeAudio.load();
      };
      
      tryLoadAudio();
    }
  }, [showEnergySyncModal, showGratitudeFlowModal, audio, gratitudeAudio]);

  // Initialize chakra audio when modal opens
  useEffect(() => {
    if (!showChakraModal || !selectedChakra) {
      return;
    }
    
    setIsChakraPlaying(false);
    setChakraAudioLoading(true);
    
    const newChakraAudio = new Audio(selectedChakra.audioUrl);
    newChakraAudio.preload = 'auto'; // Load more data for better seeking reliability
    
    newChakraAudio.addEventListener('loadedmetadata', () => {
      setChakraDuration(newChakraAudio.duration);
      setChakraAudioLoading(false);
      console.log('Chakra audio loaded, duration:', newChakraAudio.duration);
    });

    // Wait for more data to be loaded for better seeking
    newChakraAudio.addEventListener('canplaythrough', () => {
      console.log('Chakra audio can play through - ready for seeking');
    });

    newChakraAudio.addEventListener('loadeddata', () => {
      console.log('Chakra audio data loaded - readyState:', newChakraAudio.readyState);
    });
    
    newChakraAudio.addEventListener('timeupdate', () => {
      // Only update if audio is playing, or if currentTime is greater than 0
      // This prevents timeupdate from resetting saved position when audio is paused
      const currentPos = newChakraAudio.currentTime;
      if (newChakraAudio.paused) {
        // When paused, only update if the position is valid (not 0)
        // This preserves the saved resume position
        if (currentPos > 0) {
          setChakraCurrentTime(currentPos);
        }
      } else {
        // When playing, always update
        setChakraCurrentTime(currentPos);
      }
    });
    
    newChakraAudio.addEventListener('ended', async () => {
      setIsChakraPlaying(false);
      setChakraCurrentTime(0);
      
      // Save progress on completion
      if (saveProgressOnEndedRef.current && newChakraAudio.duration) {
        const totalDuration = newChakraAudio.duration;
        await saveProgressOnEndedRef.current(totalDuration);
        // Update local progress state after saving
        if (selectedChakra?.chakraId) {
          const updatedProgress = {
            chakraId: selectedChakra.chakraId,
            pauseTimeInSeconds: Math.floor(totalDuration),
            isCompleted: true
          };
          setAllChakraProgress(prev => {
            const existing = prev.findIndex(p => p.chakraId === selectedChakra.chakraId);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = updatedProgress;
              return updated;
            } else {
              return [...prev, updatedProgress];
            }
          });
          console.log(`✅ Updated local progress on completion for chakraId: ${selectedChakra.chakraId}`);
        }
        // Refresh top-bar stats after ritual completes
        fetchRitualStats();
      }
    });
    
    // Store error handler so we can remove it during cleanup
    const errorHandler = (e) => {
      // Suppress errors that occur during cleanup (when src is cleared)
      const audioElement = e.target;
      const errorCode = audioElement?.error?.code;
      const hasSrc = audioElement?.src && audioElement.src !== '';
      
      // Only log real errors, not cleanup-related errors
      // Ignore: ABORTED errors (code 1), empty src (cleanup), or no error code
      if (hasSrc && errorCode && errorCode !== 1) {
        // Real errors: NETWORK (2), DECODE (3), SRC_NOT_SUPPORTED (4)
        console.error('Chakra audio error:', e);
      }
      // Always update loading state
      setChakraAudioLoading(false);
    };
    
    newChakraAudio.addEventListener('error', errorHandler);
    
    setChakraAudio(newChakraAudio);
    chakraAudioRef.current = newChakraAudio; // Set ref for progress hook
    
    // Cleanup function
    return () => {
      if (newChakraAudio) {
        // Remove error listener before any cleanup to prevent error events
        newChakraAudio.removeEventListener('error', errorHandler);
        newChakraAudio.pause();
        // Don't clear src - it triggers error events
        // The audio will be garbage collected when component unmounts
      }
    };
  }, [showChakraModal, selectedChakra]);

  // Sync currentTime state when audio position is set (for resume functionality)
  useEffect(() => {
    if (!chakraAudio || !showChakraModal) return;

    // Listen for seeked event (fires when currentTime is set programmatically)
    // This ensures the progress bar and time display update when resuming
    const handleSeeked = () => {
      const currentPos = chakraAudio.currentTime;
      if (currentPos > 0) {
        setChakraCurrentTime(currentPos);
        console.log(`📊 UI updated via seeked: ${Math.floor(currentPos/60)}:${Math.floor(currentPos%60).toString().padStart(2, '0')}`);
      }
    };

    // Also check periodically to ensure UI stays in sync (less frequently to reduce flickering)
    const checkPosition = setInterval(() => {
      const audioPos = chakraAudio.currentTime;
      const statePos = chakraCurrentTime;
      
      // Only update if:
      // 1. Audio is playing (not paused), OR
      // 2. Audio position is valid (> 0) and significantly different from state
      // This prevents resetting saved position when audio is paused
      if (!chakraAudio.paused) {
        // When playing, sync if significantly different
        if (Math.abs(audioPos - statePos) > 0.5) {
          setChakraCurrentTime(audioPos);
        }
      } else {
        // When paused, only update if audio position is valid and significantly greater than current state
        // This preserves the saved resume position
        if (audioPos > 1 && audioPos > statePos && Math.abs(audioPos - statePos) > 0.5) {
          setChakraCurrentTime(audioPos);
        }
      }
    }, 250); // Check less frequently to reduce flickering

    chakraAudio.addEventListener('seeked', handleSeeked);

    return () => {
      clearInterval(checkPosition);
      chakraAudio.removeEventListener('seeked', handleSeeked);
    };
  }, [chakraAudio, showChakraModal]); // Removed chakraCurrentTime from dependencies

  // Use chakra progress hook - pass pre-loaded progress data
  const userId = apiService.getCurrentUserId();
  const preLoadedProgress = selectedChakra?.chakraId 
    ? allChakraProgress.find(p => p.chakraId === selectedChakra.chakraId) || null
    : null;
  
  const { 
    resumeMessage, 
    isLoading: isProgressLoading, 
    progress,
    saveProgressOnPause, 
    saveProgressOnEnded 
  } = useChakraProgress(
    selectedChakra?.chakraId || null,
    userId || null,
    chakraAudioRef,
    preLoadedProgress // Pass pre-loaded progress data
  );

  // Store save functions in refs for use in event listeners
  saveProgressOnPauseRef.current = saveProgressOnPause;
  saveProgressOnEndedRef.current = saveProgressOnEnded;
  selectedChakraIdRef.current = selectedChakra?.chakraId || null;

  // Track if we've already synced UI to prevent infinite loops
  const uiSyncedRef = useRef(false);

  // Immediately update UI when progress is loaded and audio is ready (only once)
  useEffect(() => {
    if (!chakraAudio || !progress || !showChakraModal) {
      uiSyncedRef.current = false;
      return;
    }

    const savedTime = progress.pauseTimeInSeconds;
    if (savedTime > 0 && !progress.isCompleted && !uiSyncedRef.current) {
      const hasFiniteDuration = Number.isFinite(chakraAudio.duration) && chakraAudio.duration > 0;
      const validPosition = hasFiniteDuration ? Math.min(savedTime, chakraAudio.duration) : savedTime;

      // Only sync if significantly different and we haven't synced yet
      if (Math.abs(chakraCurrentTime - validPosition) > 0.5) {
        setChakraCurrentTime(validPosition);
        uiSyncedRef.current = true;
        console.log(
          `🎯 UI synced to saved position: ${validPosition} seconds (${Math.floor(validPosition / 60)}:${Math.floor(validPosition % 60)
            .toString()
            .padStart(2, '0')})`
        );
      }
    }
  }, [chakraAudio, progress, showChakraModal]); // Removed chakraCurrentTime from dependencies to prevent infinite loop

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (gratitudeAudio) {
        gratitudeAudio.pause();
        gratitudeAudio.src = '';
      }
      if (chakraAudio) {
        chakraAudio.pause();
        chakraAudio.src = '';
      }
    };
  }, [audio, gratitudeAudio, chakraAudio]);

  const handleRitualClick = (chakra, isLocked) => {
    if (!isLocked) {
      console.log(`Starting ${chakra.name} ritual`);
      // Set selected chakra and open modal
      setSelectedChakra(chakra);
      setShowChakraModal(true);
    }
    // Locked items do nothing - visually disabled, no redirect
  };

  const handlePracticeClick = (practiceName, isLocked) => {
    if (!isLocked) {
      console.log(`Starting ${practiceName} practice`);
      if (practiceName === 'Morning Energy Sync') {
        setShowEnergySyncModal(true);
      } else if (practiceName === 'Gratitude Flow') {
        setShowGratitudeFlowModal(true);
      } else {
        // Navigate to other practice sessions
      }
    }
    // Locked items do nothing - visually disabled, no redirect
  };

  const handleCloseModal = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setShowEnergySyncModal(false);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleCloseGratitudeModal = () => {
    if (gratitudeAudio) {
      gratitudeAudio.pause();
      gratitudeAudio.currentTime = 0;
    }
    setShowGratitudeFlowModal(false);
    setIsGratitudePlaying(false);
    setGratitudeCurrentTime(0);
  };

  const handlePlayPause = () => {
    if (!audio) {
      alert('Audio not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      console.log('Audio paused');
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          console.log('Audio started playing');
        })
        .catch((error) => {
          // console.error('Error playing audio:', error);
          if (error.name === 'NotAllowedError') {
            alert('Please click play to start the audio. Your browser requires user interaction to play audio.');
          } else {
            // alert('Error playing audio: ' + error.message);
          }
        });
    }
  };

  const handleGratitudePlayPause = () => {
    console.log('Gratitude play/pause clicked');
    console.log('gratitudeAudio:', gratitudeAudio);
    console.log('gratitudeAudioLoading:', gratitudeAudioLoading);
    console.log('isGratitudePlaying:', isGratitudePlaying);
    
    if (!gratitudeAudio) {
      console.log('No gratitude audio object found');
      alert('Audio not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    if (gratitudeAudioLoading) {
      console.log('Audio still loading');
      alert('Audio is still loading. Please wait a moment and try again.');
      return;
    }
    
    if (isGratitudePlaying) {
      gratitudeAudio.pause();
      setIsGratitudePlaying(false);
      console.log('Gratitude audio paused');
    } else {
      console.log('Attempting to play gratitude audio');
      gratitudeAudio.play()
        .then(() => {
          setIsGratitudePlaying(true);
          console.log('Gratitude audio started playing');
        })
        .catch((error) => {
          // console.error('Error playing gratitude audio:', error);
          if (error.name === 'NotAllowedError') {
            alert('Please click play to start the audio. Your browser requires user interaction to play audio.');
          } else {
            // alert('Error playing audio: ' + error.message);
          }
        });
    }
  };

  const handleRewind = () => {
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
  };

  const handleGratitudeRewind = () => {
    if (gratitudeAudio) {
      gratitudeAudio.currentTime = Math.max(0, gratitudeAudio.currentTime - 10);
    }
  };

  // Helper function to update local progress state after save
  const updateLocalProgress = async (pauseTimeInSeconds, isCompleted) => {
    if (!selectedChakra?.chakraId) return;
    
    const updatedProgress = {
      chakraId: selectedChakra.chakraId,
      pauseTimeInSeconds: Math.floor(pauseTimeInSeconds),
      isCompleted: isCompleted
    };
    
    setAllChakraProgress(prev => {
      const existing = prev.findIndex(p => p.chakraId === selectedChakra.chakraId);
      if (existing >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existing] = updatedProgress;
        return updated;
      } else {
        // Add new
        return [...prev, updatedProgress];
      }
    });
    
    console.log(`✅ Updated local progress for chakraId: ${selectedChakra.chakraId}`, updatedProgress);
  };

  const handleCloseChakraModal = async () => {
    // Reset UI sync flag so it can sync again when modal reopens
    uiSyncedRef.current = false;
    
    // Save progress before closing
    if (chakraAudio && saveProgressOnPauseRef.current && chakraAudio.currentTime > 0) {
      await saveProgressOnPauseRef.current(chakraAudio.currentTime);
      // Update local progress state after saving
      await updateLocalProgress(chakraAudio.currentTime, false);
    }

    if (chakraAudio) {
      chakraAudio.pause();
      chakraAudio.currentTime = 0;
      // Don't clear src here - let the useEffect cleanup handle it
      // Clearing src triggers an error event
    }
    setShowChakraModal(false);
    setIsChakraPlaying(false);
    setChakraCurrentTime(0);
    setSelectedChakra(null);
    setChakraAudio(null);
  };

  const handleChakraPlayPause = async () => {
    if (!chakraAudio) {
      alert('Audio not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    if (isChakraPlaying) {
      chakraAudio.pause();
      setIsChakraPlaying(false);
      console.log('Chakra audio paused');
      
      // Save progress on pause
      if (saveProgressOnPauseRef.current && chakraAudio.currentTime > 0) {
        await saveProgressOnPauseRef.current(chakraAudio.currentTime);
        // Update local progress state after saving
        await updateLocalProgress(chakraAudio.currentTime, false);
      }
    } else {
      // Before playing, set position to saved time if available
      if (progress && progress.pauseTimeInSeconds > 0 && !progress.isCompleted && chakraAudio.duration) {
        const savedPosition = Math.min(progress.pauseTimeInSeconds, chakraAudio.duration);
        if (Math.abs(chakraAudio.currentTime - savedPosition) > 1) {
          chakraAudio.currentTime = savedPosition;
          setChakraCurrentTime(savedPosition);
        }
      }
      
      // Play the audio
      try {
        await chakraAudio.play();
        setIsChakraPlaying(true);
        console.log(`▶️ Audio started playing from position: ${chakraAudio.currentTime.toFixed(2)} seconds`);
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          alert('Please click play to start the audio. Your browser requires user interaction to play audio.');
        } else {
          console.error('Error playing chakra audio:', error);
          toastService.error('Failed to play audio. Please try again.');
        }
      }
    }
  };

  const handleChakraRewind = () => {
    if (chakraAudio) {
      chakraAudio.currentTime = Math.max(0, chakraAudio.currentTime - 10);
    }
  };

  const formatTime = (seconds) => {
    if (typeof seconds === 'string') {
      // If it's already a formatted string like "10 minutes", return it
      return seconds;
    }
    if (isNaN(seconds) || seconds < 0 || !seconds) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleStartPlan = () => {
    setShowPricingModal(false);
    navigate('/subscription');
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileClose = () => {
    setShowProfileDropdown(false);
  };

  const handleProfileOption = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile option clicked, navigating to profile-settings');
    // Close dropdown first
    setShowProfileDropdown(false);
    // Then navigate after a small delay
    setTimeout(() => {
      navigate('/profile-settings');
    }, 100);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Logout button clicked');
    
    try {
      // Close the dropdown first
      setShowProfileDropdown(false);
      
      // Clear all localStorage and sessionStorage on logout
      localStorage.clear();
      sessionStorage.clear();
      
      // Show logout message
      console.log('User logged out successfully');
      
      // Force redirect to landing page using window.location to bypass React Router
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: still try to redirect
      window.location.href = '/';
    }
  };

  // Test function for debugging audio
  const testAudio = () => {
    console.log('Testing audio...');
    const audioPath = '/smooth-jazz-podcast-instrumental-background-music-355744.mp3';
    console.log('Testing audio path:', audioPath);
    console.log('Full URL:', window.location.origin + audioPath);
    
    const testAudio = new Audio(audioPath);
    testAudio.preload = 'auto';
    
    testAudio.addEventListener('loadedmetadata', () => {
      console.log('Test audio loaded successfully, duration:', testAudio.duration);
    });
    
    testAudio.addEventListener('canplay', () => {
      console.log('Test audio can play');
    });
    
    testAudio.addEventListener('error', (e) => {
      // console.error('Test audio error:', e);
      // console.error('Error details:', e.target.error);
    });
    
    testAudio.load();
    
    // Also test if we can fetch the file
    fetch(audioPath)
      .then(response => {
        console.log('File fetch response:', response.status, response.statusText);
        if (response.ok) {
          console.log('File is accessible via fetch');
        } else {
          // console.error('File not accessible via fetch');
        }
      })
      .catch(error => {
        // console.error('File fetch error:', error);
      });
  };

  // Make testAudio available globally for debugging
  useEffect(() => {
    window.testAudio = testAudio;
  }, []);

  // Use API data if available, otherwise fallback to empty array
  const chakraData = chakrasFromAPI.length > 0 ? chakrasFromAPI : [];

  const guidedPracticesData = [
    {
      name: 'Morning Energy Sync',
      description: 'Start your day aligned with your dog\'s energy',
      duration: '8 minutes',
      isLocked: false,
      isPremium: false
    },
    {
      name: 'Deep Bonding Meditation',
      description: 'Strengthen your spiritual connection',
      duration: '15 minutes',
      isLocked: true,
      isPremium: true
    },
    {
      name: 'Healing Circle Practice',
      description: 'Send healing energy to your dog',
      duration: '12 minutes',
      isLocked: true,
      isPremium: true
    },
    {
      name: 'Gratitude Flow',
      description: 'Appreciate the gift of your bond',
      duration: '10 minutes',
      isLocked: false,
      isPremium: false
    }
  ];

  const getChakraColorClasses = (color) => {
    const colorMap = {
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
      yellow: 'from-yellow-500 to-yellow-600',
      green: 'from-green-500 to-green-600',
      blue: 'from-blue-500 to-blue-600',
      indigo: 'from-indigo-500 to-indigo-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100" style={{overflow: 'visible'}}>
      {/* Top Navigation Bar */}
      <Navbar currentPage="rituals" onUpgrade={handleUpgrade} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8" style={{overflow: 'visible'}}>
        {/* Header Section */}
        <div 
          id="header-section"
          data-animate
          className={`text-center mb-8 transition-all duration-1000 delay-200 ${
            isVisible['header-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Chakra Rituals
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Align your energy with jojo through guided chakra practices and spiritual rituals.
          </p>
        </div>

        {/* Progress/Statistics Section */}
        <div 
          id="stats-section"
          data-animate
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-400 ${
            isVisible['stats-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Completed Rituals */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {allChakraProgress.filter(p => p.isCompleted).length}
            </div>
            <div className="text-gray-600">Completed Rituals</div>
          </div>

          {/* Current Bonded Score */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{ritualStats.bondedScore}</div>
            <div className="text-gray-600">Current Bonded Score</div>
          </div>

          {/* Day Streak */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{ritualStats.dayStreak}</div>
            <div className="text-gray-600">Day Streak</div>
          </div>

          {/* Energy Sync */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-2">{ritualStats.energySync}%</div>
            <div className="text-gray-600">Energy Sync</div>
          </div>
        </div>

        {/* Content Navigation Tabs */}
        <div 
          id="tabs-section"
          data-animate
          className={`mb-8 transition-all duration-1000 delay-600 ${
            isVisible['tabs-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setActiveTab('chakra-alignment')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'chakra-alignment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chakra Alignment
            </button>
            <button
              onClick={() => setActiveTab('guided-practices')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'guided-practices'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Guided Practices
            </button>
          </div>
        </div>

        {/* Content Cards Grid */}
        <div 
          id="content-grid"
          data-animate
          className={`transition-all duration-1000 delay-800 ${
            isVisible['content-grid'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {activeTab === 'chakra-alignment' ? (
            /* Chakra Alignment Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chakrasLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading chakras...</p>
                </div>
              ) : chakraData.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600">No chakras available at the moment.</p>
                </div>
              ) : (
                chakraData.map((chakra, index) => (
                <div
                  key={chakra.chakraId || chakra.name || index}
                  className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 ${
                    chakra.isLocked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {/* Premium Badge for Locked Items */}
                  {chakra.isLocked && (
                    <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>⭐</span>
                      <span>Premium</span>
                    </div>
                  )}

                  {/* Chakra Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${getChakraColorClasses(chakra.color)} rounded-full flex items-center justify-center mb-4 ${
                    chakra.isLocked ? 'opacity-60' : ''
                  }`}>
                    <span className="text-2xl">✨</span>
                  </div>

                  {/* Chakra Info */}
                  <div className="text-left mb-4">
                    <h3 className={`text-lg font-semibold ${chakra.isLocked ? 'text-gray-500' : 'text-gray-900'} mb-2`}>{chakra.name}</h3>
                    <p className={`${chakra.isLocked ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>{chakra.description}</p>
                    <div className={`inline-block ${
                      chakra.isLocked 
                        ? 'bg-gray-200 text-gray-500' 
                        : 'bg-gray-100 text-gray-700'
                    } px-3 py-1 rounded-full text-xs font-medium`}>
                      {typeof chakra.duration === 'number' && chakra.duration > 0 
                        ? formatTime(chakra.duration) 
                        : 'Loading...'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    {chakra.isLocked ? (
                      <button
                        disabled
                        title="Premium Feature - Upgrade to access"
                        className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-not-allowed opacity-60"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRitualClick(chakra, false)}
                        className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          ) : (
            /* Guided Practices Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {guidedPracticesData.map((practice, index) => (
                <div
                  key={practice.name}
                  className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 relative ${
                    practice.isLocked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {/* Premium Badge for Locked Items */}
                  {practice.isLocked && (
                    <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>⭐</span>
                      <span>Premium</span>
                    </div>
                  )}

                  {/* Practice Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-lg font-semibold ${practice.isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{practice.name}</h3>
                      {practice.isPremium && !practice.isLocked && (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </div>
                    <p className={`${practice.isLocked ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>{practice.description}</p>
                    <div className="flex items-center justify-between">
                      <div className={`inline-block ${
                        practice.isLocked 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-gray-100 text-gray-700'
                      } px-3 py-1 rounded-full text-xs font-medium`}>
                        {practice.duration}
                      </div>
                      {/* Action Button */}
                      {practice.isLocked ? (
                        <button
                          disabled
                          title="Premium Feature - Upgrade to access"
                          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-not-allowed opacity-60"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePracticeClick(practice.name, false)}
                          className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110"
                        >
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Morning Energy Sync Modal */}
      {showEnergySyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Morning Energy Sync</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Media Player Area */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden">
                {/* Crystals Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="w-8 h-8 bg-purple-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-blue-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-500 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-pink-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-purple-500 rounded-full opacity-80"></div>
                    </div>
                    <div className="text-gray-600 text-sm">Crystals for Energy Alignment</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
                  <span className="text-sm text-gray-600">{formatTime(duration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                {/* Rewind Button */}
                <button
                  onClick={handleRewind}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  disabled={audioLoading}
                  className={`w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg ${audioLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {audioLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>


              {/* Instruction Text */}
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-purple-800 text-sm">
                  Find a comfortable position with jojo. Close your eyes and breathe deeply.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chakra Ritual Modal */}
      {showChakraModal && selectedChakra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{selectedChakra.name}</h2>
              <button
                onClick={handleCloseChakraModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Resume Message */}
              {resumeMessage && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-blue-800 flex-1">
                      {resumeMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Player Area */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getChakraColorClasses(selectedChakra.color)} flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="w-8 h-8 bg-purple-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-blue-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-500 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-pink-400 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-purple-500 rounded-full opacity-80"></div>
                    </div>
                    <div className="text-white text-sm font-medium">{selectedChakra.description}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{formatTime(chakraCurrentTime)}</span>
                  <span className="text-sm text-gray-600">{formatTime(chakraDuration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${chakraDuration > 0 ? (chakraCurrentTime / chakraDuration) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                {/* Rewind Button */}
                <button
                  onClick={handleChakraRewind}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={handleChakraPlayPause}
                  disabled={chakraAudioLoading}
                  className={`w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg ${chakraAudioLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {chakraAudioLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isChakraPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleCloseChakraModal}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Instruction Text */}
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-purple-800 text-sm">
                  Find a comfortable position. Close your eyes and breathe deeply. Let the {selectedChakra.name.toLowerCase()} energy flow through you.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gratitude Flow Modal */}
      {showGratitudeFlowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Gratitude Flow</h2>
              
              <button
                onClick={handleCloseGratitudeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Media Player Area */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden">
                {/* Crystals Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="w-10 h-10 bg-purple-300 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-300 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-green-600 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-pink-300 rounded-full opacity-80"></div>
                      <div className="w-8 h-8 bg-gray-700 rounded-full opacity-80"></div>
                    </div>
                    <div className="text-gray-600 text-sm">
                      <img src={GreenLeaves} alt="Green leaves" className="h-25 w-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{formatTime(gratitudeCurrentTime)}</span>
                  <span className="text-sm text-gray-600">{formatTime(gratitudeDuration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${gratitudeDuration > 0 ? (gratitudeCurrentTime / gratitudeDuration) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                {/* Repeat/Loop Button */}
                <button
                  onClick={handleGratitudeRewind}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={handleGratitudePlayPause}
                  disabled={gratitudeAudioLoading || !gratitudeAudio}
                  className={`w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg ${(gratitudeAudioLoading || !gratitudeAudio) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {gratitudeAudioLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : !gratitudeAudio ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : isGratitudePlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleCloseGratitudeModal}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Instruction Text */}
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-purple-800 text-sm">
                  Find a comfortable position with jojo. Close your eyes and breathe deeply.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-orange-600">Upgrade to Premium</h2>
              </div>
              <button
                onClick={handleClosePricingModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isYearlyPlan ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isYearlyPlan ? 'translate-x-6' : 'translate-x-1'
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
                      <span className="bg-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Yearly Plan</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">$199.99<span className="text-lg font-normal">/year</span></div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg text-gray-500 line-through">$239.88</span>
                    <span className="text-sm text-green-600 font-medium">Save $39.89</span>
                  </div>
                  <p className="text-sm text-gray-600">Billed yearly, cancel anytime</p>
                </div>
              </div>

              {/* Premium Features Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Premium Features</h3>
                <div className="space-y-6">
                  {/* Unlimited Chakras Rituals */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Unlimited Chakras Rituals</h4>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Access to all 7 chakra alignment practices and advanced guided meditations</p>
                    </div>
                  </div>

                  {/* Advanced Aura Tracking */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm9 0c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm9 0c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Advanced Aura Tracking</h4>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Deep energy field analysis and detailed bonded score insights</p>
                    </div>
                  </div>

                  {/* Exclusive Healing Circles */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Exclusive Healing Circles</h4>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Monthly premium group sessions and workshops with expert facilitators</p>
                    </div>
                  </div>

                  {/* Legacy Export & Archive */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Legacy Export & Archive</h4>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Download your complete journal as a beautiful PDF and backup all memories</p>
                    </div>
                  </div>

                  {/* Priority Support */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Priority Support</h4>
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Direct access to our spiritual guidance team and community moderators</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonials Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">What Our Premium Members Say</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-3 text-sm">"The premium healing circles have been life-changing for me and Luna. Worth every penny!"</p>
                    <p className="text-gray-500 font-medium text-sm">- Sarah M.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-3 text-sm">"Advanced aura tracking helped me understand Max's energy patterns so much better."</p>
                    <p className="text-gray-500 font-medium text-sm">- Michael R.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-3 text-sm">"Being able to export our legacy journal brought me so much peace during Bella's final days."</p>
                    <p className="text-gray-500 font-medium text-sm">- Emma L.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleClosePricingModal}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleStartPlan}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {isYearlyPlan ? 'Start Yearly Plan' : 'Start Monthly Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChakraRitualsPage;
