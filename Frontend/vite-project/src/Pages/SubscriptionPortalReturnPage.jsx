import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from '../services/toastService';

const SubscriptionPortalReturnPage = () => {
  const navigate = useNavigate();
  const [syncState, setSyncState] = useState('syncing');
  const [message, setMessage] = useState('Refreshing your latest Stripe changes before returning you to subscription details.');

  useEffect(() => {
    let isMounted = true;
    let redirectTimer;

    const syncLatestSubscription = async () => {
      try {
        await apiService.syncSubscriptionFromStripe();

        if (!isMounted) return;

        setSyncState('success');
        setMessage('Your latest Stripe changes have been synced. Redirecting to dashboard now.');
        redirectTimer = setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      } catch (error) {
        if (!isMounted) return;

        console.error('Subscription return sync error:', error);
        setSyncState('error');
        setMessage('Automatic refresh did not complete. Open your subscription page and tap Sync with Stripe after any update or cancellation to fetch the latest record.');
        toast.error(error.message || 'Automatic Stripe sync failed');
      }
    };

    syncLatestSubscription();

    return () => {
      isMounted = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l-7 7 7 7M2 12h20" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Return to Home</h1>
          <p className="text-gray-600 mb-4">
            {message}
          </p>

          <div className={`mb-8 rounded-2xl px-4 py-3 text-sm font-semibold ${syncState === 'error' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
            After any update or cancellation in Stripe, use Sync with Stripe to get the latest record here.
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Return to Home
            </button>
          </div>

          <p className={`text-sm font-medium mt-6 ${syncState === 'error' ? 'text-amber-600' : 'text-purple-600 animate-pulse'}`}>
            {syncState === 'error' ? 'Automatic sync needs a manual retry.' : 'Redirecting to dashboard...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPortalReturnPage;