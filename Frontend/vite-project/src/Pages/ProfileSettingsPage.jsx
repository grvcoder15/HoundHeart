import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const DEVICE_API_BASE_URL = import.meta.env.VITE_API_URL || '';

const ProfileSettingsPage = () => {
  console.log('ProfileSettingsPage component rendered');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [userProfilePhoto, setUserProfilePhoto] = useState('');
  const [dogProfilePhoto, setDogProfilePhoto] = useState('');
  const [formData, setFormData] = useState({
    yourName: '',
    email: '',
    phoneNumber: '',
    dogName: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempFormData, setTempFormData] = useState({});
  const [userPhotoBase64, setUserPhotoBase64] = useState(null);
  const [dogPhotoBase64, setDogPhotoBase64] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [originalUserPhoto, setOriginalUserPhoto] = useState('');
  const [originalDogPhoto, setOriginalDogPhoto] = useState('');
  const phoneInputRef = useRef(null);
  const [notificationSettings, setNotificationSettings] = useState({
    ritualReminders: true,
    communityUpdates: true,
    weeklyDigest: false,
    premiumOffers: true
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Device Connectivity State
  const [petpaceModel, setPetpaceModel] = useState('');
  const [petpaceDevice, setPetpaceDevice] = useState('');
  const [humanWatchDevice, setHumanWatchDevice] = useState('');
  const [petpaceConnected, setPetpaceConnected] = useState(false);
  const [humanWatchConnected, setHumanWatchConnected] = useState(false);
  const [petpaceConnecting, setPetpaceConnecting] = useState(false);
  const [humanWatchConnecting, setHumanWatchConnecting] = useState(false);
  
  // Fitbit Connectivity State
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [fitbitConnecting, setFitbitConnecting] = useState(false);
  const [fitbitUserId, setFitbitUserId] = useState('');

  // FitBark Connectivity State
  const [fitbarkConnected, setFitbarkConnected] = useState(localStorage.getItem('fitbarkConnected') === 'true');
  const [fitbarkConnecting, setFitbarkConnecting] = useState(false);
  const [fitbarkEmail, setFitbarkEmail] = useState(localStorage.getItem('fitbarkEmail') || '');
  const fitbarkAuthWindowRef = useRef(null);
  const [showFitbarkCodeModal, setShowFitbarkCodeModal] = useState(false);
  const [fitbarkAuthCode, setFitbarkAuthCode] = useState('');
  const [fitbarkCodeSubmitting, setFitbarkCodeSubmitting] = useState(false);

  const closeFitbarkAuthWindow = () => {
    if (fitbarkAuthWindowRef.current && !fitbarkAuthWindowRef.current.closed) {
      fitbarkAuthWindowRef.current.close();
    }

    fitbarkAuthWindowRef.current = null;
  };

  const finalizeFitbarkConnection = async () => {
    const dogsResponse = await apiService.getFitBarkDogs();
    const dogs = Array.isArray(dogsResponse) ? dogsResponse : dogsResponse?.data;

    setFitbarkConnected(true);
    localStorage.setItem('fitbarkConnected', 'true');
    localStorage.setItem('fitbarkEmail', fitbarkEmail || '');
    setShowFitbarkCodeModal(false);
    setFitbarkAuthCode('');
    closeFitbarkAuthWindow();

    if (Array.isArray(dogs)) {
      if (dogs.length === 0) {
        console.warn('[FitBark] Connected but dog list is empty. No data will sync until at least one dog is linked in FitBark account.');
        toastService.warning('FitBark connected, but no linked dogs found. Please verify your FitBark account.');
      } else {
        toastService.success(`FitBark connected successfully. Found ${dogs.length} linked dog(s).`);
      }
    } else {
      toastService.success('FitBark connected successfully.');
    }
  };

  const handleCloseFitbarkCodeModal = () => {
    setShowFitbarkCodeModal(false);
    setFitbarkAuthCode('');
    setFitbarkCodeSubmitting(false);
    setFitbarkConnecting(false);
    closeFitbarkAuthWindow();
  };

  const handleSubmitFitbarkCode = async () => {
    const trimmedCode = fitbarkAuthCode.trim();

    if (!trimmedCode) {
      toastService.error('Authorization code is required to connect FitBark.');
      return;
    }

    setFitbarkCodeSubmitting(true);

    try {
      await apiService.exchangeFitBarkCode(trimmedCode);
      await finalizeFitbarkConnection();
    } catch (error) {
      console.error('Error submitting FitBark authorization code:', error);
      toastService.error(error.message || 'Failed to connect FitBark. Please verify the code and try again.');
    } finally {
      setFitbarkCodeSubmitting(false);
      setFitbarkConnecting(false);
    }
  };

  const handlePetpaceConnect = async () => {
    if (!hasDeviceConnectivityAccess) {
      toastService.error('Device connectivity is available for Plus and Premium members only.');
      setShowPricingModal(true);
      return;
    }

    if (!petpaceModel.trim() || !petpaceDevice.trim()) {
      toastService.error('Please enter both PetPace model and device number');
      return;
    }

    setPetpaceConnecting(true);
    
    try {
      const userId = apiService.getCurrentUserId();
      const dogId = localStorage.getItem('dogId');
      
      console.log('Connecting PetPace device:', { userId, dogId, petpaceModel, petpaceDevice });
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const requestBody = {
        userId: userId,
        dogId: dogId,
        deviceType: 'PetPace',
        deviceModel: petpaceModel,
        deviceNumber: petpaceDevice
      };
      
      console.log('Making API call to connect PetPace:', requestBody);
      
      const response = await fetch(`${DEVICE_API_BASE_URL}/devices/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('PetPace connection successful:', result);
        setPetpaceConnected(true);
        toastService.success('PetPace device connected successfully!');
      } else {
        const errorData = await response.json();
        console.error('PetPace connection failed:', errorData);
        toastService.error(errorData.message || 'Failed to connect PetPace device');
      }
    } catch (error) {
      console.error('Error connecting PetPace device:', error);
      toastService.error(error.message || 'Failed to connect PetPace device. Please try again.');
    } finally {
      setPetpaceConnecting(false);
    }
  };
  const handlePetpaceDisconnect = () => {
    if (!hasDeviceConnectivityAccess) {
      toastService.error('Device connectivity is available for Plus and Premium members only.');
      setShowPricingModal(true);
      return;
    }

    setPetpaceConnected(false);
    setPetpaceModel('');
    setPetpaceDevice('');
  };
  const handleHumanWatchConnect = async () => {
    if (!humanWatchDevice.trim()) {
      toastService.error('Please enter human watch device number');
      return;
    }

    setHumanWatchConnecting(true);
    
    try {
      const userId = apiService.getCurrentUserId();
      
      console.log('Connecting Human Watch:', { userId, humanWatchDevice });
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const requestBody = {
        userId: userId,
        dogId: null,
        deviceType: 'HumanWatch',
        deviceModel: null,
        deviceNumber: humanWatchDevice
      };
      
      console.log('Making API call to connect Human Watch:', requestBody);
      
      const response = await fetch(`${DEVICE_API_BASE_URL}/devices/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Human Watch connection successful:', result);
        setHumanWatchConnected(true);
        toastService.success('Human watch connected successfully!');
      } else {
        const errorData = await response.json();
        console.error('Human Watch connection failed:', errorData);
        toastService.error(errorData.message || 'Failed to connect human watch');
      }
    } catch (error) {
      console.error('Error connecting human watch:', error);
      toastService.error(error.message || 'Failed to connect human watch. Please try again.');
    } finally {
      setHumanWatchConnecting(false);
    }
  };
  const handleHumanWatchDisconnect = () => {
    setHumanWatchConnected(false);
    setHumanWatchDevice('');
  };
  
  // FitBark Connect Handler
  const handleFitbarkConnect = async () => {
    if (!hasDeviceConnectivityAccess) {
      toastService.error('Device connectivity is available for Plus and Premium members only.');
      setShowPricingModal(true);
      return;
    }

    setFitbarkConnecting(true);

    try {
      const response = await apiService.getFitBarkAuthUrl();
      const authUrl = response?.data?.authUrl;
      const requiresManualCode = !!response?.data?.requiresManualCode;

      if (!authUrl) {
        throw new Error(response?.message || 'Failed to get FitBark authorization URL');
      }

      fitbarkAuthWindowRef.current = window.open(
        authUrl,
        'fitbarkAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      toastService.info('Complete FitBark authorization in the popup window.');

      if (requiresManualCode) {
        toastService.info('After approving FitBark, copy the code shown by FitBark and paste it into the popup on this page.');
        setFitbarkAuthCode('');
        setShowFitbarkCodeModal(true);
        setFitbarkConnecting(false);
        return;
      }

      const checkConnection = setInterval(async () => {
        try {
          const statusResponse = await apiService.getFitBarkStatus();
          if (statusResponse?.success || statusResponse?.data?.connected) {
            clearInterval(checkConnection);
            await finalizeFitbarkConnection();
            setFitbarkConnecting(false);
          }
        } catch {
          // Keep polling while OAuth completes.
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(checkConnection);
        setFitbarkConnecting(false);
      }, 300000);
    } catch (error) {
      console.error('Error connecting FitBark:', error);
      setFitbarkConnecting(false);
      toastService.error(error.message || 'Failed to connect FitBark. Please verify your credentials and try again.');
    }
  };

  const handleFitbarkDisconnect = async () => {
    if (!hasDeviceConnectivityAccess) {
      toastService.error('Device connectivity is available for Plus and Premium members only.');
      setShowPricingModal(true);
      return;
    }

    if (confirm('Disconnect your FitBark?')) {
      try {
        await apiService.disconnectFitBark();
      } catch (error) {
        console.error('FitBark disconnect error:', error);
      }

      setFitbarkConnected(false);
      setFitbarkEmail('');
      localStorage.removeItem('fitbarkConnected');
      localStorage.removeItem('fitbarkEmail');
      toastService.success('FitBark disconnected successfully');
    }
  };

  // Fitbit Connect Handler
  const handleFitbitConnect = async () => {
    try {
      if (!hasDeviceConnectivityAccess) {
        toastService.error('Device connectivity is available for Plus and Premium members only.');
        setShowPricingModal(true);
        return;
      }

      const userId = apiService.getCurrentUserId();
      if (!userId) {
        toastService.error('Please log in to connect Fitbit');
        return;
      }

      setFitbitConnecting(true);
      
      // Get authorization URL
      const response = await apiService.getFitbitAuthUrl(userId);
      
      if (response.success) {
        // Open Fitbit OAuth in popup
        const authWindow = window.open(
          response.data.authUrl,
          'fitbitAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        toastService.info('🔄 Complete Fitbit authorization in the popup window');

        // Monitor for successful connection
        const checkConnection = setInterval(async () => {
          try {
            const statusResponse = await apiService.getFitbitStatus(userId);
            
            if (statusResponse.success) {
              // Connection successful!
              setFitbitConnected(true);
              setFitbitUserId(statusResponse.data?.fitbitUserId || '');
              setFitbitConnecting(false);
              
              clearInterval(checkConnection);
              if (authWindow && !authWindow.closed) {
                authWindow.close();
              }
              
              toastService.success('✅ Fitbit connected successfully! Data sync starting...');
            }
          } catch (error) {
            // Still checking...
          }
        }, 2000);
        
        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(checkConnection);
          setFitbitConnecting(false);
        }, 300000);
        
      } else {
        throw new Error(response.message || 'Failed to get authorization URL');
      }

    } catch (error) {
      console.error('Fitbit connection error:', error);
      toastService.error(`❌ Failed to connect Fitbit: ${error.message}`);
      setFitbitConnecting(false);
    }
  };

  // Fitbit Disconnect Handler
  const handleFitbitDisconnect = async () => {
    if (!hasDeviceConnectivityAccess) {
      toastService.error('Device connectivity is available for Plus and Premium members only.');
      setShowPricingModal(true);
      return;
    }

    if (!confirm('Are you sure you want to disconnect your Fitbit? This will stop data sync.')) {
      return;
    }

    try {
      const userId = apiService.getCurrentUserId();
      if (!userId) return;

      await apiService.disconnectFitbit(userId);
      
      setFitbitConnected(false);
      setFitbitUserId('');
      
      toastService.success('📱 Fitbit disconnected successfully');
    } catch (error) {
      console.error('Fitbit disconnect error:', error);
      toastService.error(`❌ Failed to disconnect Fitbit: ${error.message}`);
    }
  };

  // Check Fitbit status on component mount
  const checkFitbitStatus = async () => {
    try {
      const userId = apiService.getCurrentUserId();
      if (!userId) return;
      
      const response = await apiService.getFitbitStatus(userId);
      
      if (response.success) {
        setFitbitConnected(true);
        setFitbitUserId(response.data?.fitbitUserId || '');
      }
    } catch (error) {
      console.error('Error checking Fitbit status:', error);
    }
  };

  const checkFitbarkStatus = async () => {
    try {
      const response = await apiService.getFitBarkStatus();
      if (response?.success || response?.data?.connected) {
        setFitbarkConnected(true);
        localStorage.setItem('fitbarkConnected', 'true');
      }
    } catch (error) {
      console.error('Error checking FitBark status:', error);
    }
  };

  const logFitBarkSyncHeartbeat = async () => {
    try {
      const response = await apiService.getFitBarkSyncStatus();
      const data = response?.data || {};
      const interval = data?.syncIntervalMinutes || 4;
      const dogCount = data?.dogCount || 0;
      const recentVitalsCount = data?.recentVitalsCount || 0;
      const lastSyncDataUtc = data?.lastSyncDataUtc || null;
      const reason = data?.reason || 'No reason provided';

      console.log(
        `[FitBark 4-min heartbeat] connected=${!!data?.connected}, dogs=${dogCount}, recentVitals=${recentVitalsCount}, lastDataUtc=${lastSyncDataUtc || 'none'}, interval=${interval}m, reason=${reason}`
      );

      if (dogCount === 0) {
        console.warn('[FitBark] No dogs in backend table, so poll cycle will skip and DogVitals will stay empty.');
      }
    } catch (error) {
      console.error('[FitBark 4-min heartbeat] Failed to fetch sync status:', error);
    }
  };

  // Journey Statistics — dynamic, defaults to 0 for new users
  const [journeyStats, setJourneyStats] = useState({
    bondedScore: 0,
    ritualsCompleted: 0,
    journalEntries: 0
  });

  // Test if component is working
  if (window.location.pathname === '/profile-settings') {
    console.log('Successfully navigated to profile-settings page');
  }

  // Load existing device connections on mount
  useEffect(() => {
    const loadDeviceConnections = async () => {
      try {
        const userId = apiService.getCurrentUserId();
        if (!userId) return;
        
        const response = await fetch(`${DEVICE_API_BASE_URL}/devices/status/${userId}`);
        if (response.ok) {
          const result = await response.json();
          const connections = result.data || [];
          
          // Check for PetPace connection
          const petpaceConnection = connections.find(conn => conn.deviceType === 'PetPace');
          if (petpaceConnection && petpaceConnection.isConnected) {
            setPetpaceConnected(true);
            setPetpaceModel(petpaceConnection.deviceModel || '');
            setPetpaceDevice(petpaceConnection.deviceNumber || '');
          }
          
          // Check for HumanWatch connection
          const humanWatchConnection = connections.find(conn => conn.deviceType === 'HumanWatch');
          if (humanWatchConnection && humanWatchConnection.isConnected) {
            setHumanWatchConnected(true);
            setHumanWatchDevice(humanWatchConnection.deviceNumber || '');
          }
        }
      } catch (error) {
        console.error('Error loading device connections:', error);
      }
    };
    
    loadDeviceConnections();
    checkFitbitStatus(); // Add Fitbit status check on mount
    checkFitbarkStatus(); // Add FitBark status check on mount
  }, []);

  useEffect(() => {
    logFitBarkSyncHeartbeat();

    const heartbeatInterval = setInterval(() => {
      logFitBarkSyncHeartbeat();
    }, 4 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [fitbarkConnected]);

  // Fetch Journey Statistics on mount
  useEffect(() => {
    const fetchJourneyStats = async () => {
      try {
        const userId = apiService.getCurrentUserId();
        if (!userId) return;

        const dogId = localStorage.getItem('dogId') || '00000000-0000-0000-0000-000000000000';

        // Fetch all 3 metrics in parallel
        const [summaryRes, journalRes, bondedRes] = await Promise.allSettled([
          apiService.getDashboardSummary(userId),
          apiService.getUserJournalEntries(userId, 1, 1),
          apiService.calculateBondedScore(userId, dogId)
        ]);

        const stats = { bondedScore: 0, ritualsCompleted: 0, journalEntries: 0 };

        // Bonded Score from dashboard summary
        if (summaryRes.status === 'fulfilled' && summaryRes.value) {
          const s = summaryRes.value;
          stats.bondedScore = Math.round(s.BondedScore ?? s.bondedScore ?? 0);
        }

        // Journal Entries total count
        if (journalRes.status === 'fulfilled' && journalRes.value) {
          const j = journalRes.value;
          stats.journalEntries = j.TotalCount ?? j.totalCount ?? 0;
        }

        // Rituals Completed from bonded score response
        if (bondedRes.status === 'fulfilled' && bondedRes.value) {
          const b = bondedRes.value?.data || bondedRes.value || {};
          stats.ritualsCompleted = b.RitualDaysCount ?? b.ritualDaysCount ?? 0;
        }

        setJourneyStats(stats);
      } catch (error) {
        console.error('Error fetching journey stats:', error);
      }
    };

    fetchJourneyStats();
  }, []);


  // Load profile photos from localStorage
  useEffect(() => {
    const sanitize = (v) => (!v || v === 'null' || v === 'undefined') ? '' : v;
    const userPhoto = sanitize(localStorage.getItem('UserprofilPhotoUrl'));
    console.log('userProfilePhoto', userPhoto);
    setUserProfilePhoto(userPhoto);

    const dogPhoto = sanitize(localStorage.getItem('DogprofilPhotoUrl'));
    console.log('dogProfilePhoto', dogPhoto);
    setDogProfilePhoto(dogPhoto);
    const handleClickOutside = (event) => {
      if (showProfileDropdown &&
        !event.target.closest('.profile-dropdown-container') &&
        !event.target.closest('[data-profile-button]')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Load user profile details (name, email, dog) from API/localStorage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await apiService.getUserProfile();
        const data = profile?.data || profile || {};
        const fullName = data.fullName || data.profileName || data.name || '';
        const email = data.email || '';
        const dogName = data?.dog?.dogName || localStorage.getItem('dogName') || '';
        const sanitize = (v) => (!v || v === 'null' || v === 'undefined') ? '' : v;
        const userPhoto = sanitize(data.profilePhoto || localStorage.getItem('UserprofilPhotoUrl'));
        const dogPhoto = sanitize(data?.dog?.profilePhoto || localStorage.getItem('DogprofilPhotoUrl'));

        setFormData(prev => ({
          ...prev,
          yourName: fullName,
          email: email,
          phoneNumber: data.phoneNumber || data.PhoneNumber || '',
          dogName: dogName,
        }));
        if (userPhoto) setUserProfilePhoto(userPhoto);
        if (dogPhoto) setDogProfilePhoto(dogPhoto);
      } catch (_) {
        // Fallback from localStorage if API fails
        const dogName = localStorage.getItem('dogName') || '';
        setFormData(prev => ({ ...prev, dogName }));
      }
    };
    loadProfile();
  }, []);

  const handleUpgrade = () => {
    console.log('Upgrade clicked');
    setShowPremiumModal(true);
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };

  const handleUpgradeClick = () => {
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
    navigate(`/subscription?billing=${isYearlyPlan ? 'yearly' : 'monthly'}`);
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileOption = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile option clicked, navigating to profile-settings');
    setShowProfileDropdown(false);
    // Already on profile settings page, so just close dropdown
  };

  const handleLogout = () => {
    // Close the dropdown first
    setShowProfileDropdown(false);

    // Clear all localStorage and sessionStorage on logout
    localStorage.clear();
    sessionStorage.clear();

    // Show logout message
    console.log('User logged out successfully');

    // Force redirect to landing page with replace to prevent back navigation
    setTimeout(() => {
      console.log('Redirecting to landing page');
      navigate('/', { replace: true });
      console.log('Redirected to landing page1');
      // Force a page reload to ensure clean state
      window.location.href = '/';
      console.log('Redirected to landing page3');

    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditing) {
      setTempFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = (photoType, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        if (photoType === 'userPhoto') {
          setUserPhotoBase64(base64);
          setUserProfilePhoto(base64); // Update preview immediately
        } else if (photoType === 'dogPhoto') {
          setDogPhotoBase64(base64);
          setDogProfilePhoto(base64); // Update preview immediately
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const triggerPhotoUpload = (photoType) => {
    const input = document.getElementById(`${photoType}-input`);
    if (input) {
      input.click();
    }
  };

  const handleEdit = () => {
    setTempFormData({ ...formData });
    setOriginalUserPhoto(userProfilePhoto); // Store original photos
    setOriginalDogPhoto(dogProfilePhoto);
    setUserPhotoBase64(null); // Reset photo changes when starting edit
    setDogPhotoBase64(null);
    setIsEditing(true);
  };

  const focusPhoneInput = () => {
    window.setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.focus();
        phoneInputRef.current.select();
      }
    }, 0);
  };

  const handlePhoneNumberCTA = () => {
    if (!isEditing) {
      handleEdit();
    }
    focusPhoneInput();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmedPhoneNumber = (tempFormData.phoneNumber ?? formData.phoneNumber ?? '').trim();

      // Prepare data for API
      const profileData = {
        profileName: tempFormData.yourName || formData.yourName || null,
        email: tempFormData.email || formData.email || null,
        phoneNumber: trimmedPhoneNumber || null,
        base64Image: userPhotoBase64 || null,
        dogName: tempFormData.dogName || formData.dogName || null,
        dogBase64Image: dogPhotoBase64 || null
      };

      // Call API to update profile
      const response = await apiService.setupProfile(profileData);

      // Update local state with saved data
      setFormData(prev => ({
        ...prev,
        ...tempFormData,
        phoneNumber: trimmedPhoneNumber,
      }));
      setIsEditing(false);

      // Clear photo base64 states after successful save
      setUserPhotoBase64(null);
      setDogPhotoBase64(null);

      // Update profile photos from response if available
      if (response?.data) {
        if (response.data.ProfilePhoto) {
          setUserProfilePhoto(response.data.ProfilePhoto);
        }
        if (response.data.Dog?.DogProfilePhoto) {
          setDogProfilePhoto(response.data.Dog.DogProfilePhoto);
        }
      }

      toastService.success('Profile updated successfully!');
      console.log('Profile information saved:', tempFormData);
    } catch (error) {
      console.error('Error saving profile:', error);
      toastService.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempFormData({});
    setUserPhotoBase64(null); // Clear photo changes
    setDogPhotoBase64(null);
    setUserProfilePhoto(originalUserPhoto); // Revert to original photos
    setDogProfilePhoto(originalDogPhoto);
    setIsEditing(false);
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', formData);
    // Here you would typically save to backend
    alert('Changes saved successfully!');
  };

  const isPhoneNumberMissing = !(formData.phoneNumber || '').trim();

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };


  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' }
  ];

  const handleExportMyData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const [profileResponse, journalResponse] = await Promise.all([
        apiService.getUserProfile(),
        userId ? apiService.getUserJournalEntries(userId, 1, 1000) : Promise.resolve(null)
      ]);

      const profileData = profileResponse?.data || profileResponse || {};
      const journalPayload = journalResponse?.data || journalResponse || {};
      const journalEntries = journalPayload?.entries || journalPayload?.Entries || [];

      const exportedAt = new Date();
      const safeJournalEntries = Array.isArray(journalEntries) ? journalEntries : [];
      const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      const formatDate = (value) => {
        if (!value) return 'Not provided';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Not provided' : date.toLocaleString();
      };
      const renderList = (items = [], emptyText = 'Not provided') => {
        if (!Array.isArray(items) || items.length === 0) return `<li>${escapeHtml(emptyText)}</li>`;
        return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      };
      const renderTraits = (items = []) => {
        if (!Array.isArray(items) || items.length === 0) return `<li>Not provided</li>`;
        return items.map((item) => `<li>${escapeHtml(item?.traitName || item?.TraitName || 'Unnamed trait')}</li>`).join('');
      };
      const renderEntries = safeJournalEntries.map((entry, index) => {
        const tags = typeof entry?.tags === 'string'
          ? entry.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : Array.isArray(entry?.tags) ? entry.tags : [];

        return `
          <section class="entry-card">
            <h3>Entry ${index + 1}</h3>
            <p><strong>Type:</strong> ${escapeHtml(entry?.entryType || 'Not provided')}</p>
            <p><strong>Created:</strong> ${escapeHtml(formatDate(entry?.createdOn || entry?.createdAt))}</p>
            <p><strong>Content:</strong></p>
            <div class="content-box">${escapeHtml(entry?.content || 'No content')}</div>
            <p><strong>Tags:</strong> ${escapeHtml(tags.join(', ') || 'None')}</p>
            <p><strong>Media Type:</strong> ${escapeHtml(entry?.mediaType || 'None')}</p>
            ${entry?.imageUrl ? `<p><strong>Image:</strong> <a href="${escapeHtml(entry.imageUrl)}" target="_blank" rel="noopener noreferrer">View image</a></p>` : ''}
            ${entry?.mediaUrl ? `<p><strong>Attachment:</strong> <a href="${escapeHtml(entry.mediaUrl)}" target="_blank" rel="noopener noreferrer">Open media</a></p>` : ''}
          </section>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>HoundHeart Data Export</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f8fafc; color: #1f2937; margin: 0; padding: 32px; }
              .container { max-width: 920px; margin: 0 auto; }
              .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05); }
              h1, h2, h3 { margin-top: 0; }
              h1 { font-size: 32px; color: #7c3aed; }
              h2 { font-size: 20px; margin-bottom: 16px; }
              h3 { font-size: 18px; margin-bottom: 12px; }
              p, li { line-height: 1.6; }
              ul { margin: 8px 0 0 20px; padding: 0; }
              .muted { color: #6b7280; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
              .content-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; white-space: pre-wrap; }
              .entry-card { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
              .entry-card:first-child { border-top: none; padding-top: 0; margin-top: 0; }
              a { color: #7c3aed; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>HoundHeart Data Export</h1>
                <p class="muted">Exported on ${escapeHtml(exportedAt.toLocaleString())}</p>
              </div>

              <div class="card">
                <h2>Profile</h2>
                <div class="grid">
                  <div>
                    <p><strong>Name:</strong> ${escapeHtml(profileData?.fullName || profileData?.profileName || 'Not provided')}</p>
                    <p><strong>Email:</strong> ${escapeHtml(profileData?.email || 'Not provided')}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(profileData?.phoneNumber || 'Not provided')}</p>
                  </div>
                  <div>
                    <p><strong>Journal Entries:</strong> ${escapeHtml(profileData?.journalEntryCount ?? safeJournalEntries.length)}</p>
                    <p><strong>Profile Setup Complete:</strong> ${profileData?.isProfileSetupCompleted ? 'Yes' : 'No'}</p>
                    <p><strong>Google Sign-In:</strong> ${profileData?.isGoogleSignIn ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <h2>Dog Profile</h2>
                <p><strong>Name:</strong> ${escapeHtml(profileData?.dog?.dogName || 'Not provided')}</p>
                <p><strong>Breed:</strong> ${escapeHtml(profileData?.dog?.breed || 'Not provided')}</p>
                <p><strong>Age:</strong> ${escapeHtml(profileData?.dog?.age || 'Not provided')}</p>
                ${profileData?.dog?.profilePhoto ? `<p><strong>Photo:</strong> <a href="${escapeHtml(profileData.dog.profilePhoto)}" target="_blank" rel="noopener noreferrer">View dog photo</a></p>` : ''}
              </div>

              <div class="card">
                <h2>Your Traits</h2>
                <ul>${renderTraits(profileData?.userSelectedTraits)}</ul>
              </div>

              <div class="card">
                <h2>Your Dog's Traits</h2>
                <ul>${renderTraits(profileData?.dogSelectedTraits)}</ul>
              </div>

              <div class="card">
                <h2>Notification Preferences</h2>
                <ul>
                  ${renderList([
                    `Ritual Reminders: ${notificationSettings.ritualReminders ? 'Enabled' : 'Disabled'}`,
                    `Community Updates: ${notificationSettings.communityUpdates ? 'Enabled' : 'Disabled'}`,
                    `Weekly Digest: ${notificationSettings.weeklyDigest ? 'Enabled' : 'Disabled'}`,
                    `Premium Offers: ${notificationSettings.premiumOffers ? 'Enabled' : 'Disabled'}`,
                  ])}
                </ul>
              </div>

              <div class="card">
                <h2>Journal Entries</h2>
                ${safeJournalEntries.length > 0 ? renderEntries : '<p>No journal entries found.</p>'}
              </div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `houndheart-data-export-${exportedAt.toISOString().slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toastService.success('Your data export has started.');
    } catch (error) {
      console.error('Export data error:', error);
      toastService.error(error?.message || 'Failed to export your data. Please try again.');
    }
  };

  const handlePrivacySettings = () => {
    handlePrivacy();
  };

  const handleDeleteAccount = () => {
    toastService.info('Delete account is not available yet. Please contact support to proceed safely.');
  };

  const handlePrivacy = () => {
    navigate('/terms-of-use')
  }

  // Derived user info for header avatar and dropdown
  const headerName = (() => {
    if (formData.yourName && formData.yourName.trim()) return formData.yourName;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.fullName || u.profileName || u.name || '';
    } catch { return ''; }
  })();
  const headerEmail = (() => {
    if (formData.email && formData.email.trim()) return formData.email;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.email || '';
    } catch { return ''; }
  })();
  const headerInitials = (() => {
    const n = headerName || '';
    const initials = n.split(' ').filter(Boolean).map(w => w.charAt(0)).join('').toUpperCase();
    return (initials || 'U').slice(0, 2);
  })();

  const membershipTier = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tier = String(user?.tierLevel || '').toLowerCase().trim();

      if (tier === 'premium' || tier === 'plus' || tier === 'free') {
        return tier;
      }

      // Legacy fallback for older sessions where only roleId was persisted.
      const roleId = Number(user?.roleId ?? user?.RoleId);
      return roleId === 2 ? 'premium' : 'free';
    } catch {
      return 'free';
    }
  })();

  const hasDeviceConnectivityAccess = membershipTier === 'plus' || membershipTier === 'premium';

  const membershipLabel = membershipTier === 'premium'
    ? 'Premium Member'
    : membershipTier === 'plus'
      ? 'Plus Member'
      : 'Free Member';

  const membershipDescription = membershipTier === 'premium'
    ? 'All premium features unlocked'
    : membershipTier === 'plus'
      ? 'Core paid features unlocked'
      : 'Limited access to features';

  const memberSinceText = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const source = user.createdAt || user.CreatedAt || user.registrationDate;
      if (!source) return 'Member since -';
      const parsedDate = new Date(source);
      if (Number.isNaN(parsedDate.getTime())) return 'Member since -';
      return `Member since ${parsedDate.toLocaleDateString('en-GB')}`;
    } catch {
      return 'Member since -';
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={HoundHeartLogo} alt="HoundHeart" className="h-8 w-8" />
            <span className="text-2xl font-bold text-gray-900">HoundHeart™</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/journal')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Journal
            </button>
            <button
              onClick={() => navigate('/rituals')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Rituals
            </button>
            {/* <button 
              onClick={() => navigate('/community')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Community
            </button> */}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {membershipTier === 'free' ? (
              <button
                onClick={handleUpgrade}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Upgrade</span>
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg">
                <div className="text-sm font-semibold leading-tight">{membershipTier === 'premium' ? 'Premium Active' : 'Plus Active'}</div>
              </div>
            )}
            <div className="relative profile-dropdown-container">
              <button
                onClick={handleProfileClick}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-white font-bold text-lg">{headerInitials}</span>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-lg font-semibold text-gray-900">{headerName || 'User'}</div>
                    <div className="text-sm text-gray-500">{headerEmail}</div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-2">
                    <button
                      onClick={handleProfileOption}
                      data-profile-button
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-700">Profile</span>
                    </button>

                    {membershipTier === 'free' && (
                      <button
                        onClick={handleUpgrade}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-gray-700">Upgrade Plan</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Section */}
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-purple-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account and spiritual journey preferences</p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-gray-100 rounded-lg mb-6 p-2">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 font-medium text-sm transition-all duration-200 rounded-full ${activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {activeTab === 'profile' && (
              <div>
                {/* Personal Information Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    <div className="ml-auto">
                      {!isEditing ? (
                        <button
                          onClick={handleEdit}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-sm">Edit</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleCancel}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm">Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    {/* Profile Picture */}
                    <div className="relative">
                      {userProfilePhoto ? (
                        <img
                          src={userProfilePhoto}
                          alt="User Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">😀</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerPhotoUpload('userPhoto')}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 space-y-4">
                      {(membershipTier === 'premium' || membershipTier === 'plus') && (
                        <div>
                          {membershipTier === 'premium' ? (
                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-900 shadow-sm">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-semibold">Premium Member</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-sm font-semibold">Plus Member</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="yourName"
                            value={tempFormData.yourName || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-gray-900">{formData.yourName}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={tempFormData.email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-gray-900">{formData.email}</div>
                        )}
                      </div>
                      <div className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${isPhoneNumberMissing ? 'border-amber-300 bg-gradient-to-r from-amber-50 via-white to-orange-50' : 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50'}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <label className="block text-sm font-semibold text-gray-900">Phone Number</label>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isPhoneNumberMissing ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                                {isPhoneNumberMissing ? 'Add for SMS alerts' : 'SMS alerts ready'}
                              </span>
                            </div>
                            <p className={`mt-2 text-sm ${isPhoneNumberMissing ? 'text-amber-900' : 'text-gray-600'}`}>
                              Add your phone number to receive important wellness notifications and urgent SMS alerts.
                            </p>
                          </div>

                          {!isEditing && isPhoneNumberMissing && (
                            <button
                              type="button"
                              onClick={handlePhoneNumberCTA}
                              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-amber-600 hover:to-orange-600"
                            >
                              Add Phone Number
                            </button>
                          )}
                        </div>

                        <div className="mt-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                ref={phoneInputRef}
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                name="phoneNumber"
                                value={tempFormData.phoneNumber || ''}
                                onChange={handleInputChange}
                                placeholder="+91 98765 43210"
                                className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 ${isPhoneNumberMissing ? 'border-amber-300 focus:ring-amber-500' : 'border-gray-300 focus:ring-purple-500'}`}
                              />
                              <p className="text-xs text-gray-500">Use the number where you want to receive Hound Heart SMS alerts.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-gray-900 font-medium">
                                {formData.phoneNumber || <span className="text-amber-800 italic text-sm">No phone number added yet</span>}
                              </div>
                              {!isPhoneNumberMissing && (
                                <button
                                  type="button"
                                  onClick={handlePhoneNumberCTA}
                                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-50"
                                >
                                  Update Number
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dog Information Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Dog Information</h2>
                  </div>

                  <div className="flex items-start space-x-6">
                    {/* Dog Profile Picture */}
                    <div className="relative">
                      {dogProfilePhoto ? (
                        <img
                          src={dogProfilePhoto}
                          alt="Dog Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-teal-400"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">🐶</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerPhotoUpload('dogPhoto')}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dog's Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="dogName"
                            value={tempFormData.dogName || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-gray-900">{formData.dogName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>


                {/* Action Buttons - Only show when editing */}
                {isEditing && (
                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Hidden File Inputs */}
                <input
                  id="userPhoto-input"
                  type="file"
                  accept="image/*"
                  capture="camera"
                  onChange={(e) => handlePhotoUpload('userPhoto', e)}
                  className="hidden"
                />
                <input
                  id="dogPhoto-input"
                  type="file"
                  accept="image/*"
                  capture="camera"
                  onChange={(e) => handlePhotoUpload('dogPhoto', e)}
                  className="hidden"
                />

              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 relative">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Connectivity Status</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">Connect your PetPace collar and wellness watch to enable real-time monitoring on your Wellness dashboard.</p>

                {!hasDeviceConnectivityAccess && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm flex items-center justify-between gap-3">
                    <span>Device connectivity is locked for Free tier. Upgrade to Plus or Premium to connect devices.</span>
                    <button
                      onClick={handleUpgradeClick}
                      className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md font-semibold text-xs"
                    >
                      Upgrade
                    </button>
                  </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!hasDeviceConnectivityAccess ? 'opacity-60 pointer-events-none select-none' : ''}`}>

                   {/* PETPACE Integration */}
                   <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${
                     petpaceConnected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                   }`}>
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                           petpaceConnected ? 'bg-green-500' : 'bg-gray-300'
                         }`}>
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm2.122-2.122a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="font-semibold text-gray-900">PetPace</h3>
                           <p className="text-xs text-gray-500">Dog Health Collar</p>
                         </div>
                       </div>
                       <div className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full ${
                         petpaceConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                       }`}>
                         <div className={`w-2 h-2 rounded-full ${
                           petpaceConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                         }`}></div>
                         <span>{petpaceConnected ? 'Connected' : 'Disconnected'}</span>
                       </div>
                     </div>
                     {!petpaceConnected ? (
                       <div className="space-y-3">
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">PetPace Model</label>
                           <input type="text" value={petpaceModel} onChange={(e) => setPetpaceModel(e.target.value)} placeholder="e.g. PetPace Smart Collar V2" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Device Number / ID</label>
                           <input type="text" value={petpaceDevice} onChange={(e) => setPetpaceDevice(e.target.value)} placeholder="e.g. PP-2024-XXXX" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                         </div>
                         <button onClick={handlePetpaceConnect} disabled={petpaceConnecting || !petpaceModel || !petpaceDevice} className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${petpaceConnecting || !petpaceModel || !petpaceDevice ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'}`}>
                           {petpaceConnecting ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Connecting...</span></>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg><span>Connect Device</span></>)}
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <div className="bg-white rounded-lg p-3 border border-green-200 space-y-1">
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Model</span><span className="font-semibold text-gray-800">{petpaceModel}</span></div>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Device ID</span><span className="font-semibold text-gray-800">{petpaceDevice}</span></div>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="text-green-600 font-semibold">● Live Monitoring</span></div>
                         </div>
                         <button onClick={handlePetpaceDisconnect} className="w-full py-2.5 rounded-lg font-semibold text-sm text-red-600 border-2 border-red-300 hover:bg-red-50 transition-all duration-300">Disconnect</button>
                       </div>
                     )}
                   </div>

                   {/* HUMANWATCH - Commented out, replaced by Fitbit. Uncomment if client needs HumanWatch integration in future */}
                   {/* 
                   <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${
                     humanWatchConnected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                   }`}>
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                           humanWatchConnected ? 'bg-green-500' : 'bg-gray-300'
                         }`}>
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="font-semibold text-gray-900">Human Watch</h3>
                           <p className="text-xs text-gray-500">Wellness Wearable</p>
                         </div>
                       </div>
                       <div className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full ${
                         humanWatchConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                       }`}>
                         <div className={`w-2 h-2 rounded-full ${
                           humanWatchConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                         }`}></div>
                         <span>{humanWatchConnected ? 'Connected' : 'Disconnected'}</span>
                       </div>
                     </div>
                     {!humanWatchConnected ? (
                       <div className="space-y-3">
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Device Number / ID</label>
                           <input type="text" value={humanWatchDevice} onChange={(e) => setHumanWatchDevice(e.target.value)} placeholder="e.g. HW-2024-XXXX or Serial No." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                         </div>
                         <button onClick={handleHumanWatchConnect} disabled={humanWatchConnecting || !humanWatchDevice} className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${humanWatchConnecting || !humanWatchDevice ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'}`}>
                           {humanWatchConnecting ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Connecting...</span></>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg><span>Connect Watch</span></>)}
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <div className="bg-white rounded-lg p-3 border border-green-200 space-y-1">
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Device ID</span><span className="font-semibold text-gray-800">{humanWatchDevice}</span></div>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="text-green-600 font-semibold">● Live Syncing</span></div>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">HRV Tracking</span><span className="text-green-600 font-semibold">Active</span></div>
                         </div>
                         <button onClick={handleHumanWatchDisconnect} className="w-full py-2.5 rounded-lg font-semibold text-sm text-red-600 border-2 border-red-300 hover:bg-red-50 transition-all duration-300">Disconnect</button>
                       </div>
                     )}
                   </div>
                   */}

                   {/* CHANGE 3 — Add FitBark card (replaces PetPace spot) */}
                   <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${
                     fitbarkConnected ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'
                   }`}>
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                           fitbarkConnected ? 'bg-orange-500' : 'bg-gray-300'
                         }`}>
                           <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="font-semibold text-gray-900">FitBark</h3>
                           <p className="text-xs text-gray-500">Dog Activity & GPS Collar</p>
                         </div>
                       </div>
                       <div className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full ${
                         fitbarkConnected ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'
                       }`}>
                         <div className={`w-2 h-2 rounded-full ${
                           fitbarkConnected ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
                         }`}></div>
                         <span>{fitbarkConnected ? 'Connected' : 'Disconnected'}</span>
                       </div>
                     </div>
                     {!fitbarkConnected ? (
                       <div className="space-y-3">
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">FitBark Account Email</label>
                           <input 
                             type="email" 
                             value={fitbarkEmail} 
                             onChange={(e) => setFitbarkEmail(e.target.value)} 
                             placeholder="Enter your FitBark account email" 
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" 
                           />
                         </div>
                         <button 
                           onClick={handleFitbarkConnect} 
                           disabled={fitbarkConnecting || !fitbarkEmail} 
                           className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                             fitbarkConnecting || !fitbarkEmail 
                               ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                               : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                           }`}
                         >
                           {fitbarkConnecting ? (
                             <>
                               <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                               </svg>
                               <span>Connecting...</span>
                             </>
                           ) : (
                             <>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                               </svg>
                               <span>Connect FitBark</span>
                             </>
                           )}
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <div className="bg-white rounded-lg p-3 border border-orange-200 space-y-1">
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Account</span>
                             <span className="font-semibold text-gray-800">{fitbarkEmail}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Status</span>
                             <span className="text-green-600 font-semibold">● Live Monitoring</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Data Types</span>
                             <span className="text-orange-600 font-semibold">Activity, Sleep, GPS</span>
                           </div>
                         </div>
                         <button 
                           onClick={handleFitbarkDisconnect} 
                           className="w-full py-2.5 rounded-lg font-semibold text-sm text-red-600 border-2 border-red-300 hover:bg-red-50 transition-all duration-300"
                         >
                           Disconnect
                         </button>
                       </div>
                     )}
                   </div>

                   {/* Fitbit Card */}
                   <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${
                     fitbitConnected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                   }`}>
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                           fitbitConnected ? 'bg-green-500' : 'bg-gray-300'
                         }`}>
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="font-semibold text-gray-900">Fitbit</h3>
                           <p className="text-xs text-gray-500">Fitness Tracker</p>
                         </div>
                       </div>
                       <div className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full ${
                         fitbitConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                       }`}>
                         <div className={`w-2 h-2 rounded-full ${
                           fitbitConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                         }`}></div>
                         <span>{fitbitConnected ? 'Connected' : 'Disconnected'}</span>
                       </div>
                     </div>
                     {!fitbitConnected ? (
                       <div className="space-y-3">
                         <p className="text-sm text-gray-600 mb-4">
                           Connect your Fitbit to sync heart rate, steps, sleep, and activity data automatically.
                         </p>
                         <button 
                           onClick={handleFitbitConnect} 
                           disabled={fitbitConnecting} 
                           className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                             fitbitConnecting 
                               ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                               : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                           }`}
                         >
                           {fitbitConnecting ? (
                             <>
                               <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                               </svg>
                               <span>Connecting...</span>
                             </>
                           ) : (
                             <>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                               </svg>
                               <span>Connect Fitbit</span>
                             </>
                           )}
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <div className="bg-white rounded-lg p-3 border border-green-200 space-y-1">
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Fitbit ID</span>
                             <span className="font-semibold text-gray-800">{fitbitUserId}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Status</span>
                             <span className="text-green-600 font-semibold">● Syncing Data</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Data Types</span>
                             <span className="text-green-600 font-semibold">Heart Rate, Steps, Sleep</span>
                           </div>
                         </div>
                         <button 
                           onClick={handleFitbitDisconnect} 
                           className="w-full py-2.5 rounded-lg font-semibold text-sm text-red-600 border-2 border-red-300 hover:bg-red-50 transition-all duration-300"
                         >
                           Disconnect
                         </button>
                       </div>
                     )}
                   </div>

                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                {/* Membership Status Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Membership Status</h2>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{membershipLabel}</h3>
                        <p className="text-gray-600 mb-2">{membershipDescription}</p>
                        <p className="text-sm text-gray-500">{memberSinceText}</p>
                      </div>
                      {membershipTier === 'free' ? (
                        <button
                          onClick={handleUpgradeClick}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>Upgrade Now</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/subscription')}
                          className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                        >
                          Manage Plan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                {/* Notification Preferences Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 7l-6 6-6-6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  </div>

                  {/* Notification Categories */}
                  <div className="space-y-6">
                    {/* Ritual Reminders */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Ritual Reminders</h3>
                        <p className="text-sm text-gray-600">Daily reminders for your chakra practices</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('ritualReminders')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notificationSettings.ritualReminders ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.ritualReminders ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Community Updates */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Community Updates</h3>
                        <p className="text-sm text-gray-600">New healing circles and community posts</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('communityUpdates')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notificationSettings.communityUpdates ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.communityUpdates ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Weekly Digest */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Weekly Digest</h3>
                        <p className="text-sm text-gray-600">Summary of your progress and insights</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('weeklyDigest')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notificationSettings.weeklyDigest ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Premium Offers */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Premium Offers</h3>
                        <p className="text-sm text-gray-600">Special discounts and premium features</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('premiumOffers')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notificationSettings.premiumOffers ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.premiumOffers ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                {/* Privacy & Data Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-6">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Privacy & Data</h2>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    {/* Export My Data */}
                    <button
                      onClick={handleExportMyData}
                      className="w-full flex items-center justify-between py-4 px-4 mb-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-gray-900 font-medium">Export My Data</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </button>

                    {/* Privacy Settings */}
                    <button
                      onClick={handlePrivacySettings}
                      className="w-full flex items-center justify-between py-4 px-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-900 font-medium">Privacy Settings</span>
                      </div>
                    </button>

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-red-600 font-semibold mb-3 text-sm">Danger Zone</h3>
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center space-x-3 py-4 px-4 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="font-medium">Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Usage Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Usage</h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    We use your data to personalize your spiritual journey and improve our services.
                    Your journal entries and personal information are encrypted and never shared.
                  </p>
                  <div className="flex space-x-6">
                    <button onClick={handlePrivacy} className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                      Privacy Policy &  Terms of Service
                    </button>

                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Journey Statistics Section - Only show on Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Journey Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{journeyStats.bondedScore}</div>
                  <div className="text-sm text-gray-600">Current Bonded Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{journeyStats.ritualsCompleted}</div>
                  <div className="text-sm text-gray-600">Rituals Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{journeyStats.journalEntries}</div>
                  <div className="text-sm text-gray-600">Journal Entries</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FitBark Code Modal */}
      {showFitbarkCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseFitbarkCodeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Enter FitBark Code</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Copy the authorization code from the FitBark window and paste it here.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFitbarkCodeModal}
                className="rounded-lg bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">Authorization Code</label>
              <input
                type="text"
                autoFocus
                value={fitbarkAuthCode}
                onChange={(e) => setFitbarkAuthCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !fitbarkCodeSubmitting) {
                    handleSubmitFitbarkCode();
                  }
                }}
                placeholder="Paste FitBark code"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseFitbarkCodeModal}
                disabled={fitbarkCodeSubmitting}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitFitbarkCode}
                disabled={fitbarkCodeSubmitting}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fitbarkCodeSubmitting ? 'Connecting...' : 'Submit Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleClosePremiumModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl p-6 lg:p-8 relative animate-slideUp max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClosePremiumModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-orange-500">Upgrade to Premium</h2>
              </div>
              <p className="text-gray-600 text-lg">Unlock the full potential of your spiritual journey with your dog</p>
            </div>

            {/* Plan Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-full p-1 flex relative">
                <button
                  onClick={() => setIsYearlyPlan(false)}
                  className={`px-8 py-3 rounded-full font-medium transition-all duration-300 text-lg ${!isYearlyPlan ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearlyPlan(true)}
                  className={`px-8 py-3 rounded-full font-medium transition-all duration-300 relative text-lg ${isYearlyPlan ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'
                    }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-sm px-2 py-1 rounded-full">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Plan */}
              <div className={`border-2 rounded-xl p-6 ${!isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Monthly Plan</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$19.99<span className="text-xl font-normal">/month</span></div>
                <p className="text-base text-gray-600">Billed monthly, cancel anytime</p>
              </div>

              {/* Yearly Plan */}
              <div className={`border-2 rounded-xl p-6 relative ${isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                {isYearlyPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Yearly Plan</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$199.99<span className="text-xl font-normal">/year</span></div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl text-gray-500 line-through">$239.00</span>
                  <span className="text-base text-green-600 font-medium">Save $30.00</span>
                </div>
                <p className="text-base text-gray-600">Billed yearly, cancel anytime</p>
              </div>
            </div>

            {/* Premium Features */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Premium Features</h3>
              <div className="space-y-4">
                {/* Feature 1 */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Unlimited Chakra Rituals</h4>
                    <p className="text-base text-gray-600">Access to all 7 chakra alignment practices and advanced guided meditations</p>
                  </div>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Exclusive Healing Circles</h4>
                    <p className="text-base text-gray-600">Monthly premium group sessions and workshops with expert facilitators</p>
                  </div>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Advanced Aura Tracking</h4>
                    <p className="text-base text-gray-600">Deep energy field analysis and detailed bonded score insights</p>
                  </div>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Legacy Export & Archive</h4>
                    <p className="text-base text-gray-600">Download your complete journal as a beautiful PDF and backup all memories</p>
                  </div>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto">
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
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Advanced Aura Tracking */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-500 border-2 border-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

export default ProfileSettingsPage;