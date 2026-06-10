import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Get userId and email from navigation state
  const userId = location.state?.userId;
  const userEmail = location.state?.email;

  useEffect(() => {
    if (!userId || !userEmail) {
      navigate('/signup');
    }
  }, [userId, userEmail, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && isLoading === false) {
      setCanResend(true);
    }
  }, [resendTimer, isLoading]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setOtp(value);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 4) {
      setError('Please enter a 4-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.verifyEmailOtp({
        userId,
        otpCode: otp
      });

      console.log('Email verification successful:', response);

      // Store token
      if (response?.data?.Token) {
        localStorage.setItem('token', response.data.Token);
      }

      toastService.success('Email verified successfully!');

      // Navigate to welcome page
      setTimeout(() => {
        navigate('/welcome', { replace: true });
      }, 1500);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid or expired code. Please try again.');
      toastService.error(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setCanResend(false);
    setResendTimer(60);

    try {
      await apiService.resendVerificationEmail({ userId });
      toastService.success('Verification code sent to your email');
    } catch (error) {
      console.error('Resend error:', error);
      toastService.error(error.message || 'Failed to resend code');
      setCanResend(true);
      setResendTimer(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={HoundHeartLogo} alt="HoundHeart Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-purple-600">Verify Email</h1>
        </div>

        {/* Email Display */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-center text-slate-600">
            We've sent a verification code to:
          </p>
          <p className="text-center font-semibold text-purple-600 mt-2">
            {userEmail}
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              maxLength="4"
              inputMode="numeric"
              placeholder="0000"
              value={otp}
              onChange={handleOtpChange}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none text-center text-2xl tracking-widest font-semibold"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={otp.length !== 4 || isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Resend Code */}
        <div className="text-center mt-6">
          <p className="text-slate-600 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendEmail}
            disabled={!canResend || isLoading}
            className="text-purple-600 hover:text-purple-700 font-semibold text-sm disabled:text-slate-400 disabled:cursor-not-allowed transition"
          >
            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires in 10 minutes.
          </p>
        </div>

        {/* Back to Signup */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/signup')}
            className="text-slate-600 hover:text-slate-800 text-sm"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
