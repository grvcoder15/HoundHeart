import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState({});
  const [formData, setFormData] = useState({
    yourName: '',
    age: '',
    dogName: '',
    breed: '',
    dogAge: '',
    weight: '',
    selectedTraits: [],
    selectedTraitsStep4: [],
    bondedScore: 50,
    energySync: 75,
    userPhoto: null,
    dogPhoto: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTraits, setUserTraits] = useState([]);
  const [dogTraits, setDogTraits] = useState([]);
  const [isLoadingUserTraits, setIsLoadingUserTraits] = useState(false);
  const [isLoadingDogTraits, setIsLoadingDogTraits] = useState(false);
  const [dogId, setDogId] = useState(null);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);

  // Debug log for formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);


  // Debug log for traits changes
  useEffect(() => {
    console.log('🔄 User traits updated:', userTraits);
  }, [userTraits]);

  useEffect(() => {
    console.log('🔄 Dog traits updated:', dogTraits);
  }, [dogTraits]);


  // Fetch user traits from API
  const fetchUserTraits = async () => {
    try {
      console.log('🔄 Starting to fetch user traits...');
      setIsLoadingUserTraits(true);
      const response = await apiService.getAllUserTraits();
      console.log('✅ User Traits API Response:', response);

      if (response && response.data) {
        console.log('📊 Setting user traits from response.data:', response.data);
        setUserTraits(response.data);
      } else if (response && Array.isArray(response)) {
        console.log('📊 Setting user traits from direct response:', response);
        setUserTraits(response);
      } else {
        console.log('⚠️ No valid user traits data found in response');
        setUserTraits([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user traits:', error);
      setUserTraits([]);
    } finally {
      setIsLoadingUserTraits(false);
      console.log('🏁 Finished fetching user traits');
    }
  };

  // Fetch dog traits from API
  const fetchDogTraits = async () => {
    try {
      console.log('🔄 Starting to fetch dog traits...');
      setIsLoadingDogTraits(true);
      const response = await apiService.getAllDogTraits();
      console.log('✅ Dog Traits API Response:', response);

      if (response && response.data) {
        console.log('📊 Setting dog traits from response.data:', response.data);
        setDogTraits(response.data);
      } else if (response && Array.isArray(response)) {
        console.log('📊 Setting dog traits from direct response:', response);
        setDogTraits(response);
      } else {
        console.log('⚠️ No valid dog traits data found in response');
        setDogTraits([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch dog traits:', error);
      setDogTraits([]);
    } finally {
      setIsLoadingDogTraits(false);
      console.log('🏁 Finished fetching dog traits');
    }
  };

  // Check if profile setup is complete based on API response
  const checkProfileCompletion = (profileData) => {
    console.log('Checking profile completion for:', profileData);

    // Check if all required fields have valid values
    const hasProfilePhoto = profileData.profilePhoto && profileData.profilePhoto.trim() !== '';
    const hasProfileName = profileData.profileName && profileData.profileName.trim() !== '';
    const hasDog = profileData.dog && profileData.dog.dogName && profileData.dog.dogName.trim() !== '';
    const hasUserTraits = profileData.userSelectedTraits && profileData.userSelectedTraits.length > 0;
    const hasDogTraits = profileData.dogSelectedTraits && profileData.dogSelectedTraits.length > 0;

    const isComplete = hasProfilePhoto && hasProfileName && hasDog && hasUserTraits && hasDogTraits;

    console.log('Profile completion check:', {
      hasProfilePhoto,
      hasProfileName,
      hasDog,
      hasUserTraits,
      hasDogTraits,
      isComplete,
      profilePhoto: profileData.profilePhoto,
      profileName: profileData.profileName,
      dog: profileData.dog,
      userTraitsCount: profileData.userSelectedTraits?.length || 0,
      dogTraitsCount: profileData.dogSelectedTraits?.length || 0
    });

    return isComplete;
  };

  // Initialize component - fetch traits only
  useEffect(() => {
    console.log('ProfileSetupPage mounted - fetching traits');

    // Fetch traits for the form
    fetchUserTraits();
    fetchDogTraits();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTraitToggle = (trait) => {
    setFormData(prev => {
      const isSelected = prev.selectedTraits.includes(trait);

      if (isSelected) {
        // Allow deselecting
        return {
          ...prev,
          selectedTraits: prev.selectedTraits.filter(t => t !== trait)
        };
      } else {
        // Check if we can select more (max 6)
        if (prev.selectedTraits.length >= 6) {
          toastService.warning('You can select maximum 6 traits. Please deselect some traits first.');
          return prev; // Don't allow selection if already at max
        }
        return {
          ...prev,
          selectedTraits: [...prev.selectedTraits, trait]
        };
      }
    });
  };

  const handleTraitToggleStep4 = (trait) => {
    setFormData(prev => {
      const isSelected = prev.selectedTraitsStep4.includes(trait);

      if (isSelected) {
        // Allow deselecting
        return {
          ...prev,
          selectedTraitsStep4: prev.selectedTraitsStep4.filter(t => t !== trait)
        };
      } else {
        // Check if we can select more (max 6)
        if (prev.selectedTraitsStep4.length >= 6) {
          toastService.warning('You can select maximum 6 traits. Please deselect some traits first.');
          return prev; // Don't allow selection if already at max
        }
        return {
          ...prev,
          selectedTraitsStep4: [...prev.selectedTraitsStep4, trait]
        };
      }
    });
  };

  const handlePhotoUpload = (photoType, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          [photoType]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoUpload = (photoType) => {
    const input = document.getElementById(`${photoType}-input`);
    if (input) {
      input.click();
    }
  };

  const handleNext = async () => {
    // Step 1 validation (frontend gate before API call)
    if (currentStep === 1) {
      const name = formData.yourName.trim();
      const ageValue = Number(formData.age);

      if (!name) {
        setError('Please enter your name.');
        toastService.warning('Please enter your name.');
        return;
      }

      if (!formData.age || Number.isNaN(ageValue) || ageValue <= 0 || ageValue > 120) {
        setError('Please enter a valid age between 1 and 120.');
        toastService.warning('Please enter a valid age between 1 and 120.');
        return;
      }
    }

    // Step 2 validation (frontend gate before API call)
    if (currentStep === 2) {
      const dogName = formData.dogName.trim();
      const breed = formData.breed.trim();
      const dogAgeValue = Number(formData.dogAge);

      if (!dogName) {
        setError("Please enter your dog's name.");
        toastService.warning("Please enter your dog's name.");
        return;
      }

      if (!breed) {
        setError('Please enter your dog\'s breed.');
        toastService.warning('Please enter your dog\'s breed.');
        return;
      }

      if (formData.dogAge === '' || Number.isNaN(dogAgeValue) || dogAgeValue < 0 || dogAgeValue > 20) {
        setError('Please enter a valid dog age between 0 and 20.');
        toastService.warning('Please enter a valid dog age between 0 and 20.');
        return;
      }
    }

    // Step 1: User Profile - call add-userprofile API
    if (currentStep === 1 && formData.yourName.trim()) {
      setError('');
      setIsLoading(true);

      try {
        // Call your .NET 8 API to add user profile
        await apiService.updateUserProfile({
          profileName: formData.yourName,
          age: formData.age,
          profilePhotoUrl: formData.userPhoto
        });

        console.log('User profile added successfully');
      } catch (error) {
        console.error('User profile error:', error);
        setError(error.message || 'User profile failed. Please try again.');
        setIsLoading(false);
        return; // Don't proceed to next step if API call fails
      } finally {
        setIsLoading(false);
      }
    }

    // Step 2: Dog Profile - call add-dogprofile API
    if (currentStep === 2 && formData.dogName.trim()) {
      setError('');
      setIsLoading(true);

      try {
        // Call your .NET 8 API to add dog profile
        const response = await apiService.addDogProfile({
          dogName: formData.dogName,
          breed: formData.breed,
          age: formData.dogAge,
          weight: formData.weight,
          dogPhotoUrl: formData.dogPhoto
        });

        console.log('Dog profile added successfully:', response);

        // Store dog ID from response and persist it
        if (response && response.data && response.data.dogId) {
          const newDogId = response.data.dogId;
          setDogId(newDogId);
          localStorage.setItem('dogId', newDogId);
        } else if (response && response.dogId) {
          const newDogId = response.dogId;
          setDogId(newDogId);
          localStorage.setItem('dogId', newDogId);
        }
      } catch (error) {
        console.error('Dog profile error:', error);
        setError(error.message || 'Dog profile failed. Please try again.');
        setIsLoading(false);
        return; // Don't proceed to next step if API call fails
      } finally {
        setIsLoading(false);
      }
    }

    // Step 3: User traits validation only
    if (currentStep === 3) {
      if (formData.selectedTraits.length < 3) {
        toastService.warning('Please select at least 3 spiritual traits for yourself.');
        return;
      }
      if (formData.selectedTraits.length > 6) {
        toastService.warning('Please select maximum 6 spiritual traits for yourself.');
        return;
      }
    }

    // Step 4: Dog traits validation only
    if (currentStep === 4) {
      if (formData.selectedTraitsStep4.length < 3) {
        toastService.warning('Please select at least 3 spiritual traits for your dog.');
        return;
      }
      if (formData.selectedTraitsStep4.length > 6) {
        toastService.warning('Please select maximum 6 spiritual traits for your dog.');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/signup');
    }
  };

  const handleCompleteSetup = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.yourName.trim()) {
        setError('Please enter your name');
        return;
      }

      // Validate traits
      if (formData.selectedTraits.length < 3) {
        setError('Please select at least 3 spiritual traits for yourself.');
        return;
      }
      if (formData.selectedTraitsStep4.length < 3) {
        setError('Please select at least 3 spiritual traits for your dog.');
        return;
      }

      // Convert trait names to trait IDs
      const userTraitIds = formData.selectedTraits.map(traitName => {
        const trait = userTraits.find(t => (t.traitName || t.name) === traitName);
        return trait?.traitId || trait?.id;
      }).filter(id => id); // Remove undefined values

      const dogTraitIds = formData.selectedTraitsStep4.map(traitName => {
        const trait = dogTraits.find(t => (t.traitName || t.name) === traitName);
        return trait?.traitId || trait?.id;
      }).filter(id => id); // Remove undefined values

      // Save user traits
      await apiService.saveUserTraits(userTraitIds);
      console.log('User traits saved successfully');

      // Save dog traits
      const effectiveDogId = dogId || localStorage.getItem('dogId');
      if (effectiveDogId) {
        await apiService.saveDogTraits(effectiveDogId, dogTraitIds);
        console.log('Dog traits saved successfully');
      } else {
        console.warn('Dog ID not found, skipping dog traits save');
      }

      console.log('Profile setup completed:', formData);
      toastService.success('Profile setup completed successfully!');

      // Ensure auth state exists so Dashboard doesn't redirect back to '/'
      try {
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = apiService.getCurrentUserId() || existingUser.userId || localStorage.getItem('userId') || null;
        const email = existingUser.email || '';
        const fullName = existingUser.fullName || existingUser.profileName || formData.yourName || existingUser.name || 'User';
        if (userId) {
          localStorage.setItem('user', JSON.stringify({ 
            ...existingUser, 
            userId, 
            email, 
            fullName,
            age: formData.age
          }));
        }
        localStorage.setItem('isAuthenticated', 'true');
      } catch (_) { }

      // Refresh profile and compute bonded score before entering dashboard
      try {
        const profileResponse = await apiService.getUserProfile();
        const profileData = profileResponse?.data || profileResponse || {};

        // Persist key profile fields for Navbar/Dashboard
        try {
          if (profileData?.userId) localStorage.setItem('userId', profileData.userId);
          if (profileData?.profilePhoto) localStorage.setItem('UserprofilPhotoUrl', profileData.profilePhoto);
          if (profileData?.dog?.profilePhoto) localStorage.setItem('DogprofilPhotoUrl', profileData.dog.profilePhoto);
          if (profileData?.dog?.dogName) localStorage.setItem('dogName', profileData.dog.dogName);
          const entryCount = profileData?.journalEntryCount ?? profileData?.JournalEntryCount;
          if (typeof entryCount === 'number') {
            localStorage.setItem('journalEntryCount', String(entryCount));
          }

          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...existingUser,
            userId: profileData.userId || existingUser.userId,
            email: profileData.email || existingUser.email,
            fullName: profileData.fullName || profileData.profileName || existingUser.fullName || 'User'
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch { }

        // Calculate bonded score if both IDs are available
        try {
          const uid = profileData?.userId || localStorage.getItem('userId');
          const did = profileData?.dog?.dogId || profileData?.dogId;
          console.log('📊 Calculating bonded score with userId:', uid, 'dogId:', did);
          if (uid && did) {
            localStorage.setItem('dogId', did);
            const bondedScoreResponse = await apiService.calculateBondedScore(uid, did);
            console.log('📊 Bonded score response:', bondedScoreResponse);
            const bondedScore = bondedScoreResponse?.data?.bondedScore || bondedScoreResponse?.data?.BondedScore || 0;
            console.log('📊 Final bonded score value:', bondedScore);
            localStorage.setItem('bondedScore', String(Math.round(bondedScore)));
            console.log('✅ Bonded score stored in localStorage:', Math.round(bondedScore));
          } else {
            console.warn('⚠️ Missing userId or dogId - cannot calculate bonded score');
          }
        } catch (error) {
          console.error('❌ Error calculating bonded score:', error);
        }
      } catch (_) { }

      // Navigate to dashboard 
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Profile setup error:', error);
      setError(error.message || 'Profile setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 4) * 100;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Welcome to HoundHeart™";
      case 2: return "Tell Us About Your Dog";
      case 3: return `${formData.yourName || 'Your'}'s Spiritual Traits`;
      case 4: return `${formData.dogName || 'Your Dog'}'s Spiritual Traits`;
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Let's set up your profile to begin your spiritual journey";
      case 2: return "Your canine companion is the heart of this journey";
      case 3: return `Choose the spiritual qualities that best describe you. Select 3-5 traits that capture your essence.`;
      case 4: return `Choose the spiritual qualities that best describe ${formData.dogName || 'your dog'}. Select 3-5 traits that capture their essence.`;
      default: return "";
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                name="yourName"
                value={formData.yourName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            {/* User Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age (Years)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="1"
                max="120"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo (Optional)</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.userPhoto ? (
                    <img
                      src={formData.userPhoto}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {formData.yourName ? formData.yourName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => triggerPhotoUpload('userPhoto')}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{formData.userPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Tap to take a photo or select from gallery</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Dog's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dog's Name</label>
              <input
                type="text"
                name="dogName"
                value={formData.dogName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Dog Details (Age, Breed, Weight) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="e.g. Golden Retriever"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  name="dogAge"
                  value={formData.dogAge}
                  onChange={handleInputChange}
                  placeholder="Years"
                  min="0"
                  max="20"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Kilograms"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Dog's Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dog's Photo (Optional)</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.dogPhoto ? (
                    <img
                      src={formData.dogPhoto}
                      alt="Dog"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white text-2xl">❤️</span>
                  )}
                </div>
                <button
                  onClick={() => triggerPhotoUpload('dogPhoto')}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{formData.dogPhoto ? 'Change Photo' : 'Add Photo'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Tap to take a photo or select from gallery</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Traits Grid */}
            <div className="grid grid-cols-3 gap-4">
              {isLoadingUserTraits ? (
                <div className="col-span-3 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading user traits...</p>
                </div>
              ) : (
                userTraits.map((trait, index) => (
                  <button
                    key={trait.traitName || trait.name}
                    onClick={() => handleTraitToggle(trait.traitName || trait.name)}
                    className={`p-4 rounded-lg border transition-all duration-300 text-left ${formData.selectedTraits.includes(trait.traitName || trait.name)
                      ? 'border-orange-500 bg-orange-50'
                      : formData.selectedTraits.length >= 6
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{trait.traitName || trait.name}</div>
                    <div className="text-sm text-gray-600">{trait.description || trait.traitDescription}</div>
                  </button>
                ))
              )}
            </div>

            {/* Selection Counter */}
            <div className="text-center">
              <p className="text-gray-900 font-medium">
                Selected: {formData.selectedTraits.length} traits
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formData.selectedTraits.length < 3
                  ? `Select at least ${3 - formData.selectedTraits.length} more traits to continue`
                  : formData.selectedTraits.length >= 6
                    ? "Maximum traits selected"
                    : "Ideal amount selected (3-6 traits)"}
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Traits Grid */}
            <div className="grid grid-cols-3 gap-4">
              {isLoadingDogTraits ? (
                <div className="col-span-3 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading dog traits...</p>
                </div>
              ) : (
                dogTraits.map((trait, index) => (
                  <button
                    key={trait.traitName || trait.name}
                    onClick={() => handleTraitToggleStep4(trait.traitName || trait.name)}
                    className={`p-4 rounded-lg border transition-all duration-300 text-left ${formData.selectedTraitsStep4.includes(trait.traitName || trait.name)
                      ? 'border-orange-500 bg-orange-50'
                      : formData.selectedTraitsStep4.length >= 6
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{trait.traitName || trait.name}</div>
                    <div className="text-sm text-gray-600">{trait.description || trait.traitDescription}</div>
                  </button>
                ))
              )}
            </div>

            {/* Selection Counter */}
            <div className="text-center">
              <p className="text-gray-900 font-medium">
                Selected: {formData.selectedTraitsStep4.length} traits
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formData.selectedTraitsStep4.length < 3
                  ? `Select at least ${3 - formData.selectedTraitsStep4.length} more traits for your dog`
                  : formData.selectedTraitsStep4.length >= 6
                    ? "Maximum traits selected"
                    : "Ideal amount selected (3-6 traits)"}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  console.log('Rendering ProfileSetupPage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-pink-300 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main Card */}
      <div
        id="profile-card"
        data-animate
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 relative z-10 transition-all duration-1000 ${isVisible['profile-card'] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
      >
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 font-medium">Step {currentStep} of 4</span>
            <span className="text-gray-700 font-medium">{getProgressPercentage()}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            id="error-message"
            data-animate
            className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm transition-all duration-1000 delay-300 ${isVisible['error-message'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            {error}
          </div>
        )}

        {/* Header */}
        <div className="relative mb-8">
          {/* Cancel Button - Top Right */}
          <button
            onClick={handleBack}
            className="absolute top-0 right-0 text-gray-600 hover:text-gray-800 transition-colors duration-200 text-base font-semibold px-3 py-1 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>

          <div className="text-center">
            {/* Orange Icon with Star */}
            {(currentStep === 3 || currentStep === 4) && (
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            )}
            <h1
              id="step-title"
              data-animate
              className={`text-3xl font-bold text-gray-900 mb-4 transition-all duration-1000 delay-200 ${isVisible['step-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              {getStepTitle()}
            </h1>
            <p
              id="step-subtitle"
              data-animate
              className={`text-gray-600 transition-all duration-1000 delay-400 ${isVisible['step-subtitle'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
              {getStepSubtitle()}
            </p>
          </div>
        </div>

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

        {/* Step Content */}
        <div
          id="step-content"
          data-animate
          className={`mb-8 transition-all duration-1000 delay-600 ${isVisible['step-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div
          id="navigation-buttons"
          data-animate
          className={`flex justify-between items-center transition-all duration-1000 delay-800 ${isVisible['navigation-buttons'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center">
            {currentStep === 4 ? (
              <button
                onClick={handleCompleteSetup}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Journey</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            ) : currentStep === 3 ? (
              <button
                onClick={handleNext}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
              >
                <span>Continue</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
