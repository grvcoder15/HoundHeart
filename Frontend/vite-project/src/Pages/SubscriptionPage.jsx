import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from '../services/toastService';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';

// Updated: 2026-03-10 - Direct API call to AdminSubscription endpoint
const SubscriptionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subscribingPlanId, setSubscribingPlanId] = useState('');

    // Get tab from URL or default to 'plans'
    const tabParam = searchParams.get('tab');
    const billingParam = searchParams.get('billing');
    const [activeTab, setActiveTab] = useState(tabParam || 'plans');
    const [billingPeriod, setBillingPeriod] = useState(billingParam === 'yearly' ? 'yearly' : 'monthly');
    const [apiPlans, setApiPlans] = useState([]);
    const [plansFetched, setPlansFetched] = useState(false);
    const [fetchingCurrent, setFetchingCurrent] = useState(false);
    const [billingHistory, setBillingHistory] = useState(null);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [usageAnalytics, setUsageAnalytics] = useState(null);
    const [syncingStripe, setSyncingStripe] = useState(false);

    // Dynamic user info from localStorage
    const userInfo = (() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fullName = user.fullName || user.profileName || user.name || 'User';
            const email = user.email || '';
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
            return { fullName, email, initials };
        } catch { return { fullName: 'User', email: '', initials: 'U' }; }
    })();

    const isLoggedIn = apiService.isAuthenticated();

    // Fetch plans from API only when Subscription Plans tab is active
    useEffect(() => {
        if (activeTab === 'plans') {
            if (!plansFetched) fetchPlans();
            fetchCurrentSubscription();
        }
        if (activeTab === 'current') {
            fetchCurrentSubscription();
            fetchUsageAnalytics();
        }
        if (activeTab === 'billing') {
            fetchBillingHistory();
        }
    }, [activeTab, plansFetched]);

    useEffect(() => {
        if (billingParam === 'yearly' || billingParam === 'monthly') {
            setBillingPeriod(billingParam);
        }
    }, [billingParam]);

    useEffect(() => {
        const accessMessage = location?.state?.accessMessage;
        if (!accessMessage) {
            return;
        }

        toast.info(accessMessage);

        navigate(location.pathname + location.search, {
            replace: true,
            state: null
        });
    }, [location, navigate]);

    const fetchBillingHistory = async () => {
        try {
            setFetchingHistory(true);
            const response = await apiService.makeRequest('/Subscription/history', {
                method: 'GET'
            });
            // Handle null data correctly instead of falling back to the whole response
            const historyData = response && response.hasOwnProperty('data') ? response.data : response;
            setBillingHistory(historyData);
        } catch (error) {
            console.error('❌ Error fetching billing history:', error);
            toast.error('Failed to load billing history');
        } finally {
            setFetchingHistory(false);
        }
    };

    const fetchCurrentSubscription = async () => {
        try {
            setFetchingCurrent(true);
            const response = await apiService.makeRequest('/Subscription/current', {
                method: 'GET'
            });
            // Handle null data correctly instead of falling back to the whole response
            const subData = response && response.hasOwnProperty('data') ? response.data : response;
            setCurrentSubscription(subData);
        } catch (error) {
            console.error('❌ Error fetching subscription:', error);
            toast.error('Failed to load your subscription details');
        } finally {
            setFetchingCurrent(false);
        }
    };

    const fetchUsageAnalytics = async () => {
        try {
            const response = await apiService.makeRequest('/Subscription/usage-analytics', {
                method: 'GET'
            });
            const data = response?.data || response;
            setUsageAnalytics(data);
        } catch (error) {
            console.error('❌ Error fetching usage analytics:', error);
            // Silently fail - don't toast, just show defaults
        }
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);
            console.log('📡 Fetching plans from /AdminSubscription/membership-plans...');

            // Direct API call using makeRequest - using membership-plans endpoint to get database prices
            const response = await apiService.makeRequest('/AdminSubscription/membership-plans', {
                method: 'GET'
            });
            console.log('✅ API Response:', response);

            // Handle response - could be { data: [...] } or direct array
            const plansData = response.data || response || [];
            setApiPlans(Array.isArray(plansData) ? plansData : []);
            setPlansFetched(true);
        } catch (error) {
            console.error('❌ Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
            setApiPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const normalizeApiPlan = (plan) => {
        const billingPeriod = (plan?.billingPeriod || plan?.BillingPeriod || '').toLowerCase();
        const normalizedInterval = billingPeriod === 'monthly'
            ? 'month'
            : billingPeriod === 'yearly'
                ? 'year'
                : (plan?.interval || plan?.Interval || '').toLowerCase();

        return {
            priceId: plan?.stripePriceId || plan?.StripePriceId || plan?.priceId || plan?.PriceId || '',
            productName: plan?.planName || plan?.PlanName || plan?.productName || plan?.ProductName || '',
            amount: Number(plan?.price ?? plan?.Price ?? plan?.amount ?? plan?.Amount ?? 0),
            currency: (plan?.currency || plan?.Currency || 'USD').toUpperCase(),
            interval: normalizedInterval
        };
    };

    const normalizedApiPlans = useMemo(() => {
        return apiPlans
            .map(normalizeApiPlan)
            .filter((p) => p.priceId || p.amount === 0);
    }, [apiPlans]);

    const plans = useMemo(() => {
        const freeFeatures = [
            'Create and manage account',
            'Create and manage dog profile(s)',
            'Basic app access',
            'Access to newsletter and announcements',
            'Purchase books and merchandise'
        ];

        const plusFeatures = [
            'Includes all Free Member features',
            'Full app access',
            'Full Bonded Score access',
            'Wellness tracking tools',
            'Free digital and audio book',
            'Travel directory access',
            'Partner discounts and wearable connection'
        ];

        const premiumFeatures = [
            'Includes all HoundHeart Plus features',
            'Paperback HoundHeart book',
            'Official HoundHeart T-shirt',
            '$10 donation to animal welfare charities',
            'Travel Club access and premium discounts',
            'Premium Member badge in profile'
        ];

        const hasKeyword = (name, keywords) => {
            const normalized = (name || '').toLowerCase();
            return keywords.some((k) => normalized.includes(k));
        };

        const monthlyPaid = normalizedApiPlans
            .filter((p) => p.interval === 'month' && p.amount > 0)
            .sort((a, b) => a.amount - b.amount);

        const yearlyPaid = normalizedApiPlans
            .filter((p) => p.interval === 'year' && p.amount > 0)
            .sort((a, b) => a.amount - b.amount);

        const freePlan = normalizedApiPlans.find((p) => p.amount === 0);

        const plusMonthlyPlan = normalizedApiPlans.find((p) => p.interval === 'month' && hasKeyword(p.productName, ['plus']))
            || monthlyPaid[0];

        const plusYearlyPlan = normalizedApiPlans.find((p) => p.interval === 'year' && hasKeyword(p.productName, ['plus']))
            || yearlyPaid[0];

        const premiumYearlyPlan = normalizedApiPlans.find((p) => p.interval === 'year' && hasKeyword(p.productName, ['premium']))
            || yearlyPaid.find((p) => p.priceId !== plusYearlyPlan?.priceId)
            || yearlyPaid[yearlyPaid.length - 1];

        const plusSelectedPlan = billingPeriod === 'yearly' ? plusYearlyPlan : plusMonthlyPlan;
        const plusDisplayPrice = plusSelectedPlan?.amount ?? (billingPeriod === 'yearly' ? 79.99 : 9.99);
        const plusOriginalPrice = plusMonthlyPlan?.amount && plusYearlyPlan?.amount
            ? (plusMonthlyPlan.amount * 12).toFixed(2)
            : undefined;
        const plusSavingsText = plusMonthlyPlan?.amount && plusYearlyPlan?.amount
            ? `Save $${(plusMonthlyPlan.amount * 12 - plusYearlyPlan.amount).toFixed(2)} per year`
            : undefined;

        return [
            {
                planId: freePlan?.priceId || null,
                tierLevel: 'free',
                planName: 'Free Member',
                description: 'Essential access to begin your HoundHeart journey',
                price: 0,
                currency: freePlan?.currency || 'USD',
                checkoutBillingPeriod: 'free',
                billingLabel: 'Forever',
                badge: undefined,
                yearlyOnly: false,
                originalPrice: undefined,
                savingsText: undefined,
                features: freeFeatures
            },
            {
                planId: plusSelectedPlan?.priceId || null,
                tierLevel: 'plus',
                planName: 'HoundHeart Plus',
                description: 'Advanced wellness and connection tools for dedicated members',
                price: plusDisplayPrice,
                currency: plusSelectedPlan?.currency || 'USD',
                checkoutBillingPeriod: billingPeriod,
                billingLabel: billingPeriod === 'yearly' ? 'Per Year' : 'Per Month',
                badge: 'Most Popular',
                yearlyOnly: false,
                originalPrice: billingPeriod === 'yearly' ? plusOriginalPrice : undefined,
                savingsText: billingPeriod === 'yearly' ? plusSavingsText : undefined,
                features: plusFeatures
            },
            {
                planId: premiumYearlyPlan?.priceId || null,
                tierLevel: 'premium',
                planName: 'HoundHeart Premium',
                description: 'The complete premium lifestyle package for top-tier members',
                price: premiumYearlyPlan?.amount ?? 149.99,
                currency: premiumYearlyPlan?.currency || 'USD',
                checkoutBillingPeriod: 'yearly',
                billingLabel: 'Per Year (Yearly Only)',
                badge: 'Best Value',
                yearlyOnly: true,
                originalPrice: undefined,
                savingsText: undefined,
                features: premiumFeatures
            }
        ];
    }, [apiPlans, billingPeriod, normalizedApiPlans]);

    const handleSubscribe = async (priceId, selectedBillingPeriod) => {
        try {
            if (!priceId) {
                toast.error('Selected plan is currently unavailable. Please try again in a moment.');
                return;
            }

            setSubscribingPlanId(priceId);
            console.log('🛒 Creating checkout session for:', priceId);

            // Call backend to create Stripe checkout session
            const response = await apiService.makeRequest('/Subscription/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({
                    priceId,
                    billingPeriod: selectedBillingPeriod,
                    BillingPeriod: selectedBillingPeriod
                })
            });

            console.log('✅ Checkout session created:', response);

            // Extract session URL from response
            const sessionUrl = response.data?.sessionUrl || response.sessionUrl;

            if (sessionUrl) {
                // Redirect to Stripe checkout
                console.log('🔗 Redirecting to Stripe checkout...');
                window.location.href = sessionUrl;
            } else {
                throw new Error('No checkout URL received from server');
            }
        } catch (error) {
            console.error('❌ Subscription error:', error);
            toast.error(error.message || 'Failed to start checkout. Please try again.');
            setSubscribingPlanId('');
        }
    };

    const handleManageSubscription = async () => {
        try {
            setLoading(true);
            console.log('🔗 Creating Stripe Portal session...');

            const response = await apiService.makeRequest('/Subscription/create-portal-session', {
                method: 'POST'
            });

            const portalUrl = response.data?.portalUrl || response.portalUrl;

            if (portalUrl) {
                console.log('🚀 Redirecting to Stripe Customer Portal...');
                window.location.href = portalUrl;
            } else {
                throw new Error('No portal URL received from server');
            }
        } catch (error) {
            console.error('❌ Portal error:', error);
            toast.error(error.message || 'Failed to open subscription management.');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncSubscription = async () => {
        try {
            setSyncingStripe(true);
            
            // Only sync if user has an active paid subscription
            if (!currentSubscription) {
                toast.info('You are on the Free plan. No Stripe subscription to sync.');
                setSyncingStripe(false);
                return;
            }

            const response = await apiService.syncSubscriptionFromStripe();
            const syncedSubscription = response?.data || response;

            if (syncedSubscription) {
                setCurrentSubscription(syncedSubscription);
            }

            await fetchBillingHistory();
            toast.success('Latest Stripe record synced successfully');
        } catch (error) {
            console.error('❌ Sync subscription error:', error);
            toast.error(error.message || 'Failed to sync latest Stripe record');
        } finally {
            setSyncingStripe(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    {/* Header - Same as Dashboard */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                                aria-label="Go back"
                                title="Go back"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                aria-label="Go to dashboard"
                            >
                                <img src={HoundHeartLogo} alt="HoundHeart" className="h-8 w-8" />
                                <h1 className="text-lg font-bold text-gray-900">HoundHeart™</h1>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'plans'
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
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'current'
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
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'billing'
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
                    <div className="p-4 lg:p-6">
                        {activeTab === 'plans' && (
                            <div>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Your Plan</h2>
                                    <p className="text-xs text-gray-600">Select the perfect plan for your needs. Upgrade or downgrade at any time.</p>
                                </div>

                                {/* Toggle (Monthly/Yearly) - Working! */}
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Plus Monthly
                                    </span>
                                    <button
                                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                                        className="relative w-14 h-7 rounded-full cursor-pointer transition-colors bg-purple-600"
                                    >
                                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${billingPeriod === 'yearly' ? 'right-0.5' : 'left-0.5'
                                            }`}></div>
                                    </button>
                                    <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Plus Yearly
                                    </span>
                                </div>
                                <p className="text-center text-xs text-gray-500 mb-4">Premium is yearly-only and always checks out as yearly.</p>

                                {/* Pricing Cards */}
                                <div className="grid grid-cols-1 gap-4 mb-6 max-w-5xl mx-auto lg:grid-cols-3">
                                    {plans.length === 0 ? (
                                        <div className="col-span-3 text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Plans...</h3>
                                            <p className="text-gray-600 text-sm">Please wait while we fetch subscription plans</p>
                                        </div>
                                    ) : (
                                        plans.map((plan) => {
                                            const isFree = plan.tierLevel === 'free';
                                            const isPopular = plan.tierLevel === 'plus';
                                            const currentTier = (currentSubscription?.tierLevel || '').toLowerCase();
                                            const isCurrentFree = isLoggedIn && !currentSubscription && isFree;
                                            const isCurrentPaid = !!currentSubscription && (
                                                currentTier === plan.tierLevel ||
                                                currentSubscription.stripePriceId === plan.planId ||
                                                currentSubscription.planName === plan.planName
                                            );
                                            const isCurrentPlan = isCurrentFree || isCurrentPaid;
                                            const buttonLabel = isCurrentPlan
                                                ? 'Current Plan'
                                                : currentSubscription
                                                    ? 'Manage Subscription'
                                                    : isFree
                                                        ? 'Start Free'
                                                        : plan.tierLevel === 'premium'
                                                            ? 'Get Premium'
                                                            : 'Get Plus';
                                            const isProcessing = subscribingPlanId === plan.planId;
                                            const buttonDisabled = isProcessing || isCurrentPlan;

                                            return (
                                                <div
                                                    key={plan.tierLevel}
                                                    className={`relative rounded-2xl border-2 p-4 transition-all hover:shadow-xl ${isPopular
                                                        ? 'border-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-white'
                                                        : isCurrentPlan
                                                            ? 'border-green-500 shadow-lg bg-green-50/20'
                                                            : 'border-gray-200'
                                                        }`}
                                                >
                                                    {plan.badge && (
                                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                                                            {plan.badge}
                                                        </div>
                                                    )}

                                                    {isCurrentPlan && (
                                                        <div className="absolute -top-3 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                                                            Current Plan
                                                        </div>
                                                    )}

                                                    {/* Icon */}
                                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${isFree ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-600 to-pink-600'
                                                        }`}>
                                                        {isFree ? (
                                                            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        ) : isPopular ? (
                                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Plan Name */}
                                                    <h3 className="text-lg font-bold text-center text-gray-900 mb-1">
                                                        {plan.planName}
                                                    </h3>
                                                    <p className="text-xs text-center text-gray-600 mb-3">{plan.description}</p>

                                                    {/* Price */}
                                                    <div className="text-center mb-3">
                                                        {plan.originalPrice && (
                                                            <div className="text-xs text-gray-500 line-through mb-1">
                                                                ${plan.originalPrice}
                                                            </div>
                                                        )}
                                                        <div className="flex items-baseline justify-center gap-1">
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                ${plan.price}
                                                            </span>
                                                            <span className="text-gray-600 text-xs">
                                                                {plan.billingLabel}
                                                            </span>
                                                        </div>
                                                        {plan.savingsText && (
                                                            <div className="text-xs text-green-600 font-semibold mt-1">
                                                                {plan.savingsText}
                                                            </div>
                                                        )}
                                                    </div>

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
                                                        onClick={() => {
                                                            if (isCurrentPlan) {
                                                                return;
                                                            }

                                                            if (currentSubscription) {
                                                                // Redirect to portal for switching or upgrading ANY plan
                                                                handleManageSubscription();
                                                                return;
                                                            }

                                                            if (isFree) {
                                                                toast.success('You are currently on Free Member.');
                                                                return;
                                                            }

                                                            // Otherwise, start new checkout
                                                            handleSubscribe(plan.planId, plan.checkoutBillingPeriod);
                                                        }}
                                                        disabled={buttonDisabled}
                                                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${isCurrentPlan
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-200'
                                                            : isPopular
                                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                                            }`}
                                                    >
                                                        {isProcessing ? (
                                                            <span className="flex items-center justify-center">
                                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Processing...
                                                            </span>
                                                        ) : (
                                                            buttonLabel
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* FAQ Section */}
                                <div className="mt-4 border-t pt-4">
                                    <h3 className="text-base font-bold text-center text-gray-900 mb-4">Frequently Asked Questions</h3>
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
                            <div>
                                {fetchingCurrent ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                                        <p className="text-gray-500">Fetching your subscription details...</p>
                                    </div>
                                ) : currentSubscription ? (
                                    <>
                                        {/* Active Subscription Card */}
                                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="text-xs font-semibold mb-2 opacity-90 uppercase tracking-wider">Active Subscription</div>
                                                    <h2 className="text-2xl font-bold mb-1">{currentSubscription?.planName}</h2>
                                                    <p className="text-sm opacity-90">Your premium journey is active</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs opacity-90 mb-1">Billing Amount</div>
                                                    <div className="text-3xl font-bold">
                                                        {currentSubscription?.currency === 'USD' ? '$' : currentSubscription?.currency}
                                                        {currentSubscription?.amount}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs opacity-75">Period Ending</div>
                                                        <div className="text-sm font-semibold">
                                                            {currentSubscription?.currentPeriodEnd ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs opacity-75">Status</div>
                                                        <div className="text-sm font-semibold uppercase">{currentSubscription?.status}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs opacity-75">Auto Renewal</div>
                                                        <div className="text-sm font-semibold">
                                                            {currentSubscription?.cancelAtPeriodEnd ? 'Disabled' : 'Enabled'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Subscription</h3>
                                        <p className="text-gray-500 mb-6">You are currently on the Free plan. Upgrade to unlock all premium features!</p>
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
                                        >
                                            View Plans
                                        </button>
                                    </div>
                                )}

                                {/* Usage Statistics and Plan Details */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Usage Statistics */}
                                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xl font-bold text-gray-900">Usage Analytics</h3>
                                            <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">Current Cycle</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-semibold text-gray-600">Weekly Progress</span>
                                                    <span className="text-sm font-bold text-purple-600">{usageAnalytics ? `${usageAnalytics.weeklyProgressPercent}%` : 'Active'}</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${usageAnalytics?.weeklyProgressPercent ?? 0}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                    <span className="text-sm text-gray-700 font-medium">Dog Synchronizations</span>
                                                </div>
                                                <span className="text-sm font-black text-gray-900">
                                                    {usageAnalytics ? usageAnalytics.dogSyncCount : '--'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                                <span className="text-sm text-gray-700 font-medium">Intuitive Readings</span>
                                                <span className="text-sm font-black text-gray-900">
                                                    {usageAnalytics ? `${usageAnalytics.readingsUsed} / ${usageAnalytics.readingsTotal} used` : '--'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-3">
                                                <span className="text-sm text-gray-700 font-medium">Monthly Coaching</span>
                                                <span className="text-sm font-black text-gray-900">
                                                    {usageAnalytics ? usageAnalytics.coachingDisplay : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plan Details */}
                                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-5">Plan Specifics</h3>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                                <span className="text-sm text-gray-500 font-medium uppercase tracking-tight">Active Tier</span>
                                                <span className="text-sm font-black text-purple-600 px-3 py-1 bg-purple-50 rounded-lg">{currentSubscription?.planName || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                                <span className="text-sm text-gray-500 font-medium uppercase tracking-tight">Billing Cycle</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {currentSubscription?.planName?.toLowerCase()?.includes('yearly') ? 'Yearly' : 'Monthly'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                                <span className="text-sm text-gray-500 font-medium uppercase tracking-tight">Started On</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {currentSubscription?.createdOn ? new Date(currentSubscription.createdOn).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-2.5">
                                                <span className="text-sm text-gray-500 font-medium uppercase tracking-tight">Renewal Cost</span>
                                                <div className="text-right">
                                                    <span className="text-lg font-black text-gray-900">
                                                        {currentSubscription?.currency === 'USD' ? '$' : (currentSubscription?.currency || '$')}
                                                        {currentSubscription?.amount || 0}
                                                    </span>
                                                    <span className="text-xs text-gray-400 block font-bold uppercase">per cycle</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                            <button
                                                onClick={() => setActiveTab('plans')}
                                                className="py-2.5 px-4 bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                                            >
                                                Change Plan
                                            </button>
                                            <button
                                                onClick={handleManageSubscription}
                                                className="py-2.5 px-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md"
                                            >
                                                Update Cards
                                            </button>
                                            <button
                                                onClick={handleSyncSubscription}
                                                disabled={syncingStripe}
                                                className="py-2.5 px-4 bg-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {syncingStripe ? 'Syncing...' : 'Sync with Stripe'}
                                            </button>
                                        </div>
                                        <p className="mt-4 text-xs text-gray-500 leading-5">
                                            After any update or cancellation in Stripe, use Sync with Stripe to pull the latest record into HoundHeart.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Header */}
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Billing History</h2>
                                    <p className="text-gray-600">Securely view and manage your subscription invoices and payment history.</p>
                                </div>

                                {fetchingHistory ? (
                                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="w-14 h-14 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-6" />
                                        <p className="text-gray-500 font-semibold text-lg animate-pulse">Retrieving your secure billing data...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            {/* Total Spent */}
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                <div className="flex items-center gap-3 text-gray-500 text-sm font-bold uppercase tracking-wider mb-3">
                                                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span>Total Investment</span>
                                                </div>
                                                <div className="text-4xl font-extrabold text-gray-900 mb-1">
                                                    {billingHistory?.currency === 'USD' ? '$' : (billingHistory?.currency || '$')}
                                                    {(billingHistory?.totalSpent || 0).toFixed(2)}
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium">Lifetime contributions to Hound Heart</p>
                                            </div>

                                            {/* Next Payment */}
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                <div className="flex items-center gap-3 text-gray-500 text-sm font-bold uppercase tracking-wider mb-3">
                                                    <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span>Next Charge</span>
                                                </div>
                                                <div className="text-4xl font-extrabold text-gray-900 mb-1">
                                                    {billingHistory?.nextPaymentDate ? (
                                                        <>
                                                            {billingHistory?.currency === 'USD' ? '$' : (billingHistory?.currency || '$')}
                                                            {(billingHistory?.nextPaymentAmount || 0).toFixed(2)}
                                                        </>
                                                    ) : '--'}
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {billingHistory?.nextPaymentDate
                                                        ? `Scheduled for ${new Date(billingHistory.nextPaymentDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                                                        : 'No recurring payment scheduled'}
                                                </p>
                                            </div>

                                            {/* Account Status */}
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                <div className="flex items-center gap-3 text-gray-500 text-sm font-bold uppercase tracking-wider mb-3">
                                                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 21a11.955 11.955 0 01-9.618-7.016m19.236 0A11.957 11.957 0 0012 3a11.957 11.957 0 00-9.618 7.016" />
                                                        </svg>
                                                    </div>
                                                    <span>Membership</span>
                                                </div>
                                                <div className={`text-4xl font-extrabold mb-1 ${currentSubscription?.status === 'active' ? 'text-green-600' : 'text-gray-900'
                                                    }`}>
                                                    {currentSubscription?.status ? (currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)) : 'Free'}
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {currentSubscription?.status === 'active' ? 'Full premium access enabled' : 'Upgrade to unlock all features'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Transaction Table */}
                                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                <h3 className="font-bold text-gray-900">Transaction History</h3>
                                                <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-md">
                                                    {billingHistory?.history?.length || 0} RECORDS
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-white border-b border-gray-100">
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Ref</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {billingHistory?.history && billingHistory.history.length > 0 ? (
                                                            billingHistory.history.map((inv, idx) => (
                                                                <tr key={idx} className="hover:bg-purple-50/20 transition-colors group">
                                                                    <td className="px-6 py-4 text-sm font-mono text-gray-400 group-hover:text-purple-600 transition-colors">
                                                                        {inv.transactionId ? `${inv.transactionId.substring(0, 14)}...` : 'PRM-REF-ID'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                                                                        {new Date(inv.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">{inv.planName}</td>
                                                                    <td className="px-6 py-4 text-sm font-black text-gray-900">
                                                                        {inv.currency === 'USD' ? '$' : inv.currency}
                                                                        {inv.amount.toFixed(2)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${inv.status === 'active' || inv.status === 'succeeded'
                                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                            }`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${inv.status === 'active' || inv.status === 'succeeded' ? 'bg-green-500' : 'bg-yellow-500'
                                                                                }`} />
                                                                            {inv.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400 bg-gray-50/30">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="font-bold text-lg">No payments recorded yet</p>
                                                                        <p className="text-sm">When you subscribe to a plan, your history will appear here.</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default SubscriptionPage;
