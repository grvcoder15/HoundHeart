import { useEffect, useState, useRef, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Custom hook for managing chakra ritual progress tracking
 * @param {string} chakraId - The chakra ID
 * @param {string} userId - The user ID
 * @param {React.RefObject<HTMLAudioElement>} audioRef - Reference to the audio element
 * @param {Object} preLoadedProgress - Pre-loaded progress data (optional) - { chakraId, pauseTimeInSeconds, isCompleted }
 * @returns {Object} { resumeMessage, isLoading, progress, saveProgressOnPause, saveProgressOnEnded }
 */
export const useChakraProgress = (chakraId, userId, audioRef, preLoadedProgress = null) => {
  const [resumeMessage, setResumeMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(null); // Store progress data
  const hasResumedRef = useRef(false);
  const savedProgressRef = useRef(null);

  // Helper function to format time as "1:04"
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to fetch and apply progress
  const fetchAndApplyProgress = useCallback(async () => {
    if (!chakraId || !userId) return null;

    try {
      // Use pre-loaded progress if available, otherwise fetch from API
      let progressData = preLoadedProgress;
      
      if (!progressData) {
        // Fallback to API call if pre-loaded data not available
        progressData = await apiService.getChakraRitualProgress(userId, chakraId);
      } else {
        console.log(`[GetProgress] ✅ Using pre-loaded progress for chakraId: ${chakraId}`);
      }
      
      if (progressData && progressData.pauseTimeInSeconds > 0 && !progressData.isCompleted) {
        setProgress(progressData);
        savedProgressRef.current = progressData;
        const pauseTime = progressData.pauseTimeInSeconds;
        
        // Format message as "Resuming from 1:04 minutes" or "Continuing from last paused time"
        const formattedTime = formatTime(pauseTime);
        setResumeMessage(`Resuming from ${formattedTime} minutes`);

        // Simple: Wait for audio to be ready, then set currentTime once
        const waitForAudio = () => {
          const audio = audioRef?.current;
          if (!audio) {
            setTimeout(waitForAudio, 100);
            return;
          }

          const setPosition = () => {
            if (audio && audio.duration) {
              const validPosition = Math.min(pauseTime, audio.duration);
              
              // Simple: Just set the position when audio is ready
              const trySet = () => {
                if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
                  audio.currentTime = validPosition;
                  hasResumedRef.current = true;
                  console.log(`✅ Set audio position to ${validPosition} seconds (${formattedTime})`);
                  
                  // Hide message after 5 seconds
                  setTimeout(() => {
                    setResumeMessage(null);
                  }, 5000);
                }
              };

              // If already ready, set immediately
              if (audio.readyState >= 2) {
                trySet();
              } else {
                // Wait for audio to load
                const onReady = () => {
                  audio.removeEventListener('canplay', onReady);
                  audio.removeEventListener('canplaythrough', onReady);
                  audio.removeEventListener('loadeddata', onReady);
                  trySet();
                };
                audio.addEventListener('canplay', onReady);
                audio.addEventListener('canplaythrough', onReady);
                audio.addEventListener('loadeddata', onReady);
              }
            }
          };

          setPosition();
        };

        waitForAudio();
        return progressData;
      } else {
        setProgress(null);
        savedProgressRef.current = null;
        hasResumedRef.current = false;
        setResumeMessage(null);
        return null;
      }
    } catch (error) {
      console.warn('Error loading chakra progress:', error);
      setProgress(null);
      return null;
    }
  }, [chakraId, userId, audioRef, preLoadedProgress]);

  // Fetch progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!chakraId || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await fetchAndApplyProgress();
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [chakraId, userId, fetchAndApplyProgress]);

  // Save progress on pause
  const saveProgressOnPause = async (currentTime) => {
    if (!chakraId || !userId) return;

    try {
      const pauseTimeSeconds = Math.floor(currentTime);
      await apiService.saveChakraRitualProgress(
        userId,
        chakraId,
        pauseTimeSeconds,
        false // isCompleted = false
      );
      console.log(`💾 Progress saved on pause: ${pauseTimeSeconds} seconds`);
    } catch (error) {
      console.warn('Error saving progress on pause:', error);
    }
  };

  // Save progress on ended
  const saveProgressOnEnded = async (totalDuration) => {
    if (!chakraId || !userId) return;

    try {
      const pauseTimeSeconds = Math.floor(totalDuration);
      await apiService.saveChakraRitualProgress(
        userId,
        chakraId,
        pauseTimeSeconds,
        true // isCompleted = true
      );
      console.log(`✅ Progress saved on completion`);
    } catch (error) {
      console.warn('Error saving progress on ended:', error);
    }
  };

  // Save progress before unload
  useEffect(() => {
    if (!chakraId || !userId || !audioRef?.current) return;

    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.currentTime > 0) {
        // Use sendBeacon for reliable unload saving
        const pauseTime = Math.floor(audio.currentTime);
        const data = JSON.stringify({
          userId,
          chakraId,
          pauseTimeInSeconds: pauseTime,
          isCompleted: false
        });

        // Try to save synchronously (may not always work on unload)
        // Note: VITE_API_URL already includes /api
        // Controller: ChakraController
        try {
          navigator.sendBeacon(
            `${import.meta.env.VITE_API_URL}/Chakra/save-progress`,
            new Blob([data], { type: 'application/json' })
          );
        } catch (error) {
          console.warn('Could not save progress on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chakraId, userId, audioRef]);

  return {
    resumeMessage,
    isLoading,
    progress, // Expose progress state
    saveProgressOnPause,
    saveProgressOnEnded
  };
};

