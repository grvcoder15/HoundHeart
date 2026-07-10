import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const safeJson = (str) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
};

const fmtDate = (d) => new Date(d).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit',
});

const fmtShort = (d) => new Date(d).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});

/* ─── Metric badge component ──────────────────────────────────────────────── */
const MetricBadge = ({ label, value, unit = '', accent = 'violet' }) => {
  const accents = {
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
  };
  const cls = accents[accent] || accents.violet;
  if (value == null || value === '' || value === 'null') return null;
  return (
    <div className={`rounded-2xl border px-4 py-3 ${cls} flex flex-col gap-0.5`}>
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-60">{label}</span>
      <span className="text-lg font-bold leading-none">
        {typeof value === 'number' ? Number(value).toLocaleString() : String(value)}
        {unit && <span className="text-xs font-medium ml-1 opacity-70">{unit}</span>}
      </span>
    </div>
  );
};

/* ─── Vitals grid renderer ───────────────────────────────────────────────── */
const VitalsGrid = ({ data, label }) => {
  const parsed = safeJson(data);
  if (!parsed || typeof parsed !== 'object') {
    return (
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-sm text-slate-400 italic">{label ? `${label}: ` : ''}No data available</p>
      </div>
    );
  }
  const entries = Object.entries(parsed).filter(([, v]) => v != null && v !== '' && v !== 'null');
  if (!entries.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([key, val]) => {
        const friendlyKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        const isTimestamp = key.toLowerCase().includes('time') || key.toLowerCase().includes('utc') || key.toLowerCase().includes('at');
        const displayVal = isTimestamp
          ? (val ? new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
          : val;
        const accentMap = {
          heartrate: 'rose', heartRate: 'rose', avgHeartRate: 'rose',
          activityscore: 'emerald', activityScore: 'emerald', avgActivityScore: 'emerald',
          restscore: 'blue', restScore: 'blue', avgRestScore: 'blue',
          temperature: 'amber', avgTemperature: 'amber',
          respirationrate: 'violet', avgRespirationRate: 'violet',
        };
        const accent = accentMap[key] || accentMap[key.toLowerCase()] || 'violet';
        return <MetricBadge key={key} label={friendlyKey} value={displayVal} accent={accent} />;
      })}
    </div>
  );
};

