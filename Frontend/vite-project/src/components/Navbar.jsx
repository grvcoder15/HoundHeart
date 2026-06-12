import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';

const Navbar = ({ currentPage = 'dashboard', onUpgrade, onChangePassword }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showUpcomingDropdown, setShowUpcomingDropdown] = useState(false);
  const profileDropdownRef = React.useRef(null);
  const upcomingDropdownRef = React.useRef(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    initials: ''
  });

  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [membershipTier, setMembershipTier] = useState('free');

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

  const isActiveSubscription = (subscription) => {
    if (!subscription) return false;

    const status = (subscription.status || subscription.Status || '').toString().toLowerCase();
    const periodEnd = subscription.currentPeriodEnd || subscription.CurrentPeriodEnd;
    const endDate = periodEnd ? new Date(periodEnd) : null;
    const now = new Date();

    return (status === 'active' || status === 'trialing') && (!endDate || endDate >= now);
  };

  const hasPaidAccess = membershipTier === 'plus' || membershipTier === 'premium';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (upcomingDropdownRef.current && !upcomingDropdownRef.current.contains(event.target)) {
        setShowUpcomingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const user = localStorage.getItem('user');
        const userObj = user ? JSON.parse(user) : {};
        const rolePremium = userObj.roleId === 2 || userObj.RoleId === 2;
        const tierFromUser = normalizeTier(userObj.tierLevel);
        const resolvedTier = tierFromUser !== 'free' ? tierFromUser : (rolePremium ? 'premium' : 'free');

        const name = userObj.fullName || userObj.profileName || userObj.name || 'User';
        const email = userObj.email || '';

        // Check if user signed in with Google
        const isGoogleUser = localStorage.getItem('isGoogleSignIn') === 'true';
        setIsGoogleSignIn(isGoogleUser);

        console.log('Navbar loading user data:', { userObj, name, email, isGoogleUser });

        // Generate initials from name
        const initials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);

        setUserData({
          name,
          email,
          initials
        });
        setMembershipTier(resolvedTier);

        console.log('Navbar user data loaded:', { name, email, initials, isGoogleUser });
      } catch (error) {
        console.error('Error loading user data in Navbar:', error);
        // Fallback to default values
        setUserData({
          name: 'User',
          email: '',
          initials: 'U'
        });
        setIsGoogleSignIn(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await apiService.makeRequest('/Subscription/current', { method: 'GET' });
        const subData = response && Object.prototype.hasOwnProperty.call(response, 'data') ? response.data : response;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const rolePremium = user.roleId === 2 || user.RoleId === 2;
        const tierFromUser = normalizeTier(user.tierLevel);
        const tierFromPlan = isActiveSubscription(subData)
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
        setMembershipTier(resolvedTier);
      } catch (error) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const rolePremium = user.roleId === 2 || user.RoleId === 2;
        const tierFromUser = normalizeTier(user.tierLevel);
        setMembershipTier(tierFromUser !== 'free' ? tierFromUser : (rolePremium ? 'premium' : 'free'));
      }
    };

    fetchSubscription();
  }, []);

  const handleProfileClick = (e) => {
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

  const handleChangePasswordClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Change Password option clicked');
    // Close dropdown first
    setShowProfileDropdown(false);

    if (onChangePassword) {
      setTimeout(() => {
        onChangePassword();
      }, 100);
    } else {
      // Fallback: navigate to dashboard where the change password modal exists
      setTimeout(() => {
        navigate('/dashboard?action=change-password');
      }, 100);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Logout button clicked');

    try {
      // Close the dropdown first
      setShowProfileDropdown(false);

      // Preserve Remember Me credentials before clearing localStorage
      const rememberMeEmail = localStorage.getItem('rememberMeEmail');
      const rememberMePassword = localStorage.getItem('rememberMePassword');

      // Clear all localStorage on logout
      localStorage.clear();

      // Restore Remember Me credentials if they existed
      if (rememberMeEmail && rememberMePassword) {
        localStorage.setItem('rememberMeEmail', rememberMeEmail);
        localStorage.setItem('rememberMePassword', rememberMePassword);
      }

      // Navigate to landing page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: try direct navigation
      window.location.href = '/';
    }
  };

  const handleUpgrade = () => {
    console.log('Upgrade button clicked');
    // Navigate to subscription page
    navigate('/subscription');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', key: 'dashboard' },
    { name: 'Journal', path: '/journal', key: 'journal' },
    // { name: 'Rituals', path: '/rituals', key: 'rituals' },
    { name: 'Community', path: '/community', key: 'community' },
    { name: 'Sacred Guide', path: '/sacred-guide', key: 'sacred-guide' },
    { name: 'Ask Our Expert', path: '/ask-expert', key: 'ask-expert' }
  ];

  const comingSoonItems = [
    { name: '🏖️ Travel Club', path: '/travel-club', key: 'travel-club' },
    { name: '⌚ Wearable Shop', path: '/wearable-marketplace', key: 'wearable-marketplace' },
    { name: '🛍️ Store', path: '/store', key: 'store' },
    { name: '📚 Books', path: '/books', key: 'books' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src={HoundHeartLogo} alt="HoundHeart" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-900">HoundHeart™</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`transition-colors ${currentPage === item.key
                ? 'text-purple-600 font-semibold border-b-2 border-purple-600 pb-1'
                : 'text-gray-600 hover:text-purple-600'
                }`}
            >
              {item.name}
            </button>
          ))}

        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">

          {/* Upcoming Dropdown */}
          <div className="relative" ref={upcomingDropdownRef}>
            <button
              onClick={() => setShowUpcomingDropdown(!showUpcomingDropdown)}
              className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <span>Upcoming</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showUpcomingDropdown ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUpcomingDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Coming Soon</p>
                </div>
                {comingSoonItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { navigate(item.path); setShowUpcomingDropdown(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between group"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] bg-orange-100 text-orange-500 font-semibold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Soon
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade Button */}
          {hasPaidAccess ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg">
              <div className="text-sm font-semibold leading-tight">{membershipTier === 'premium' ? 'Premium Active' : 'Plus Active'}</div>
              {(currentSubscription?.currentPeriodEnd || currentSubscription?.CurrentPeriodEnd) && (
                <div className="text-[11px] leading-tight text-green-600">
                  Valid till {new Date(currentSubscription.currentPeriodEnd || currentSubscription.CurrentPeriodEnd).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Upgrade</span>
            </button>
          )}

          {/* User Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{userData.initials}</span>
              </div>
              <span className="text-gray-700 font-medium hidden sm:block">{userData.name}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Profile Section */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                  <p className="text-sm text-gray-500">{userData.email}</p>
                </div>

                {/* Profile Settings */}
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center space-x-3"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile Settings</span>
                </button>

                {/* Change Password */}
                <button
                  onClick={handleChangePasswordClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center space-x-3"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </button>

                {/* Logout Section */}
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
