import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const AskExpertPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companionName: '',
    priority: 'Normal',
    category: '',
    subject: '',
    question: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);
  const [userQuestions, setUserQuestions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [membershipTier, setMembershipTier] = useState('free');
  const [showCompactUpgradeModal, setShowCompactUpgradeModal] = useState(false);
  const [askExpertTrialUsed, setAskExpertTrialUsed] = useState(0);

  const normalizeTier = (tier) => {
    const normalized = String(tier || 'free').toLowerCase().trim();
    return normalized === 'plus' || normalized === 'premium' ? normalized : 'free';
  };

  const getTierFromPlanName = (planName) => {
    const normalizedPlan = String(planName || '').toLowerCase();
    if (normalizedPlan.includes('premium')) return 'premium';
    if (normalizedPlan.includes('plus')) return 'plus';
    return 'free';
  };

  const hasActivePremiumSubscription = (subscription) => {
    if (!subscription) return false;

    const status = (subscription.status || subscription.Status || '').toString().toLowerCase();
    const periodEnd = subscription.currentPeriodEnd || subscription.CurrentPeriodEnd;
    const now = new Date();
    const endDate = periodEnd ? new Date(periodEnd) : null;

    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(status) && (!endDate || endDate >= now);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'priority' && value === 'High Priority') {
       const user = JSON.parse(localStorage.getItem('user') || '{}');
       const rolePremium = user.roleId === 2 || user.RoleId === 2;
       if (!(hasPremiumAccess || rolePremium)) {
          setShowPricingModal(true);
          return;
       }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    } else if (formData.question.trim().length < 50) {
      newErrors.question = 'Question must be at least 50 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toastService.error('Please log in to submit a question.');
      navigate('/login');
      return;
    }

    // Check free trial limit: allow 1-2 free questions, then show upgrade popup
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tierLevel = (user.tierLevel || 'free').toLowerCase().trim();
    
    if (tierLevel === 'free' && askExpertTrialUsed >= 2) {
      setShowCompactUpgradeModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare question data
      const questionData = {
        userId: userId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        companionName: formData.companionName.trim() || null,
        priority: formData.priority,
        category: formData.category,
        subject: formData.subject.trim(),
        questionText: formData.question.trim()
      };

      // Call API
      const response = await apiService.submitExpertQuestion(questionData);

      // Check if response indicates success (api throws if 4xx/5xx)
      if (response && !response.error) {
        toastService.success(response.message || response.Message || 'Your question has been submitted successfully! Our experts will respond within the specified timeframe.');

        // Increment trial counter for free users
        if (tierLevel === 'free') {
          const newCount = askExpertTrialUsed + 1;
          setAskExpertTrialUsed(newCount);
          localStorage.setItem('askExpertTrialUsed', newCount.toString());
        }

        // Refresh history
        fetchQuestionHistory();

        // Reset form
        setFormData({
          name: '',
          email: '',
          companionName: '',
          priority: 'Normal',
          category: '',
          subject: '',
          question: ''
        });
        setErrors({});
      } else {
        // Handle error response from API
        const errorMessage = response?.error || response?.message || response?.Message || 'There was an error submitting your question. Please try again.';
        toastService.error(errorMessage);
      }

    } catch (error) {
      console.error('Error submitting question:', error);
      const errorMessage = error?.message || 'There was an error submitting your question. Please try again.';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch question history
  const fetchQuestionHistory = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      setIsLoadingHistory(true);
      const questions = await apiService.getUserExpertQuestions(userId);
      setUserQuestions(questions || []);
    } catch (error) {
      console.error('Error fetching question history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history and auto-fill profile on mount
  React.useEffect(() => {
    // Load free trial count from localStorage
    const savedCount = localStorage.getItem('askExpertTrialUsed');
    if (savedCount) {
      setAskExpertTrialUsed(parseInt(savedCount, 10));
    }

    fetchQuestionHistory();
    
    // Auto-fill user details
    const loadProfileData = async () => {
      try {
        // First try local storage for instant feedback
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const localDogName = localStorage.getItem('dogName') || '';
          
          setFormData(prev => ({
            ...prev,
            name: prev.name || userObj.fullName || userObj.name || '',
            email: prev.email || userObj.email || '',
            companionName: prev.companionName || localDogName || ''
          }));
        }

        // Then fetch latest from API
        const profileResponse = await apiService.getUserProfile();
        if (profileResponse?.data) {
           const profile = profileResponse.data;
           setFormData(prev => ({
             ...prev,
             name: prev.name || profile.ProfileName || profile.FullName || '',
             email: prev.email || profile.Email || '',
             companionName: prev.companionName || profile.Dog?.DogName || ''
           }));
        }
      } catch (error) {
        console.error("Error auto-filling profile data:", error);
      }
    };

    const loadDynamicData = async () => {
      try {
        const [cats, plans, settings, currentSubResponse] = await Promise.all([
          apiService.getExpertQueryCategories(),
          apiService.getSubscriptionPlans(),
          apiService.getAskExpertSettings(),
          apiService.makeRequest('/Subscription/current', { method: 'GET' })
        ]);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const rolePremium = user.roleId === 2 || user.RoleId === 2;
        const tierFromUser = normalizeTier(user.tierLevel);
        const subData = currentSubResponse && currentSubResponse.hasOwnProperty('data')
          ? currentSubResponse.data
          : currentSubResponse;

        const tierFromPlan = hasActivePremiumSubscription(subData)
          ? getTierFromPlanName(subData?.planName || subData?.PlanName)
          : 'free';

        let resolvedTier = tierFromUser;
        if (tierFromPlan === 'premium' || (tierFromPlan === 'plus' && resolvedTier === 'free')) {
          resolvedTier = tierFromPlan;
        }
        if (resolvedTier === 'free' && rolePremium) {
          resolvedTier = 'premium';
        }

        setCurrentSubscription(subData || null);
        setHasPremiumAccess(rolePremium || hasActivePremiumSubscription(subData));
        setMembershipTier(resolvedTier);

        if (cats && cats.length > 0) {
          setDbCategories(cats);
        }
        if (plans && plans.length > 0) {
          setSubscriptionPlans(plans);
        }
        if (settings) {
          setSiteSettings(settings);
        }
      } catch (error) {
        console.error("Error loading dynamic data:", error);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const rolePremium = user.roleId === 2 || user.RoleId === 2;
        setHasPremiumAccess(rolePremium);
        setMembershipTier(rolePremium ? 'premium' : normalizeTier(user.tierLevel));
      }
    };

    loadProfileData();
    loadDynamicData();
  }, []);

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  const handlePlanToggle = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  // Find dynamic plans or fallback to defaults
  const monthlyPlan = subscriptionPlans.find(p => p.billingPeriod?.toLowerCase() === 'monthly' || p.BillingPeriod?.toLowerCase() === 'monthly') || { price: 19.99, Price: 19.99, name: 'Monthly Plan', Name: 'Monthly Plan' };
  const yearlyPlan = subscriptionPlans.find(p => p.billingPeriod?.toLowerCase() === 'yearly' || p.BillingPeriod?.toLowerCase() === 'yearly') || { price: 199.99, Price: 199.99, name: 'Yearly Plan', Name: 'Yearly Plan' };


  const defaultCategories = [
    'Spiritual Bonding & Connection',
    'Energy Syncing & Chakra Alignment',
    'Meditation & Mindfulness',
    'Wellness & Lifestyle Guidance',
    'Behavioral & Emotional Support',
    'Daily Rituals & Practices',
    'Legacy Planning & Memories',
    'Other Spiritual Concerns'
  ];

  const displayCategories = dbCategories.length > 0 ? dbCategories.map(c => c.name || c.Name) : defaultCategories;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Navbar currentPage="ask-expert" onUpgrade={handleUpgrade} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-purple-600 mb-4">Ask Our Expert</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized spiritual wellness guidance for you and your companion
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-center space-x-2 mb-6">
                <h2 className="text-2xl font-bold text-purple-600">Share Your Spiritual Journey</h2>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2 2m0 0l2 2m-2-2l-2 2m2-2v4m-4 0h4m5-16l2 2m0 0l2 2m-2-2l-2 2m2-2v4m-4 0h4" />
                </svg>
              </div>

              <p className="text-gray-600 mb-8">
                Our certified spiritual wellness experts are here to guide you and your beloved companion on your journey together.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Companion Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Companion's Name</label>
                  <input
                    type="text"
                    name="companionName"
                    value={formData.companionName}
                    onChange={handleInputChange}
                    placeholder="Your dog's name (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Normal">Normal - Standard inquiry (24-48 hours)</option>
                    <option value="High Priority">High Priority - Urgent inquiry (12-24 hours)</option>
                  </select>
                </div>

                {/* Query Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Query Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select a category</option>
                    {displayCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your question"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                </div>

                {/* Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Please describe your spiritual wellness question or concern in detail. The more context you provide, the better our experts can assist you and your companion. Minimum 50 characters. Include details about your current situation, what you've tried, and what specific guidance you're seeking."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${errors.question ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.question && <p className="text-red-500 text-sm">{errors.question}</p>}
                    <p className="text-sm text-gray-500 ml-auto">
                      {formData.question.length}/50+ characters
                    </p>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      Our experts provide spiritual wellness and lifestyle guidance only. For medical concerns, consult qualified veterinary or medical professionals.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Question to Expert</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Information Panels */}
          <div className="space-y-6">
            {/* Response Time Panel */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Normal</span>
                    <span className="text-sm text-green-600">{siteSettings.AskExpert_NormalResponseTime || '24-48 hours'}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-800">High Priority</span>
                    <span className="text-sm text-yellow-600">{siteSettings.AskExpert_HighPriorityResponseTime || '12-24 hours'}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Our certified spiritual wellness experts review each query personally to provide thoughtful, customized guidance.
              </p>
            </div>

            {/* Expert Team Panel */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Our Expert Team</h3>
              </div>

              <div className="space-y-2">
               <p className="text-sm text-gray-600 font-medium">Certified Specialists in:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {displayCategories.slice(0, 5).map(cat => (
                    <li key={cat}>• {cat}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Premium Members Panel */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Premium Members</h3>
              </div>

              <div className="space-y-2 mb-4">
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• {siteSettings.AskExpert_PremiumFeature1 || 'Priority response (12-24 hours)'}</li>
                  <li>• {siteSettings.AskExpert_PremiumFeature2 || 'Follow-up questions included'}</li>
                  <li>• {siteSettings.AskExpert_PremiumFeature3 || 'Personalized wellness plans'}</li>
                  <li>• {siteSettings.AskExpert_PremiumFeature4 || 'Direct expert chat access'}</li>
                </ul>
              </div>

              {hasPremiumAccess ? (
                <div className="space-y-2">
                  <div className="w-full bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg font-medium text-center">
                    {membershipTier === 'premium' ? 'Premium Active' : 'Plus Active'}
                  </div>
                  {currentSubscription && (currentSubscription.planName || currentSubscription.PlanName) && (
                    <p className="text-xs text-gray-600 text-center">
                      Plan: {currentSubscription.planName || currentSubscription.PlanName}
                    </p>
                  )}
                  {(currentSubscription?.currentPeriodEnd || currentSubscription?.CurrentPeriodEnd) && (
                    <p className="text-xs text-gray-600 text-center">
                      Expires on: {new Date(currentSubscription.currentPeriodEnd || currentSubscription.CurrentPeriodEnd).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Upgrade to Plus / Premium
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question History Section */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Previous Questions</h2>
            <button
              onClick={fetchQuestionHistory}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1"
            >
              <svg className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh History</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your journey history...</p>
            </div>
          ) : userQuestions.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600">Your journey with our experts will appear here once you submit your first question.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userQuestions.map((q) => (
                <div key={q.id || q.Id || Math.random()} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${q.priority === 'High Priority' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {q.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.status === 'Answered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {q.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{q.subject}</h3>
                  <p className="text-sm text-purple-600 mb-2 font-medium">{q.category}</p>
                  <p className="text-sm text-gray-700 mb-4 italic">"{q.questionText}"</p>
                  {q.adminResponse && (
                     <div className="bg-purple-50 p-4 rounded-lg mb-4">
                       <p className="font-bold text-sm text-purple-800 mb-1">Expert Response:</p>
                       <p className="text-sm text-purple-900">{q.adminResponse}</p>
                     </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Submitted: {new Date(q.createdOn || q.CreatedOn).toLocaleDateString()}</span>
                    {(q.respondedOn || q.RespondedOn) && (
                      <span>Expert Replied: {new Date(q.respondedOn || q.RespondedOn).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Compact Upgrade Modal - Ask Expert Trial Limit */}
      {showCompactUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💎</span>
                  <h3 className="text-white font-bold text-lg">Upgrade to Premium</h3>
                </div>
                <button
                  onClick={() => setShowCompactUpgradeModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-700 font-medium mb-6 text-center">
                You've used your 2 free expert questions!
              </p>

              {/* Premium Feature List */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Unlimited expert questions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Priority expert support (12-24 hrs)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Personalized wellness plans</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6 text-center border border-purple-100">
                <p className="text-sm text-gray-600 mb-1">Get Premium for</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-bold text-purple-600">$19.99</span>
                  <span className="text-gray-600 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Or $199.99/year - Save 17%</p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowCompactUpgradeModal(false)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleUpgrade}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal - Same as Dashboard */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{monthlyPlan.name || monthlyPlan.Name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">${monthlyPlan.price || monthlyPlan.Price}<span className="text-lg font-normal">/month</span></div>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{yearlyPlan.name || yearlyPlan.Name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">${yearlyPlan.price || yearlyPlan.Price}<span className="text-lg font-normal">/year</span></div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg text-gray-500 line-through">${((monthlyPlan.price || monthlyPlan.Price) * 12).toFixed(2)}</span>
                    <span className="text-sm text-green-600 font-medium">Save ${(((monthlyPlan.price || monthlyPlan.Price) * 12) - (yearlyPlan.price || yearlyPlan.Price)).toFixed(2)}</span>
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
                  onClick={handleClosePricingModal}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Maybe Later
                </button>
                <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
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

export default AskExpertPage;
