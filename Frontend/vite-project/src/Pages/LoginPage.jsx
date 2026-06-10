import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import apiService from '../services/apiService';
import toastService from '../services/toastService';
import HoundheartLogo from '../assets/images/Houndheart_logo.svg';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerifyCode, setShowVerifyCode] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60); // Timer countdown from 60 seconds
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const verificationInputRefs = useRef([]);

  // Password validation regex
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  // Load saved email and password from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberMeEmail');
    const savedPassword = localStorage.getItem('rememberMePassword');

    if (savedEmail && savedPassword) {
      setFormData({
        email: savedEmail,
        password: savedPassword
      });
      setRememberMe(true);
    }
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email.trim()) {
      toastService.error('Please enter your email');
      return;
    }
    if (!formData.password.trim()) {
      toastService.error('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      //debugger;
      // Call your .NET 8 API to login user
      const response = await apiService.loginUser({
        email: formData.email,
        password: formData.password
      });

      console.log('Login successful:', response);

      // Save email and password to localStorage if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('rememberMeEmail', formData.email);
        localStorage.setItem('rememberMePassword', formData.password);
      } else {
        // If Remember Me is unchecked, remove saved credentials
        localStorage.removeItem('rememberMeEmail');
        localStorage.removeItem('rememberMePassword');
      }

      // Fetch user profile to check if profile setup is completed
      try {
        console.log('🔄 Fetching user profile after login...');
        const profileResponse = await apiService.getUserProfile();
        console.log('✅ User profile fetched:', profileResponse);
        try {
          const pr = profileResponse?.data || profileResponse || {};
          if (pr.userId) localStorage.setItem('userId', pr.userId);
        } catch { }
        localStorage.setItem('UserprofilPhotoUrl', profileResponse.profilePhoto);
        localStorage.setItem('DogprofilPhotoUrl', profileResponse.dog.profilePhoto);
        localStorage.setItem('dogName', profileResponse.dog.dogName);
        localStorage.setItem('UserName', profileResponse.us);

        const profileData = profileResponse.data || profileResponse;
        // Persist journal entry count if provided by backend
        try {
          const entryCount = profileData?.journalEntryCount ?? profileData?.JournalEntryCount;
          if (typeof entryCount === 'number') {
            localStorage.setItem('journalEntryCount', String(entryCount));
          }
        } catch { }
        const isProfileSetupCompleted = profileData?.isProfileSetupCompleted || profileData?.IsProfileSetupCompleted;
        // Store IsGoogleSignIn flag
        const isGoogleSignIn = profileData?.isGoogleSignIn || profileData?.IsGoogleSignIn || false;
        localStorage.setItem('isGoogleSignIn', String(isGoogleSignIn));
        // Persist name/email into localStorage 'user' for Navbar/Dashboard initials
        try {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...existingUser,
            fullName: profileData?.fullName || profileData?.profileName || existingUser.fullName || existingUser.name || 'User',
            email: profileData?.email || existingUser.email || ''
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (_) { }

        console.log('Profile setup completed:', isProfileSetupCompleted);

        if (isProfileSetupCompleted) {
          // User has completed profile setup - fetch bonded score before redirecting
          console.log('✅ Profile setup completed - fetching bonded score...');

          try {
            const userId = profileData?.userId || profileData?.UserId || localStorage.getItem('userId');
            const dogId = profileData?.dog?.dogId || profileData?.dog?.DogId;

            if (userId && dogId) {
              localStorage.setItem('dogId', dogId);
              const bondedScoreResponse = await apiService.calculateBondedScore(userId, dogId);
              const bondedScore = bondedScoreResponse?.data?.bondedScore || bondedScoreResponse?.data?.BondedScore || 0;

              // Store bonded score in localStorage
              localStorage.setItem('bondedScore', bondedScore.toString());
              console.log('✅ Bonded score fetched and stored:', bondedScore);
            } else {
              console.warn('⚠️ Missing userId or dogId, cannot fetch bonded score');
            }
          } catch (bondedScoreError) {
            console.error('⚠️ Error fetching bonded score:', bondedScoreError);
            // Don't block login if bonded score fails
          }

          // Redirect to dashboard
          console.log('✅ Redirecting to dashboard');
          toastService.success('Welcome back! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else {
          // User hasn't completed profile setup - redirect to welcome onboarding
          console.log('⚠️ Profile setup not completed - redirecting to welcome');
          toastService.success('Welcome back! Please review the onboarding.');
          setTimeout(() => {
            navigate('/welcome');
          }, 1500);
        }
      } catch (profileError) {
        console.log('⚠️ Profile fetch failed - assuming new user, redirecting to welcome:', profileError);
        toastService.success('Welcome! Please review the onboarding.');
        setTimeout(() => {
          navigate('/welcome');
        }, 1500);
      }

    } catch (error) {
      console.error('Login error:', error);

      // Show error toast with API message
      toastService.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth login handler - handles id_token from OneTap or GoogleLogin component
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log('credentialResponse', credentialResponse);
      // credentialResponse from useGoogleOneTapLogin or GoogleLogin component
      // Both provide: { credential: "id_token_string" }
      const idToken = credentialResponse?.credential;

      if (!idToken) {
        toastService.error('No Google credential received');
        return;
      }

      // Call your backend Google login endpoint with id_token
      const result = await apiService.googleLogin(idToken);
      console.log('result', result);

      if (result?.data) {
        const d = result.data;
        const token = d.Token || d.token;
        const userId = d.UserId || d.userId;
        const email = d.Email || d.email;
        console.log('token', token);
        console.log('userId', userId);
        if (token) localStorage.setItem('token', token);

        if (userId) localStorage.setItem('userId', userId);
        localStorage.setItem('user', JSON.stringify({
          userId,
          email,
          fullName: d.FullName || d.fullName || d.profileName
        }));
        localStorage.setItem('isAuthenticated', 'true');
      }

      // Fetch user profile to get full details including photos and dog info
      try {
        const profileResponse = await apiService.getUserProfile();
        try {
          const pr = profileResponse?.data || profileResponse || {};
          if (pr.userId) localStorage.setItem('userId', pr.userId);
        } catch { }

        localStorage.setItem('UserprofilPhotoUrl', profileResponse.profilePhoto || '');
        localStorage.setItem('DogprofilPhotoUrl', profileResponse.dog?.profilePhoto || '');
        localStorage.setItem('dogName', profileResponse.dog?.dogName || '');

        const profileData = profileResponse.data || profileResponse;
        const isProfileSetupCompleted = profileData?.isProfileSetupCompleted || profileData?.IsProfileSetupCompleted;
        // Store IsGoogleSignIn flag
        const isGoogleSignIn = profileData?.isGoogleSignIn || profileData?.IsGoogleSignIn || false;
        localStorage.setItem('isGoogleSignIn', String(isGoogleSignIn));

        // Update the 'user' object in localStorage with more complete data
        try {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...existingUser,
            userId: profileData.userId || existingUser.userId,
            email: profileData.email || existingUser.email,
            fullName: profileData?.fullName || profileData?.profileName || existingUser.fullName || 'User',
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch { }

        if (isProfileSetupCompleted) {
          // User has completed profile setup - fetch bonded score before redirecting
          console.log('✅ Profile setup completed - fetching bonded score...');

          try {
            const userId = profileData?.userId || profileData?.UserId || localStorage.getItem('userId');
            const dogId = profileData?.dog?.dogId || profileData?.dog?.DogId;

            if (userId && dogId) {
              localStorage.setItem('dogId', dogId);
              const bondedScoreResponse = await apiService.calculateBondedScore(userId, dogId);
              const bondedScore = bondedScoreResponse?.data?.bondedScore || bondedScoreResponse?.data?.BondedScore || 0;

              // Store bonded score in localStorage
              localStorage.setItem('bondedScore', bondedScore.toString());
              console.log('✅ Bonded score fetched and stored:', bondedScore);
            } else {
              console.warn('⚠️ Missing userId or dogId, cannot fetch bonded score');
            }
          } catch (bondedScoreError) {
            console.error('⚠️ Error fetching bonded score:', bondedScoreError);
            // Don't block login if bonded score fails
          }

          // Redirect to dashboard
          toastService.success('Welcome back! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 800);
        } else {
          toastService.success('Welcome! Please review the onboarding.');
          setTimeout(() => navigate('/welcome'), 800);
        }
      } catch (profileError) {
        console.error('Profile fetch failed after Google login:', profileError);
        toastService.info('Logged in with Google. Welcome!');
        setTimeout(() => navigate('/welcome'), 800);
      }
    } catch (err) {
      console.error('Google login error:', err);
      toastService.error(err?.message || 'Google login failed');
    }
  };

  const handleGoogleLoginError = () => {
    toastService.error('Google login failed. Please try again.');
  };

  // Use Google One Tap Login (optional - shows automatic prompt)
  // This provides id_token directly and is perfect for your backend
  useGoogleOneTapLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
  });

  const handleSocialLogin = (provider) => {
    if (provider !== 'Google') {
      console.log(`Logging in with ${provider}`);
      // For other providers (Apple, etc.), keep existing mock logic
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: 'Anjali',
        email: 'abc@gmail.com'
      }));
      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
      navigate('/welcome');
    }
    // Google login is handled by the GoogleLogin component below
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleForgotPassword = () => {
    setForgotEmail('');
    setVerificationCode(['', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowForgotPassword(true);
    setShowVerifyCode(false);
    setShowResetPassword(false);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      toastService.error('Please enter your email');
      return;
    }

    try {
      const response = await apiService.requestPasswordReset(forgotEmail.trim());
      const message = response?.message || response?.Message || 'If an account exists for this email, a reset code has been sent.';
      toastService.success(message);
      setShowForgotPassword(false);
      setShowVerifyCode(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      toastService.error(error?.message || 'We will send you a reset code if this email is registered.');
    }
  };

  const handleCloseVerifyCode = () => {
    setShowVerifyCode(false);
    setVerificationCode(['', '', '', '']);
    setOtpTimer(60); // Reset timer
    setIsResendEnabled(false); // Reset resend button
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setIsUpdatingPassword(false);
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updated = [...verificationCode];
    updated[index] = value;
    setVerificationCode(updated);

    if (value && index < verificationInputRefs.current.length - 1) {
      verificationInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !verificationCode[index] && index > 0) {
      verificationInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (code.length !== 4) {
      toastService.error('Please enter the 4-digit code.');
      return;
    }

    try {
      const response = await apiService.verifyOtp(forgotEmail.trim(), code);
      const message = response?.message || response?.Message || 'OTP verified successfully';
      toastService.success(message);
      setShowVerifyCode(false);
      setShowResetPassword(true);
      setNewPassword('');
      setConfirmPassword('');
      setOtpTimer(60); // Reset timer
      setIsResendEnabled(false); // Reset resend button
    } catch (error) {
      console.error('Verify OTP error:', error);
      toastService.error(error?.message || 'Failed to verify OTP. Please try again.');
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!isResendEnabled || !forgotEmail.trim()) {
      return;
    }

    try {
      setIsResendEnabled(false); // Disable button immediately
      setOtpTimer(60); // Reset timer to 60 seconds

      const response = await apiService.requestPasswordReset(forgotEmail.trim());
      const message = response?.message || response?.Message || 'If an account exists for this email, a reset code has been sent.';
      toastService.success(message);
    } catch (error) {
      console.error('Resend OTP error:', error);
      toastService.error(error?.message || 'Failed to resend OTP. Please try again.');
      // Re-enable resend if error occurs
      setIsResendEnabled(true);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (!showVerifyCode) {
      // Reset timer when modal is closed
      setOtpTimer(60);
      setIsResendEnabled(false);
      return;
    }

    // Start timer when verify code modal opens
    setOtpTimer(60);
    setIsResendEnabled(false);

    const timerInterval = setInterval(() => {
      setOtpTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setIsResendEnabled(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [showVerifyCode]);

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toastService.error('Please fill in all fields.');
      return;
    }

    // Validate password strength using regex
    if (!passwordRegex.test(newPassword)) {
      toastService.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastService.error('Passwords do not match.');
      return;
    }

    if (!forgotEmail.trim()) {
      toastService.error('Unable to update password. Please reopen the forgot password flow.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await apiService.updatePassword(
        forgotEmail.trim(),
        newPassword.trim(),
        confirmPassword.trim()
      );
      const message = response?.message || response?.Message || 'Password updated successfully.';
      toastService.success(message);
      handleCloseResetPassword();
      setShowForgotPassword(false);
      setShowVerifyCode(false);
      setVerificationCode(['', '', '', '']);
      setForgotEmail('');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Password update error:', error);
      toastService.error(error?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  // (Google init moved back to click handler)

  return (
    <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Modal Card */}
      <div
        id="login-modal"
        data-animate
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-slideUp transition-opacity ${showForgotPassword || showVerifyCode || showResetPassword ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div
          id="login-header"
          data-animate
          className={`text-center mb-8 transition-all duration-1000 delay-200 ${isVisible['login-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <h2 className="text-3xl font-bold text-purple-600 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Continue your journey</p>
        </div>


        {/* Login Form */}
        <form
          id="login-form"
          data-animate
          onSubmit={handleSubmit}
          className={`space-y-6 mb-6 transition-all duration-1000 delay-400 ${isVisible['login-form'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-base text-gray-600 cursor-pointer font-medium">
              Remember me
            </label>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end -mt-4">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-normal text-pink-600 hover:text-pink-700 transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 transform shadow-lg ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105'
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div
          id="signup-link"
          data-animate
          className={`text-center mb-6 transition-all duration-1000 delay-600 ${isVisible['signup-link'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={handleSignUp}
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Separator */}
        <div
          id="separator"
          data-animate
          className={`relative mb-6 transition-all duration-1000 delay-800 ${isVisible['separator'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div
          id="social-buttons"
          data-animate
          className={`flex space-x-3 transition-all duration-1000 delay-1000 ${isVisible['social-buttons'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Google Button - Using GoogleLogin component from @react-oauth/google */}
          <div className="flex-1">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap={false} // We're using useGoogleOneTapLogin separately for automatic prompt
              render={({ onClick, disabled }) => (
                <button
                  onClick={onClick}
                  disabled={disabled}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-gray-700 font-medium">Google</span>
                </button>
              )}
            />
          </div>

          {/* Apple Button - Commented out */}
          {/* <button 
            onClick={() => handleSocialLogin('Apple')}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-gray-700 font-medium">Apple</span>
          </button> */}
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn">
            <button
              onClick={handleCloseForgotPassword}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <img src={HoundheartLogo} alt="HoundHeart" className="h-12" />

              <div>
                <h3 className="text-xl font-semibold text-gray-900">Verify your email address</h3>
                <p className="text-gray-600 mt-2">
                  Enter your email, and we’ll send you a code to reset your password.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email</label>
                <input
                  type="email"
                  name="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {showVerifyCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn">
            <button
              onClick={handleCloseVerifyCode}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <img src={HoundheartLogo} alt="HoundHeart" className="h-12" />

              <div>
                <h3 className="text-xl font-semibold text-gray-900">Verify Code</h3>
                <p className="text-gray-600 mt-2">Enter the 4-digit code sent to your email.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyCodeSubmit} className="mt-6 space-y-6">
              <div className="flex justify-center space-x-3">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (verificationInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 shadow-md"
              >
                Verify
              </button>

              {/* Resend OTP Section */}
              <div className="text-center space-y-2">
                {otpTimer > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in <span className="font-semibold text-purple-600">{otpTimer}</span> seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!isResendEnabled}
                    className={`text-sm font-medium transition-colors ${isResendEnabled
                        ? 'text-purple-600 hover:text-purple-700 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fadeIn">
            <button
              onClick={handleCloseResetPassword}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <img src={HoundheartLogo} alt="HoundHeart" className="h-12" />

              <div>
                <h3 className="text-xl font-semibold text-gray-900">Update Password</h3>
                <p className="text-gray-600 mt-2">Set a new password for your account.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePasswordSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 shadow-md ${isUpdatingPassword
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  }`}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
