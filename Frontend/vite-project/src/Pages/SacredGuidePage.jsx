import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';
import SacredGuideReaderPage from './SacredGuideReaderPage';

const SacredGuidePage = () => {
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [waitlistName, setWaitlistName] = useState('');
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hasDigitalBookAccess, setHasDigitalBookAccess] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [sacredGuideId, setSacredGuideId] = useState(null);
    const [guidePrice, setGuidePrice] = useState(0);
    const [toastMsg, setToastMsg] = useState('');
    const [guideData, setGuideData] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [guideSalesEnabled, setGuideSalesEnabled] = useState(true);

    const handleUpgrade = () => setShowPricingModal(true);

    // Load user tier + active guide + waitlist status + check if sales enabled
    useEffect(() => {
        // 1. Determine user tier from localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const tierLevel = String(user.tierLevel || '').toLowerCase().trim();
                const roleId = user.roleId || user.RoleId;

                // Keep role fallback for older sessions while preferring tierLevel.
                if (tierLevel === 'plus' || tierLevel === 'premium' || Number(roleId) === 2) {
                    setHasDigitalBookAccess(true);
                }
            }
        } catch (_) { }

        // 2. Fetch active Sacred Guide + check platform settings
        const loadGuide = async () => {
            try {
                const res = await apiService.getActiveSacredGuide();
                const guide = res?.data;
                if (guide?.sacredGuideId) {
                    setSacredGuideId(guide.sacredGuideId);
                    setGuideData(guide);
                    if (guide.price != null) setGuidePrice(guide.price);

                    // 3. Check if user already joined waitlist
                    const statusRes = await apiService.getSacredGuideWaitlistStatus(guide.sacredGuideId);
                    if (statusRes?.data?.joined) setHasJoined(true);
                }
            } catch (err) {
                console.error('Error loading guide:', err);
            }

            // 4. Check if sacred guide sales are enabled (public endpoint, no auth required)
            try {
                const platformRes = await apiService.makeRequest('/Settings/public/sacred-guide-status', { method: 'GET' });
                if (platformRes?.data?.enableSacredGuideSales === false) {
                    setGuideSalesEnabled(false);
                }
            } catch (_) {
                // If endpoint fails, default to enabled
            }

            setPageLoading(false);
        };
        loadGuide();
    }, []);

    // Auto-hide toast after 3 s
    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(''), 3000);
        return () => clearTimeout(t);
    }, [toastMsg]);

    // Show loading spinner while fetching guide
    if (pageLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    // If guide is Live and has a file → show the reader page (allow free users with page limit)
    const isLive = guideData?.status?.toLowerCase() === 'live';
    const hasPdf = !!guideData?.pdfUrl;

    // Show reader to all users (free users limited to previewPages in the reader itself)
    if (isLive && hasPdf) {
        return <SacredGuideReaderPage guide={guideData} hasFullAccess={hasDigitalBookAccess} />;
    }

    // ─── Derive dynamic values from API (ZERO hardcoding) ───
    const guideTitle = guideData?.title || guideData?.Title || 'Sacred Guide';
    const guideDesc = guideData?.description || guideData?.Description || '';
    const guideStatus = guideData?.status || guideData?.Status || 'Draft';
    const guideTotalPages = guideData?.totalPages || guideData?.TotalPages || null;
    const guideDistribution = guideData?.distribution || guideData?.Distribution || 'Exclusive';

    const statusLabel = guideStatus === 'Live' ? 'Available Now'
        : guideStatus === 'Ready' ? 'Ready for Launch'
            : guideStatus === 'Draft' ? 'Coming Soon' : guideStatus;

    const statusColor = guideStatus === 'Live' ? { bg: '#dcfce7', text: '#16a34a' }
        : guideStatus === 'Ready' ? { bg: '#dbeafe', text: '#2563eb' }
            : { bg: '#fefce8', text: '#ca8a04' };

    // Otherwise show the Coming Soon page

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <Navbar currentPage="sacred-guide" onUpgrade={handleUpgrade} />

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Page Header — "Before launching book screen" label */}
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 }}>
                    Before launching book screen
                </p>

                {/* Title Section */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#7c3aed' }}>{guideTitle} ({statusLabel})</h1>
                        {guideDesc && <p className="text-sm text-gray-500">{guideDesc}</p>}
                    </div>
                </div>

                {/* ─── Hero Banner — Coming Soon ─────────────────── */}
                <div
                    className="rounded-2xl p-8 mb-8"
                    style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 30%, #e879f9 60%, #ec4899 100%)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                    {/* Banner Title */}
                    <div className="flex items-center gap-3 mb-6" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{guideTitle} — {statusLabel}</h2>
                            <p className="text-sm text-white text-opacity-80">{guideDesc || 'Your complete spiritual wellness companion guide'}</p>
                        </div>
                    </div>

                    {/* Feature Pills */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ position: 'relative', zIndex: 2 }}>
                        {/* Free for Plus and Premium */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-sm">Free for Plus & Premium</p>
                            <p className="text-white text-opacity-70 text-xs">Included with Plus and Premium subscriptions</p>
                        </div>

                        {/* HoundHeart Exclusive */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-sm">HoundHeart Exclusive</p>
                            <p className="text-white text-opacity-70 text-xs">Available only on our platform</p>
                        </div>

                        {/* Pages of Wisdom — dynamic from DB */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-sm">{guideTotalPages ? `${guideTotalPages} Pages of Wisdom` : 'Comprehensive Guide'}</p>
                            <p className="text-white text-opacity-70 text-xs">{guideTotalPages ? 'Detailed spiritual guide' : 'Full spiritual wellness guide'}</p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="flex justify-center" style={{ position: 'relative', zIndex: 2 }}>
                        {isLive ? (
                            <>
                                <button
                                    onClick={() => setShowPricingModal(true)}
                                    className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 shadow-xl"
                                    style={{
                                        background: 'white',
                                        color: '#7c3aed',
                                    }}
                                >
                                    Upgrade Now
                                </button>
                                {/* Free Preview Button for users without full digital-book access */}
                                {!hasDigitalBookAccess && (
                                    <button
                                        disabled={!guideSalesEnabled}
                                        onClick={() => setShowPreview(true)}
                                        title={!guideSalesEnabled ? "Sacred Guide sales are currently disabled" : ""}
                                        className="px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 border-2 border-white text-white shadow-xl hover:bg-white hover:bg-opacity-10 ml-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        Read Free Preview
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                disabled={hasJoined}
                                onClick={() => { if (!hasJoined) setShowWaitlistModal(true); }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 disabled:opacity-80 disabled:cursor-default"
                                style={{
                                    background: 'white',
                                    color: hasJoined ? '#16a34a' : '#7c3aed',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                }}
                            >
                                {hasJoined ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Waitlist Joined
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        Get Notified When Ready
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {isLive && !hasDigitalBookAccess && (
                        <p className="text-center text-white text-sm mt-4 font-semibold" style={{ position: 'relative', zIndex: 2 }}>
                            Upgrade to HoundHeart Plus to get free digital book
                        </p>
                    )}
                </div>

                {/* ─── Bottom Cards — Pricing & Project Status ──── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Pricing Structure Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>💲</span>
                            <h3 className="text-lg font-bold text-gray-900">Pricing Structure</h3>
                        </div>

                        {/* Free Members Price */}
                        <div
                            className="rounded-xl p-5 mb-4 text-center transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: !hasDigitalBookAccess ? '2px solid #f59e0b' : '1px solid #fde68a',
                                opacity: hasDigitalBookAccess ? 0.55 : 1,
                                transform: !hasDigitalBookAccess ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: !hasDigitalBookAccess ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
                            }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-yellow-800">Free Members</span>
                                {!hasDigitalBookAccess && <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">Your Plan</span>}
                            </div>
                            <p className="text-xl font-bold text-yellow-700">Read free preview only</p>
                        </div>

                        {/* Plus & Premium Members Price */}
                        <div
                            className="rounded-xl p-5 mb-5 text-center transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                border: hasDigitalBookAccess ? '2px solid #22c55e' : '1px solid #bbf7d0',
                                opacity: !hasDigitalBookAccess ? 0.55 : 1,
                                transform: hasDigitalBookAccess ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: hasDigitalBookAccess ? '0 4px 12px rgba(34,197,94,0.25)' : 'none',
                            }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-green-800">Plus & Premium Members</span>
                                {hasDigitalBookAccess && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Your Plan</span>}
                            </div>
                            <p className="text-3xl font-black text-green-600">FREE</p>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            {guideDistribution === 'Exclusive'
                                ? 'Exclusive website sales only. No Amazon or third-party distribution.'
                                : `Available via: ${guideDistribution}`}
                        </p>
                    </div>

                    {/* Project Status Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-900">Project Status</h3>
                        </div>

                        <div className="space-y-0">
                            {/* Length — dynamic from DB */}
                            <div className="flex items-center justify-between py-4 border-b border-gray-100">
                                <span className="text-sm text-gray-600 font-medium">Length</span>
                                <span
                                    className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: '#ede9fe', color: '#7c3aed' }}
                                >
                                    {guideTotalPages ? `~${guideTotalPages} Pages` : 'TBD'}
                                </span>
                            </div>

                            {/* Distribution — dynamic from DB */}
                            <div className="flex items-center justify-between py-4 border-b border-gray-100">
                                <span className="text-sm text-gray-600 font-medium">Distribution</span>
                                <span
                                    className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: '#fce7f3', color: '#db2777' }}
                                >
                                    {guideDistribution}
                                </span>
                            </div>

                            {/* Status — dynamic from DB */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-gray-600 font-medium">Status</span>
                                <span
                                    className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: statusColor.bg, color: statusColor.text }}
                                >
                                    {statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Join Waitlist Modal ─────────────────── */}
            {showWaitlistModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowWaitlistModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md p-8 relative"
                        style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowWaitlistModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
                            >
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Join the Sacred Guide Waitlist</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Be the first to know when our spiritual wellness e-book launches</p>

                        {/* Form */}
                        <div className="space-y-4 mb-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Your Name</label>
                                <input
                                    type="text"
                                    value={waitlistName}
                                    onChange={(e) => setWaitlistName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm bg-gray-50"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <label className="text-sm font-semibold text-gray-800">Email Address</label>
                                </div>
                                <input
                                    type="email"
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>✨</span>
                                <span>Early access notification</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>🎁</span>
                                <span>20% early-bird discount</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>💜</span>
                                <span>Exclusive preview content</span>
                            </div>
                        </div>

                        {/* Join Button */}
                        <button
                            disabled={isJoining}
                            onClick={async () => {
                                if (!waitlistName.trim() || !waitlistEmail.trim()) return;
                                setIsJoining(true);
                                try {
                                    const guideIdForWaitlist = sacredGuideId || '00000000-0000-0000-0000-000000000000';
                                    await apiService.joinSacredGuideWaitlist(guideIdForWaitlist, waitlistName.trim(), waitlistEmail.trim());
                                    setHasJoined(true);
                                    setShowWaitlistModal(false);
                                    setWaitlistName('');
                                    setWaitlistEmail('');
                                    setToastMsg('You have been added to the waitlist! 🎉');
                                } catch (err) {
                                    const msg = err?.message || '';
                                    if (msg.includes('409') || msg.toLowerCase().includes('already')) {
                                        setHasJoined(true);
                                        setShowWaitlistModal(false);
                                        setToastMsg('You are already on the waitlist!');
                                    } else {
                                        setToastMsg(msg || 'Failed to join waitlist. Please try again.');
                                    }
                                } finally {
                                    setIsJoining(false);
                                }
                            }}
                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {isJoining ? 'Joining...' : 'Join Waitlist'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Toast notification ─── */}
            {toastMsg && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
                >
                    {toastMsg}
                </div>
            )}
        </div>
    );
};

export default SacredGuidePage;
