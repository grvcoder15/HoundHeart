import React from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumPromptModal = ({ isOpen, onClose, messageText }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUpgrade = () => {
        onClose();
        navigate('/subscription');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
                {/* Lock Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
                    Unlock Full Access
                </h2>

                {/* Message */}
                <p className="text-center text-gray-600 mb-6">
                    {messageText || 'Upgrade to Premium to access the full Sacred Guide and enjoy all exclusive features.'}
                </p>

                {/* Pricing Quick View */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Monthly</p>
                            <p className="text-2xl font-bold text-purple-600">$9.99</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Yearly</p>
                            <p className="text-2xl font-bold text-purple-600">$99</p>
                            <p className="text-xs text-green-600 font-semibold">Save 17%</p>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                    {['Full Sacred Guide Access', 'Download PDF', 'Unlimited Chakra Rituals', 'Premium Features'].map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleUpgrade}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                    >
                        Upgrade to Premium
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumPromptModal;
