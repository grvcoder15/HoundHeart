import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const normalizeJsonValue = (value) => {
  if (value == null) return null;
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const DetailedAnalysisPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getDetailedAnalysisHistory();
      setHistory(res?.data || []);
    } catch (error) {
      console.error('Failed to load detailed analysis history', error);
      toastService.error('Unable to load your report history right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const createReport = async () => {
    setIsCreating(true);
    try {
      const res = await apiService.createDetailedAnalysis();
      const report = res?.data;
      if (report) {
        toastService.success('Detailed Analysis created successfully.');
        setSelectedReport(report);
        await fetchHistory();
      }
    } catch (error) {
      console.error('Failed to create detailed analysis', error);
      toastService.error('Something went wrong while creating the report.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectReport = async (report) => {
    if (selectedReport?.id === report.id) return;
    setSelectedReport(report);
  };

  const renderReportSection = () => {
    if (!selectedReport) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-gray-600 text-sm max-w-xl mx-auto">Choose a past detailed analysis from your history or create a fresh report. Each report brings together your dog's baseline, wearable vitals, the most recent dog check-in, the latest environment check-in, and available photos.</p>
        </div>
      );
    }

    let reportData = null;
    try {
      reportData = typeof selectedReport.reportJson === 'string'
        ? JSON.parse(selectedReport.reportJson)
        : selectedReport.reportJson;
    } catch {
      reportData = null;
    }

    const photoUrls = (() => {
      try {
        return selectedReport.photoUrlsJson ? JSON.parse(selectedReport.photoUrlsJson) : null;
      } catch {
        return null;
      }
    })();

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Detailed Analysis Report</h2>
              <p className="text-sm text-slate-500">Created {new Date(selectedReport.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">{selectedReport.status}</span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Baseline Snapshot</h3>
              <pre className="whitespace-pre-wrap text-sm text-slate-700">{normalizeJsonValue(selectedReport.baselineSnapshotJson)}</pre>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Latest Vitals Snapshot</h3>
              <pre className="whitespace-pre-wrap text-sm text-slate-700">{normalizeJsonValue(selectedReport.latestVitalsSnapshotJson)}</pre>
            </div>
          </div>

          {photoUrls && Object.keys(photoUrls).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Photos included in this report</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(photoUrls).map(([label, url]) => (
                  <div key={label} className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={url} alt={label} className="h-44 w-full object-cover" />
                    <div className="p-3 bg-white">
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">AI Insights</h3>
            {reportData ? (
              <div className="space-y-4">
                {reportData.summary && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Summary</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{normalizeJsonValue(reportData.summary)}</p>
                  </div>
                )}
                {reportData.connectionHighlights && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Connection Highlights</h4>
                    <ul className="list-disc pl-5 text-slate-700 text-sm space-y-1">
                      {Array.isArray(reportData.connectionHighlights)
                        ? reportData.connectionHighlights.map((item, idx) => <li key={idx}>{normalizeJsonValue(item)}</li>)
                        : <li>{normalizeJsonValue(reportData.connectionHighlights)}</li>}
                    </ul>
                  </div>
                )}
                {reportData.vitalsAndBaselineNotes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Vitals + Baseline Notes</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{normalizeJsonValue(reportData.vitalsAndBaselineNotes)}</p>
                  </div>
                )}
                {reportData.environmentInsights && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Environment Insights</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{normalizeJsonValue(reportData.environmentInsights)}</p>
                  </div>
                )}
                {reportData.dogBehaviorInsights && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Dog Behavior Insights</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{normalizeJsonValue(reportData.dogBehaviorInsights)}</p>
                  </div>
                )}
                {reportData.combinedRecommendations && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Recommendations</h4>
                    <ul className="list-disc pl-5 text-slate-700 text-sm space-y-1">
                      {Array.isArray(reportData.combinedRecommendations)
                        ? reportData.combinedRecommendations.map((item, idx) => <li key={idx}>{normalizeJsonValue(item)}</li>)
                        : <li>{normalizeJsonValue(reportData.combinedRecommendations)}</li>}
                    </ul>
                  </div>
                )}
                {reportData.photosReferenced && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Photos Referenced</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{normalizeJsonValue(reportData.photosReferenced)}</p>
                  </div>
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700">{selectedReport.reportJson || 'No report data available.'}</pre>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-indigo-50/40 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Detailed Analysis</p>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900">A deeper, on-demand wellness report</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Combine your dog's baseline, wearable vitals, and the latest check-ins with photos for one thoughtful, non-clinical AI-generated analysis.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={createReport}
              disabled={isCreating}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isCreating ? 'Creating report…' : 'Create new analysis'}
            </button>
            <button
              onClick={() => navigate('/wellness-check')}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Wellness Check
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            {renderReportSection()}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Past Detailed Analyses</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(idx => (
                    <div key={idx} className="h-20 rounded-3xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-500">You don't have any detailed analysis reports yet. Create one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectReport(item)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${selectedReport?.id === item.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">Report created {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-sm text-slate-500 mt-1">Status: {item.status}</p>
                        </div>
                        <span className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600">View</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Why this report helps</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                <li>Connect recent dog and environment check-ins with baseline and vitals context.</li>
                <li>See how photos, wearable vitals, and habits together shape your dog's wellbeing.</li>
                <li>Keep the tone supportive, non-clinical, and focused on comfort and presence.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisPage;
