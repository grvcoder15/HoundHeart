import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SacredGuideReaderPage = ({ guide: initialGuide, hasFullAccess }) => {
    const navigate = useNavigate();
    const pdfContainerRef = useRef(null);
    const [showPricingModal, setShowPricingModal] = useState(false);

    // Helper to construct full PDF URL if path is relative
    const getFullPdfUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        return `${baseUrl}${path}`;
    };

    // Guide data from API (no hardcoding)
    const [guideData, setGuideData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [accessDenied, setAccessDenied] = useState(false);
    const [loading, setLoading] = useState(true);

    // PDF viewer state
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [pdfError, setPdfError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // ─── Fetch full guide details with access guard ───
    useEffect(() => {
        const fetchDetails = async () => {
            const guideId = initialGuide?.sacredGuideId || initialGuide?.SacredGuideId;
            if (!guideId) { setLoading(false); return; }

            try {
                const res = await apiService.getSacredGuideDetails(guideId);
                const data = res?.data;
                if (data) {
                    setGuideData(data);

                    // Parse chapters from JSON string
                    if (data.chapters) {
                        try {
                            const parsed = JSON.parse(data.chapters);
                            if (Array.isArray(parsed)) setChapters(parsed);
                        } catch (_) { }
                    }
                }
            } catch (err) {
                const msg = err?.message || '';
                if (msg.includes('403') || msg.toLowerCase().includes('access denied')) {
                    setAccessDenied(true);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [initialGuide]);

    // If access denied → redirect to sacred-guide (Coming Soon page)
    useEffect(() => {
        if (accessDenied) {
            navigate('/sacred-guide', { replace: true });
        }
    }, [accessDenied, navigate]);

    // ─── Derived values from API data (ZERO hardcoding) ───
    const guideTitle = guideData?.title || guideData?.Title || '';
    const guideDescription = guideData?.description || guideData?.Description || '';
    const guidePdfUrl = guideData?.pdfUrl || guideData?.PdfUrl || '';
    const dbTotalPages = guideData?.totalPages || guideData?.TotalPages || 0;
    const guideId = guideData?.sacredGuideId || guideData?.SacredGuideId || '';

    // Use DB totalPages for calculations, fallback to PDF-detected pages
    const totalPages = dbTotalPages > 0 ? dbTotalPages : numPages;
    const pagesRemaining = Math.max(0, totalPages - currentPage);
    const completionPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    // ─── Free User Restriction Logic ───
    // Use previewPages from API if available, otherwise default to 2 pages
    const apiPreviewPages = guideData?.previewPages || guideData?.PreviewPages || null;
    const maxFreePages = hasFullAccess ? Infinity : (apiPreviewPages ?? 2);
    const isLocked = !hasFullAccess && currentPage > maxFreePages;

    // ─── PDF handlers ───
    const onDocumentLoadSuccess = ({ numPages: pages }) => {
        setNumPages(pages);
        setPdfLoading(false);
    };

    const onDocumentLoadError = (error) => {
        setPdfError('Failed to load PDF. Please try again later.');
        setPdfLoading(false);
        console.error('PDF load error:', error);
    };

    const goToPage = useCallback((page) => {
        const maxPage = totalPages > 0 ? totalPages : numPages;
        
        if (page >= 1 && page <= maxPage) {
            if (!hasFullAccess && page > maxFreePages) {
                // Allow them to click next on the 10% limit to trigger the locked screen
                setCurrentPage(maxFreePages + 1);
            } else {
                setCurrentPage(page);
            }
        }
    }, [totalPages, numPages, hasFullAccess, maxFreePages]);

    const zoomIn = () => setScale((s) => Math.min(s + 0.15, 2.5));
    const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));
    const zoomReset = () => setScale(1.0);

    // ─── Fullscreen toggle ───
    const toggleFullscreen = () => {
        if (!pdfContainerRef.current) return;
        if (!document.fullscreenElement) {
            pdfContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // ─── Secure download ───
    const handleDownload = async () => {
        if (!guideId || isDownloading) return;
        setIsDownloading(true);
        try {
            const fileName = `${guideTitle?.replace(/\s+/g, '_') || 'Sacred_Guide'}.pdf`;
            await apiService.downloadSacredGuide(guideId, fileName);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    // ─── Keyboard navigation ───
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
            if (e.key === 'ArrowRight') goToPage(currentPage + 1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentPage, goToPage]);

    // ─── Loading state ───
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar currentPage="sacred-guide" onUpgrade={() => setShowPricingModal(true)} />

            {/* Sub-header bar */}
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#8b5cf6' }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <h1 className="text-lg font-bold text-gray-900">{guideTitle}</h1>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                    {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    )}
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
            </div>

            {/* Main content area */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
                <div className="flex gap-6">

                    {/* ─── Left: PDF Viewer ─── */}
                    <div className="flex-1 min-w-0" ref={pdfContainerRef}>
                        {/* Toolbar */}
                        <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-5 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            {/* Page nav */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm text-gray-700 font-medium">
                                    Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages || '—'}</span>
                                </span>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="flex-1 mx-6">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${completionPercent}%`,
                                            background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Zoom controls */}
                            <div className="flex items-center gap-1.5">
                                <button onClick={zoomOut} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Zoom Out">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                                </button>
                                <button onClick={zoomReset} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors" title="Reset Zoom">
                                    {Math.round(scale * 100)}%
                                </button>
                                <button onClick={zoomIn} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Zoom In">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                                </button>
                                <div className="w-px h-5 bg-gray-200 mx-1" />
                                <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* PDF Canvas */}
                        <div
                            className="bg-white border border-gray-100 rounded-b-2xl overflow-auto flex justify-center"
                            style={{
                                minHeight: '600px',
                                maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 280px)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                background: isFullscreen ? '#1a1a2e' : undefined,
                            }}
                        >
                            {pdfError ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                    <p className="text-sm">{pdfError}</p>
                                </div>
                            ) : guidePdfUrl ? (
                                guidePdfUrl.toLowerCase().endsWith('.pdf') ? (
                                    <Document
                                        file={getFullPdfUrl(guidePdfUrl)}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                                                <p className="text-sm">Loading PDF...</p>
                                            </div>
                                        }
                                    >
                                        {isLocked ? (
                                            <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden shadow-md">
                                                {/* Blurred background page illusion */}
                                                <div className="absolute inset-0 opacity-40 blur-sm pointer-events-none p-8 flex flex-col gap-4">
                                                    <div className="w-full h-8 bg-gray-600 rounded"></div>
                                                    <div className="w-3/4 h-8 bg-gray-600 rounded"></div>
                                                    <div className="w-full h-4 bg-gray-600 rounded mt-8"></div>
                                                    <div className="w-full h-4 bg-gray-600 rounded"></div>
                                                    <div className="w-5/6 h-4 bg-gray-600 rounded"></div>
                                                    <div className="w-full h-4 bg-gray-600 rounded"></div>
                                                </div>
                                                
                                                {/* Lock Prompt Modal */}
                                                <div className="relative z-10 bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl mx-4">
                                                    <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Keep Reading</h3>
                                                    <p className="text-gray-600 mb-6 font-medium">
                                                        You've reached the end of the free preview. ({maxFreePages} pages). 
                                                        Upgrade to Premium to unlock the full {totalPages}-page Sacred Guide and continue your journey!
                                                    </p>
                                                    <button
                                                        onClick={() => setShowPricingModal(true)}
                                                        className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
                                                        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
                                                    >
                                                        Upgrade to Premium
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Page
                                                pageNumber={currentPage}
                                                scale={scale}
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                                className="shadow-md"
                                            />
                                        )}
                                    </Document>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50 rounded-lg m-4 border-2 border-dashed border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">Document Reader Unavailable</h3>
                                        <p className="text-gray-600 mb-6 max-w-md text-sm leading-relaxed">
                                            The uploaded file is a Word Document (DOCX), which our inline reader cannot display page-by-page.
                                            To read this guide, please download the file directly to your device.
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full font-bold shadow-md transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            {isDownloading ? 'Downloading...' : 'Download Document'}
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                                    <p className="text-sm">Loading...</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom page navigation */}
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Previous Page
                            </button>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                            >
                                Next Page
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* ─── Right Sidebar ─── */}
                    <div className="w-72 flex-shrink-0 space-y-5">

                        {/* Reading Progress Card */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <h3 className="text-base font-bold text-gray-900 mb-4">Reading Progress</h3>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Completion</span>
                                <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>{completionPercent}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${completionPercent}%`,
                                        background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                                    }}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Current Page</span>
                                    <span className="font-semibold text-gray-900">{currentPage}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Pages Remaining</span>
                                    <span className="font-semibold text-gray-900">{pagesRemaining}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Pages</span>
                                    <span className="font-semibold text-gray-900">{totalPages || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Navigation Card */}
                        {chapters.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <h3 className="text-base font-bold text-gray-900 mb-4">Quick Navigation</h3>
                                <div className="space-y-1">
                                    {chapters.map((ch, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToPage(ch.page)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${currentPage >= ch.page && (i === chapters.length - 1 || currentPage < chapters[i + 1]?.page)
                                                ? 'font-semibold text-purple-700 bg-purple-50'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{ch.label}</span>
                                            {!hasFullAccess && ch.page > maxFreePages && (
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* About Sacred Guide Card */}
                        <div
                            className="rounded-2xl p-5 border"
                            style={{
                                background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                                borderColor: '#fce7f3',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-base">💜</span>
                                <h3 className="text-base font-bold text-gray-900">About {guideTitle}</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {guideDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Compact Upgrade Popup Modal ─── */}
            {showPricingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Gradient header with ⭐ emoji */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">⭐</span>
                                    <h3 className="text-white font-bold text-lg">Upgrade to Premium</h3>
                                </div>
                                <button
                                    onClick={() => setShowPricingModal(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Message */}
                            <div>
                                <p className="text-gray-700 text-center font-medium">
                                    You've reached the end of the free preview. Continue reading the complete Sacred Guide with a Premium subscription!
                                </p>
                            </div>

                            {/* Features List */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-700">Read all Sacred Guides unlimited</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-700">Full app access & premium features</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-700">Priority community access</span>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-gray-50 px-4 py-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start from</p>
                                <p className="text-2xl font-bold text-gray-900">$19.99/mo</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPricingModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Not Now
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPricingModal(false);
                                        navigate('/subscription');
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    Upgrade Now →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SacredGuideReaderPage;
