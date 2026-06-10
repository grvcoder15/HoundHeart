import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from '../services/toastService';

const SubscriptionSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [verifying, setVerifying] = React.useState(true);
    const [status, setStatus] = React.useState('verifying'); // verifying, success, error
    const hasVerified = React.useRef(false);

    useEffect(() => {
        const verifySubscription = async () => {
            // Guard to prevent double execution in React StrictMode
            if (!sessionId || hasVerified.current) {
                if (!sessionId) setStatus('error');
                if (hasVerified.current && status !== 'verifying') setVerifying(false);
                return;
            }

            hasVerified.current = true;

            try {
                // Real-time verification with Stripe session
                // We consolidated the backend to return isPremium and roleId here
                const response = await apiService.makeRequest(`/Subscription/verify-session/${sessionId}`, {
                    method: 'GET'
                });

                if (response?.data?.verified) {
                    const { isPremium, roleId } = response.data;

                    if (isPremium) {
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const user = JSON.parse(userStr);
                            user.isPremium = true;
                            user.roleId = roleId;
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                    }

                    setStatus('success');
                    toast.success('🎉 Subscription verified and active!');

                    // Auto-redirect to dashboard after a short delay
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2500);

                } else {
                    setStatus('error');
                    toast.error('Verification pending. Please check your dashboard in a moment.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
            } finally {
                setVerifying(false);
            }
        };

        verifySubscription();
    }, [sessionId, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
                    {/* Status Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${status === 'verifying' ? 'bg-purple-100' :
                        status === 'success' ? 'bg-green-100 animate-bounce' : 'bg-red-100'
                        }`}>
                        {status === 'verifying' ? (
                            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        {status === 'verifying' ? 'Verifying Payment...' :
                            status === 'success' ? '🎉 Payment Successful!' : '❌ Verification Failed'}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-2">
                        {status === 'verifying' ? 'Please wait while we confirm your subscription.' :
                            status === 'success' ? <>Welcome to <span className="font-bold text-purple-600">HoundHeart Premium</span>!</> :
                                'Something went wrong while verifying your payment.'}
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        {status === 'verifying' ? 'This should only take a moment...' :
                            status === 'success' ? 'Your subscription is now active. Check your "Current Plan" tab to view details.' :
                                'Please contact support if your payment was deducted.'}
                    </p>

                    {status === 'success' && (
                        <p className="text-sm font-medium text-purple-600 animate-pulse mt-6">
                            Redirecting to your dashboard...
                        </p>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3 mt-6">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3 px-6 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-all duration-200"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionSuccessPage;