/* ─── Section card ───────────────────────────────────────────────────────── */
const SectionCard = ({ icon, title, children, color = 'slate' }) => {
  const colors = {
    slate: { bg: 'bg-white', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-600' },
    emerald: { bg: 'bg-emerald-50/60', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
    violet: { bg: 'bg-violet-50/60', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-700' },
    amber: { bg: 'bg-amber-50/60', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700' },
    blue: { bg: 'bg-blue-50/60', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700' },
    rose: { bg: 'bg-rose-50/60', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700' },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} p-5 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
          {icon}
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
};

/* ─── Smart image component with fallback ───────────────────────────────── */
const SmartImage = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div className="h-44 w-full bg-slate-100 flex flex-col items-center justify-center rounded-2xl text-slate-400 gap-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="h-44 w-full object-cover rounded-2xl"
      onError={() => setError(true)}
    />
  );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const DetailedAnalysisPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getDetailedAnalysisHistory();
      setHistory(res?.data || []);
    } catch {
      toastService.error('Unable to load your report history right now.');
    } finally { setIsLoading(false); }
  };

  const createReport = async () => {
    setIsCreating(true);
    try {
      const res = await apiService.createDetailedAnalysis();
      const report = res?.data;
      if (report) {
        toastService.success('Your detailed analysis is ready!');
        setSelectedReport(report);
        await fetchHistory();
      }
    } catch (error) {
      toastService.error(error?.message || 'Something went wrong while creating the report.');
    } finally { setIsCreating(false); }
  };

  const selectReport = (report) => {
    if (selectedReport?.id === report.id) return;
    setSelectedReport(report);
  };

  /* ─── Report renderer ──────────────────────────────────────────────────── */
  const renderReportSection = () => {
    if (!selectedReport) {
      return (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-900 font-semibold text-lg">Select a report to view</p>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            Choose a past analysis from the sidebar or create a fresh one. Each report blends your dog's baseline,
            vitals, check-ins, and photos into one thoughtful AI-generated overview.
          </p>
          <button
            onClick={createReport}
            disabled={isCreating}
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Analysis
              </>
            )}
          </button>
        </div>
      );
    }

    const reportData = safeJson(selectedReport.reportJson);
    const baseline = safeJson(selectedReport.baselineSnapshotJson);
    const vitals = safeJson(selectedReport.latestVitalsSnapshotJson);
    const photoUrls = safeJson(selectedReport.photoUrlsJson);
    const photoEntries = photoUrls ? Object.entries(photoUrls) : [];

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-xl shadow-violet-200/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Detailed Analysis Report</span>
              </div>
              <h2 className="text-2xl font-extrabold">AI Wellness Overview</h2>
              <p className="text-white/60 text-sm mt-1">{fmtDate(selectedReport.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm ${
              selectedReport.status === 'Complete'
                ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                : 'bg-white/10 text-white/80 border border-white/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${selectedReport.status === 'Complete' ? 'bg-emerald-400' : 'bg-white/60'}`} />
              {selectedReport.status}
            </span>
          </div>
        </div>

        {/* AI Summary */}
        {reportData?.summary && (
          <SectionCard color="violet" title="Summary"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          >
            <p className="text-slate-700 text-sm leading-7">{reportData.summary}</p>
          </SectionCard>
        )}

        {/* Connection Highlights */}
        {reportData?.connectionHighlights && reportData.connectionHighlights.length > 0 && (
          <SectionCard color="emerald" title="Connection Highlights"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          >
            <ul className="space-y-2">
              {(Array.isArray(reportData.connectionHighlights) ? reportData.connectionHighlights : [reportData.connectionHighlights]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">{idx + 1}</span>
                  <span className="leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Dog Behavior Insights */}
        {reportData?.dogBehaviorInsights && (
          <SectionCard color="amber" title="Dog Behavior Insights"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            <p className="text-slate-700 text-sm leading-7">{reportData.dogBehaviorInsights}</p>
          </SectionCard>
        )}

        {/* Environment Insights */}
        {reportData?.environmentInsights && (
          <SectionCard color="blue" title="Environment Insights"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            <p className="text-slate-700 text-sm leading-7">{reportData.environmentInsights}</p>
          </SectionCard>
        )}

        {/* Recommendations */}
        {reportData?.combinedRecommendations && reportData.combinedRecommendations.length > 0 && (
          <SectionCard color="rose" title="Recommendations"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          >
            <ul className="space-y-3">
              {(Array.isArray(reportData.combinedRecommendations) ? reportData.combinedRecommendations : [reportData.combinedRecommendations]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Vitals Grid */}
        <SectionCard color="slate" title="Vitals Snapshot"
          icon={<svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        >
          {vitals && typeof vitals === 'object' ? (
            <VitalsGrid data={selectedReport.latestVitalsSnapshotJson} />
          ) : (
            <p className="text-slate-400 text-sm italic">No vitals data available for this report.</p>
          )}
        </SectionCard>

        {/* Baseline Grid */}
        <SectionCard color="slate" title="Baseline Snapshot"
          icon={<svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        >
          {baseline && typeof baseline === 'object' ? (
            <VitalsGrid data={selectedReport.baselineSnapshotJson} />
          ) : (
            <p className="text-slate-400 text-sm italic">No baseline data available for this report.</p>
          )}
        </SectionCard>

        {/* Photos */}
        {photoEntries.length > 0 && (
          <SectionCard color="slate" title={`Photos in This Report (${photoEntries.length})`}
            icon={<svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photoEntries.map(([label, url]) => (
                <div key={label} className="group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
                  <SmartImage src={url} alt={label} />
                  <div className="px-3 py-2 bg-white border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Vitals note */}
        {reportData?.vitalsAndBaselineNotes && (
          <SectionCard color="slate" title="Vitals & Baseline Notes"
            icon={<svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            <p className="text-slate-600 text-sm leading-7">{reportData.vitalsAndBaselineNotes}</p>
          </SectionCard>
        )}
      </div>
    );
  };

  /* ─── Page shell ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/40 py-10">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">

        {/* Hero header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600 mb-2">Detailed Analysis</p>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              A deeper, on-demand<br className="hidden sm:block" /> wellness report
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
              Combine your dog's baseline, wearable vitals, and the latest check-ins with photos
              for one thoughtful, non-clinical AI-generated analysis.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row shrink-0">
            <button
              onClick={createReport}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Analysis
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/wellness-check')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Wellness Check
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Left: Report */}
          <div>{renderReportSection()}</div>

          {/* Right: Sidebar */}
          <div className="space-y-5">
            {/* History */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Past Analyses
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(idx => (
                    <div key={idx} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">No analyses yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Create one to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectReport(item)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        selectedReport?.id === item.id
                          ? 'border-violet-400 bg-violet-50 shadow-sm shadow-violet-100'
                          : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            Report · {fmtShort(item.createdAt)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Complete' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {item.status}
                          </p>
                        </div>
                        <svg className={`w-4 h-4 shrink-0 transition-colors ${selectedReport?.id === item.id ? 'text-violet-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Why it helps */}
            <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Why This Report Helps
              </h2>
              <ul className="space-y-3">
                {[
                  'Connects dog & environment check-ins with baseline and vitals data.',
                  'Shows how photos, wearable vitals, and habits shape your dog\'s wellbeing.',
                  'Keeps tone supportive, non-clinical, and focused on comfort.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <svg className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
      `}</style>
    </div>
  );
};

export default DetailedAnalysisPage;
