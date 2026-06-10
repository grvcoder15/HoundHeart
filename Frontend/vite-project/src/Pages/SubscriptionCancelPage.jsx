import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancelPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
                    {/* Cancel Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" stroke Linejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Subscription Canceled
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-8">
                        No worries! Your subscription wasn't completed. You can try again anytime or continue exploring with your free account.
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 px-6 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-all duration-200"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionCancelPage;
