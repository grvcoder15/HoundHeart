import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from '../services/toastService';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [activeTab, setActiveTab] = useState('plans');
    const [billingPeriod, setBillingPeriod] = useState('monthly'); // Toggle state
    
    // Monthly Plans
    const monthlyPlans = [
        {
            planId: '1',
            planName: 'Trial Period',
            description: 'Try before you commit',
            price: 0,
            currency: 'USD',
            billingPeriod: 'Forever',
            features: [
                'Try before you buy with our 1 week access pass',
                'Check in a minimum of 3 times a week (excluding the weekends)',
                'Access guided meditations and exercises',
                'Basic community access'
            ]
        },
        {
            planId: '2',
            planName: 'Premium Pro Pack',
            description: 'For dedicated dog parents',
            price: 9.99,
            currency: 'USD',
            billingPeriod: 'monthly',
            badge: 'Most Popular',
            features: [
                'Transform your bond',
                'Check in unlimited times',
                'Unlimited access to Pro Plus features',
                'Intuitive Readings',
                'Access to guided meditations and exercises',
                'Priority email support',
                'Exclusive community forum',
                'Monthly live Q&A sessions'
            ]
        },
        {
            planId: '3',
            planName: 'Premium Elite Package',
            description: 'The ultimate connection experience',
            price: 19.99,
            currency: 'USD',
            billingPeriod: 'monthly',
            features: [
                'Transform your bond',
                'Check in unlimited times',
                'Everything in Premium Pro Pack',
                'Premium Access Plus Exclusive',
                'Personalized Animal Plan',
                'One-on-one coaching session (monthly)',
                'Advanced tracking and insights',
                'Early access to new features',
                'VIP support (24/7)'
            ]
        }
    ];

    // Yearly Plans (with discount)
    const yearlyPlans = [
        {
            planId: '1',
            planName: 'Trial Period',
            description: 'Try before you commit',
            price: 0,
            currency: 'USD',
            billingPeriod: 'Forever',
            features: [
                'Try before you buy with our 1 week access pass',
                'Check in a minimum of 3 times a week (excluding the weekends)',
                'Access guided meditations and exercises',
                'Basic community access'
            ]
        },
        {
            planId: '2-yearly',
            planName: 'Premium Pro Pack',
            description: 'For dedicated dog parents',
            price: 99.99,
            originalPrice: 119.88,
            currency: 'USD',
            billingPeriod: 'yearly',
            badge: 'Most Popular',
            savingsText: 'Save $20 per year',
            features: [
                'Transform your bond',
                'Check in unlimited times',
                'Unlimited access to Pro Plus features',
                'Intuitive Readings',
                'Access to guided meditations and exercises',
                'Priority email support',
                'Exclusive community forum',
                'Monthly live Q&A sessions'
            ]
        },
        {
            planId: '3-yearly',
            planName: 'Premium Elite Package',
            description: 'The ultimate connection experience',
            price: 199.99,
            originalPrice: 239.88,
            currency: 'USD',
            billingPeriod: 'yearly',
            savingsText: 'Save $40 per year',
            features: [
                'Transform your bond',
                'Check in unlimited times',
                'Everything in Premium Pro Pack',
                'Premium Access Plus Exclusive',
                'Personalized Animal Plan',
                'One-on-one coaching session (monthly)',
                'Advanced tracking and insights',
                'Early access to new features',
                'VIP support (24/7)'
            ]
        }
    ];

    // Show plans based on selected billing period
    const plans = billingPeriod === 'monthly' ? monthlyPlans : yearlyPlans;

    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    useEffect(() => {
       if (sessionId) {
            toast.success('🎉 Subscription successful! Welcome to Premium!');
            window.history.replaceState({}, '', '/subscription');
        } else if (canceled) {
            toast.info('Subscription canceled. You can try again anytime.');
            window.history.replaceState({}, '', '/subscription');
        }
        // Using dummy data, no API calls needed for now
    }, []);

    const handleSubscribe = async (planId) => {
        // Will connect to Stripe later
        console.log('Subscribe to plan:', planId);
        toast.info('Stripe integration will be connected soon!');
    };

    const handleManageSubscription = async () => {
        // Will connect to Stripe portal later
        console.log('Manage subscription');
        toast.info('Subscription management coming soon!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold text-white">Subscription Manager</h1>
                            </div>
                            <div className="flex items-center gap-2 text-white text-sm">
                                <span>John Doe</span>
                                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                                    JD
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'plans'
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Subscription Plans
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('current')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'current'
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Current Plan
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'billing'
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Billing History
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 lg:p-8">
                        {activeTab === 'plans' && (
                            <div>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                                    <p className="text-sm lg:text-base text-gray-600">Select the perfect plan for your needs. Upgrade or downgrade at any time.</p>
                                </div>

                                {/* Toggle (Monthly/Yearly) */}
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Monthly
                                    </span>
                                    <button
                                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                                        className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${
                                            billingPeriod === 'yearly' ? 'bg-purple-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                            billingPeriod === 'yearly' ? 'right-0.5' : 'left-0.5'
                                        }`}></div>
                                    </button>
                                    <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Yearly
                                        {billingPeriod === 'yearly' && (
                                            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                Save 20%
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* Pricing Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
                                    {plans.map((plan) => {
                                        const isFree = plan.price === 0;
                                        const isPopular = plan.badge === 'Most Popular';
                                        
                                        return (
                                            <div 
                                                key={plan.planId}
                                                className={`relative rounded-2xl border-2 p-5 transition-all hover:shadow-xl ${
                                                    isPopular 
                                                        ? 'border-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-white' 
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                {plan.badge && (
                                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                                                        {plan.badge}
                                                    </div>
                                                )}

                                                {/* Icon */}
                                                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                                                    isFree ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-600 to-pink-600'
                                                }`}>
                                                    {isFree ? (
                                                        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : isPopular ? (
                                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    {plan.originalPrice && (
                                                        <div className="text-xs text-gray-500 line-through mb-1">
                                                            ${plan.originalPrice}
                                                        </div>
                                                    )}
                                                    <div className="flex items-baseline justify-center gap-1">
                                                        <span className="text-3xl font-bold text-gray-900">
                                                            ${plan.price}
                                                        </span>
                                                        <span className="text-gray-600 text-xs">
                                                            {isFree ? 'Forever' : billingPeriod === 'yearly' ? 'Per Year' : 'Per Month'}
                                                        </span>
                                                    </div>
                                                    {plan.savingsText && (
                                                        <div className="text-xs text-green-600 font-semibold mt-1">
                                                            {plan.savingsText}
                                                        </div>
                                                    )}
                                                {/* Plan Name */}
                                                <h3 className="text-lg font-bold text-center text-gray-900 mb-1">
                                                    {plan.planName}
                                                </h3>
                                                <p className="text-xs text-center text-gray-600 mb-3">{plan.description}</p>

                                                {/* Price */}
                                                <div className="text-center mb-4">
                                                    {plan.originalPrice && (
                                                        <div className="text-xs text-gray-500 line-through mb-1">
                                                            ${plan.originalPrice}
                                                        </div>
                                                    )}
                                                    <div className="flex items-baseline justify-center gap-1">
                                                        <span className="text-3xl font-bold text-gray-900">
                                                            ${plan.price}
                                                        </span>
                                                        <span className="text-gray-600 text-xs">
                                                            {isFree ? 'Forever' : billingPeriod === 'yearly' ? 'Per Year' : 'Per Month'}
                                                        </span>
                                                    </div>
                                                    {plan.savingsText && (
                                                        <div className="text-xs text-green-600 font-semibold mt-1">
                                                            {plan.savingsText}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Current Plan Label */}
                                                {!isFree && !isPopular && (
                                                    <div className="text-center mb-4">
                                                        <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-semibold">
                                                            Current Plan
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Features */}
                                                <ul className="space-y-2.5 mb-5">
                                                    {plan.features.map((feature, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs">
                                                            <svg 
                                                                className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-gray-700 leading-snug">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* CTA Button */}
                                                <button
                                                    onClick={() => isFree ? null : handleSubscribe(plan.planId)}
                                                    disabled={subscribing || isFree}
                                                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                                        isFree
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {subscribing ? 'Processing...' : 'Get Started'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* FAQ Section */}
                                <div className="mt-8 border-t pt-6">
                                    <h3 className="text-xl font-bold text-center text-gray-900 mb-6">Frequently Asked Questions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Can I change plans at any time?</h4>
                                            <p className="text-xs text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">What payment methods do you accept?</h4>
                                            <p className="text-xs text-gray-600">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Is there a free trial?</h4>
                                            <p className="text-xs text-gray-600">Yes! All paid plans come with a 14-day free trial. No credit card required.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Can I cancel anytime?</h4>
                                            <p className="text-xs text-gray-600">Absolutely! Cancel anytime from your account settings. No questions asked.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'current' && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Plan Tab</h3>
                                <p className="text-gray-600">Your current subscription details will appear here.</p>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing History Tab</h3>
                                <p className="text-gray-600">Your payment history will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
