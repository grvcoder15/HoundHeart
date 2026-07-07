import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

// ─────────────────────────────────────────────────────────────
// Question Definitions
// ─────────────────────────────────────────────────────────────
const DOG_QUESTIONS = [
  { id: 'q1',  text: 'Has your dog seemed more relaxed than usual today?', type: 'yesno' },
  { id: 'q2',  text: 'Did your dog greet you with their usual energy when you saw them today?', type: 'yesno' },
  { id: 'q3',  text: 'Has your dog been seeking more closeness than usual — leaning, following you, wanting to be near you?', type: 'yesno' },
  { id: 'q4',  text: 'Did your dog seem playful and engaged today?', type: 'yesno' },
  { id: 'q5',  text: "Has your dog's appetite seemed normal today?", type: 'yesno' },
  { id: 'q6',  text: 'Did your dog sleep or rest well last night, as far as you noticed?', type: 'yesno' },
  { id: 'q7',  text: 'Has anything changed in your routine this week (new schedule, travel, guests, etc.)?', type: 'yesno' },
  { id: 'q8',  text: 'Did you take a moment today to just sit and breathe calmly with your dog?', type: 'yesno' },
  { id: 'q9',  text: 'Did your dog settle, sigh, or visibly relax when you were near them?', type: 'yesno' },
  { id: 'q10', text: 'Has your dog shown any signs of stress today — pacing, panting, hiding, excessive barking?', type: 'yesno' },
  { id: 'q11', text: 'Anything on your mind about your dog today?', type: 'text', optional: true, placeholder: 'Share anything you\'d like to note...' },
];

const ENV_QUESTIONS = [
  { id: 'q1',  text: 'Which space are you checking in about?', type: 'choice', options: ['Living room', 'Bedroom', 'Backyard', 'Walking area', 'Other'] },
  { id: 'q2',  text: 'Do you feel this space is easy to move through right now?', type: 'yesno' },
  { id: 'q3',  text: "Is there any clutter or mess that might be in your dog's way?", type: 'yesno' },
  { id: 'q4',  text: 'Has anything changed in this space recently — new furniture, items added or removed?', type: 'yesno' },
  { id: 'q5',  text: 'Does your dog have a clear, comfortable spot to rest in this space?', type: 'yesno' },
  { id: 'q6',  text: 'Is there a clear path your dog can walk without obstruction?', type: 'yesno' },
  { id: 'q7',  text: 'Does this space feel calm to you, or a bit chaotic?', type: 'choice', options: ['Calm', 'Mixed', 'Chaotic', 'Other'] },
  { id: 'q8',  text: 'Is there enough room for you and your dog to move freely together here?', type: 'yesno' },
  { id: 'q9',  text: 'Is the lighting in this space comfortable (not too harsh, not too dark)?', type: 'yesno' },
  { id: 'q10', text: 'Is this space generally quiet, or is there a lot of background noise?', type: 'choice', options: ['Quiet', 'Some noise', 'Noisy', 'Other'] },
  { id: 'q11', text: "Anything about this space you'd like to pay attention to?", type: 'text', optional: true, placeholder: "Describe anything specific you'd like noted..." },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const QuestionLabel = ({ number, text, optional, onToggleUpload, isUploadActive, photoPreview }) => (
  <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex-1 flex items-start gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <span className="text-base font-semibold text-gray-900 leading-snug">{text}</span>
        {optional && <span className="ml-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full align-middle">Optional</span>}
      </div>
    </div>
    <div className="flex items-center gap-3 pl-10 sm:pl-0">
      {/* Thumbnail indicator when a photo is uploaded but the upload box is closed */}
      {photoPreview && !isUploadActive && (
        <div 
          className="w-9 h-9 rounded-md overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:border-violet-400 transition-colors flex-shrink-0"
          onClick={onToggleUpload}
          title="Click to view/edit photo"
        >
          <img src={photoPreview} alt="Uploaded" className="w-full h-full object-cover" />
        </div>
      )}
      <button 
        type="button" 
        onClick={onToggleUpload}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
          isUploadActive 
            ? 'bg-violet-600 text-white shadow-sm' 
            : photoPreview 
              ? 'text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100' 
              : 'text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300'
        }`}
        title={photoPreview ? "Edit attached photo" : "Attach a photo for this question"}
      >
        <span>{photoPreview ? '📷 Edit' : '📎 Attach'}</span>
      </button>
    </div>
  </div>
);

const YesNoButtons = ({ value, onChange }) => (
  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
        value === 'Yes'
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-[1.03]'
          : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 bg-white'
      }`}
    >
      <span>{value === 'Yes' ? '✓' : '○'}</span>
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
        value === 'No'
          ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200 scale-[1.03]'
          : 'border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 bg-white'
      }`}
    >
      <span>{value === 'No' ? '✗' : '○'}</span>
      No
    </button>
  </div>
);

const CHOICE_COLORS = [
  { selected: 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-200', hover: 'hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50' },
  { selected: 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-200',         hover: 'hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50' },
  { selected: 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200',   hover: 'hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50' },
  { selected: 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-200',      hover: 'hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50' },
  { selected: 'border-fuchsia-500 bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-200', hover: 'hover:border-fuchsia-300 hover:text-fuchsia-600 hover:bg-fuchsia-50' },
];

const ChoiceButtons = ({ options, value, onChange }) => {
  const isOtherSelected = value === 'Other' || (value && value.startsWith('Other:'));
  const otherText = isOtherSelected && value.startsWith('Other:') ? value.replace('Other:', '').trim() : '';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {options.map((opt, i) => {
        const color = CHOICE_COLORS[i % CHOICE_COLORS.length];
        const isSelected = opt === 'Other' ? isOtherSelected : value === opt;
        return (
          <React.Fragment key={opt}>
            <button
              type="button"
              onClick={() => onChange(opt === 'Other' ? 'Other' : opt)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                isSelected
                  ? `${color.selected} scale-[1.05]`
                  : `border-gray-200 text-gray-500 bg-white ${color.hover}`
              }`}
            >
              {isSelected && <span>✓</span>}
              {opt}
            </button>
            {opt === 'Other' && isSelected && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherText}
                onChange={(e) => onChange('Other: ' + e.target.value)}
                className="flex-1 min-w-[200px] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 shadow-sm transition-all"
                autoFocus
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


const InlinePhotoUpload = ({ preview, onChange }) => (
  <div className="mt-4">
    <label className="relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden group">
      {preview ? (
        <div className="absolute inset-0 w-full h-full">
          <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-medium">☁️ Change Photo</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
          <span className="text-4xl">🖼️</span>
          <p className="text-sm"><span className="font-semibold text-gray-600">Click to upload</span> a photo</p>
          <p className="text-xs">PNG, JPG up to 10MB</p>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={onChange}
      />
    </label>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Result Cards
// ─────────────────────────────────────────────────────────────
const ResultCard = ({ insight, detailedOverview, progressInsight, onReset, navigate, photosPreview, answersJson, checkinType }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const renderList = (title, items) => {
    if (!items?.length) return null;
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-700 text-sm">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    );
  };

  const renderText = (title, text) => {
    if (!text) return null;
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
        <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
      </div>
    );
  };

  const parseJson = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const parsedAnswers = parseJson(answersJson);
  const normalizeText = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(' ');
    return typeof value === 'string' ? value : '';
  };

  const isDogCheck = checkinType === 'DogCheckIn';
  const mainTitle = isDogCheck ? "Today's Reflection" : "How Your Space Feels";
  const mainSubtext = isDogCheck
    ? 'A warm, caring summary of how your dog seemed today.'
    : 'A calm look at the environment and how it connects with your dog’s day.';

  const buildDogNarrative = () => {
    const lines = [];
    if (insight?.overallSummary) lines.push(normalizeText(insight.overallSummary));
    const extra = [insight?.overallMood, insight?.physicalCondition, insight?.behaviorAnalysis]
      .map(normalizeText)
      .filter(Boolean)
      .join(' ');
    if (extra) lines.push(extra);
    return lines.length > 0 ? (
      <div className="space-y-4">
        {lines.map((line, idx) => (
          <p key={idx} className="text-slate-700 text-sm leading-relaxed">{line}</p>
        ))}
      </div>
    ) : null;
  };

  const buildEnvironmentNarrative = () => {
    const pieces = [
      normalizeText(insight?.flowObservations),
      normalizeText(insight?.comfortObservations),
      normalizeText(insight?.bodyLanguage),
      normalizeText(insight?.engagementLevel),
      normalizeText(insight?.overallTone || insight?.overallImpression),
    ].filter(Boolean);

    return pieces.length > 0 ? (
      <div className="space-y-4">
        {pieces.map((piece, idx) => (
          <p key={idx} className="text-slate-700 text-sm leading-relaxed">{piece}</p>
        ))}
      </div>
    ) : null;
  };

  const renderGuidance = () => {
    if (insight?.recommendedHoundHeartActivity) {
      return (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="min-w-[38px] h-10 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center text-lg">✨</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Recommended HoundHeart activity</p>
              <p className="text-slate-700 text-sm leading-relaxed">{normalizeText(insight.recommendedHoundHeartActivity)}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/rituals')}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-400 transition-colors"
          >
            Try this activity
          </button>
        </div>
      );
    }

    if (Array.isArray(insight?.recommendations) && insight.recommendations.length > 0) {
      const topRecommendations = insight.recommendations.slice(0, 2);
      return (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900 mb-3">Thoughtful guidance</p>
          <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
            {topRecommendations.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderAnswerReview = () => {
    if (!parsedAnswers || Object.keys(parsedAnswers).length === 0) return null;
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAnswers(prev => !prev)}
          className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-900"
        >
          <span>View my answers</span>
          <span className="text-slate-500">{showAnswers ? 'Hide' : 'Show'}</span>
        </button>
        {showAnswers && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(parsedAnswers).map(([question, answer]) => (
              <div key={question} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-900 font-medium mb-1 text-sm">{question}</p>
                <p className="text-slate-700 text-sm leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-4 sm:px-6">
      {insight && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100/70 px-4 py-2 text-sm font-semibold text-emerald-700">
                <span>{isDogCheck ? '🐾' : '🏡'}</span>
                <span>{mainTitle}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600 max-w-2xl">{mainSubtext}</p>
            </div>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← New Check-in
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {isDogCheck ? buildDogNarrative() : buildEnvironmentNarrative()}
            {renderGuidance()}
            {renderAnswerReview()}
          </div>
          <p className="mt-6 text-xs text-slate-400">This reflection is a friendly observation based on your check-in responses.</p>
        </div>
      )}

      {detailedOverview && (
        <div className="rounded-[32px] border border-amber-100 bg-amber-50/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-amber-800 mb-4">
            <span>✨</span>
            <span>Deeper Insight</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">How your dog and space are connected</h3>
          <div className="space-y-4 text-sm text-slate-700">
            {detailedOverview.connectionObservations && (
              <p>{normalizeText(detailedOverview.connectionObservations)}</p>
            )}
            {detailedOverview.overallSummary && (
              <p>{normalizeText(detailedOverview.overallSummary)}</p>
            )}
            {detailedOverview.recommendedHoundHeartActivity && (
              <div className="rounded-3xl border border-amber-200 bg-white p-4">
                <p className="font-semibold text-slate-900 mb-2">Recommended Activity</p>
                <p className="text-slate-700 text-sm leading-relaxed">{normalizeText(detailedOverview.recommendedHoundHeartActivity)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {progressInsight && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-600">📈</span> Since Your Last Check-in
          </h3>
          {renderList('Changes Observed', progressInsight.changesObserved)}
          {renderText('Positive Progress', progressInsight.positiveProgress)}
          {renderText('Areas to Continue Focus On', progressInsight.areasToContinueFocusOn)}
          {renderText('Overall Impression', progressInsight.overallImpression)}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          ← Start Another Check-in
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
const WellnessCheckPage = () => {
  const navigate = useNavigate();

  // Access
  const [membershipTier, setMembershipTier] = useState('free');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [fitbarkConnected, setFitbarkConnected] = useState(false);

  // Flow
  const [flowState, setFlowState] = useState('selection'); // selection | form | analyzing | result
  const [checkinType, setCheckinType] = useState(null);

  // Form state
  const [answers, setAnswers] = useState({});
  const [photosPreview, setPhotosPreview] = useState({});
  const [photosBase64, setPhotosBase64] = useState({});
  const [activeUploadQId, setActiveUploadQId] = useState(null);
  const [historyImagesPreview, setHistoryImagesPreview] = useState(null);

  // Results
  const [result, setResult] = useState(null);
  const [mainInsight, setMainInsight] = useState(null);
  const [detailedOverview, setDetailedOverview] = useState(null);
  const [progressInsight, setProgressInsight] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  useEffect(() => {
    checkAccess();
    fetchHistory();
    checkDeviceConnections();
  }, []);

  const checkDeviceConnections = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.userId || user.UserId;
      
      const [fitbitRes, fitbarkRes] = await Promise.all([
        apiService.getFitbitStatus(userId).catch(() => null),
        apiService.getFitBarkStatus().catch(() => null)
      ]);
      
      setFitbitConnected(!!(fitbitRes?.success || fitbitRes?.data?.connected));
      setFitbarkConnected(!!(fitbarkRes?.success || fitbarkRes?.data?.connected));
    } catch (e) {
      console.error("Failed to fetch device status", e);
    }
  };

  // Refresh progress insight from history polling after async submission
  useEffect(() => {
    if (result && result.isAsync) {
      const interval = setInterval(async () => {
        try {
          const res = await apiService.getWellnessCheckById(result.id);
          const check = res?.data;
          if (check?.status === 'Complete') {
            clearInterval(interval);
            updateInsights(check);
            setFlowState('result');
          }
        } catch (e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [result]);

  const checkAccess = async () => {
    try {
      const response = await apiService.makeRequest('/Subscription/current', { method: 'GET' });
      const subData = response?.data ?? response;
      const status = (subData?.status || subData?.Status || '').toLowerCase();
      const planName = (subData?.planName || subData?.PlanName || '').toLowerCase();
      if ((status === 'active' || status === 'trialing') && (planName.includes('plus') || planName.includes('premium'))) {
        setMembershipTier(planName.includes('premium') ? 'premium' : 'plus');
      } else {
        setMembershipTier('free');
      }
    } catch {
      setMembershipTier('free');
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiService.getWellnessCheckHistory();
      setHistory(res?.data || []);
    } catch (e) {
      console.error('Error fetching wellness history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startCheckin = (type) => {
    setCheckinType(type);
    setAnswers({});
    setPhotosPreview({});
    setPhotosBase64({});
    setActiveUploadQId(null);
    setHistoryImagesPreview(null);
    setResult(null);
    setMainInsight(null);
    setDetailedOverview(null);
    setProgressInsight(null);
    setFlowState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFlow = () => {
    setFlowState('selection');
    setResult(null);
    setMainInsight(null);
    setDetailedOverview(null);
    setProgressInsight(null);
    setHistoryImagesPreview(null);
    setCurrentPage(1);
    fetchHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHistoryTitle = (item) => {
    if (!item.aiResponseJson) return item.type === 'DogCheckIn' ? 'Dog Check-in' : 'Environment & Flow';
    try {
      const parsed = JSON.parse(item.aiResponseJson);
      if (item.type === 'DogCheckIn') {
        return parsed.overallMood || parsed.overallSummary || 'Dog Check-in';
      } else {
        return parsed.overallTone || 'Environment & Flow';
      }
    } catch {
      return item.type === 'DogCheckIn' ? 'Dog Check-in' : 'Environment & Flow';
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    setIsDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    try {
      await apiService.deleteWellnessCheck(confirmDeleteId);
      setHistory(prev => prev.filter(h => h.id !== confirmDeleteId));
      // Reset to page 1 if the current page is now empty
      const remaining = history.filter(h => h.id !== confirmDeleteId);
      const maxPage = Math.ceil(remaining.length / itemsPerPage);
      if (currentPage > maxPage) setCurrentPage(Math.max(1, maxPage));
      toastService.success('Check-in deleted.');
    } catch {
      toastService.error('Failed to delete. Please try again.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const questions = checkinType === 'DogCheckIn' ? DOG_QUESTIONS : ENV_QUESTIONS;

  const setAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handlePhotoUpload = (e, qId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toastService.error('File size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotosBase64(prev => ({ ...prev, [qId]: reader.result }));
      setPhotosPreview(prev => ({ ...prev, [qId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };


  const updateInsights = (check) => {
    try {
      const parsedMain = JSON.parse(check.aiResponseJson);
      setMainInsight(parsedMain);
    } catch { setMainInsight(null); }

    try {
      const parsedDetail = check.detailedOverviewJson ? JSON.parse(check.detailedOverviewJson) : null;
      setDetailedOverview(parsedDetail);
    } catch { setDetailedOverview(null); }

    try {
      const parsedProg = check.progressInsightJson ? JSON.parse(check.progressInsightJson) : null;
      setProgressInsight(parsedProg);
    } catch { setProgressInsight(null); }
  };

  const handleSubmit = async () => {
    setFlowState('analyzing');

    try {
      // Map question IDs to actual text for better AI context
      const mappedAnswers = {};
      const mappedPhotos = {};

      Object.keys(answers).forEach(qId => {
        const qDef = questions.find(q => q.id === qId);
        if (qDef) {
          mappedAnswers[qDef.text] = answers[qId];
          if (photosBase64 && photosBase64[qId]) {
            mappedPhotos[qDef.text] = photosBase64[qId];
          }
        } else {
          mappedAnswers[qId] = answers[qId];
          if (photosBase64 && photosBase64[qId]) {
            mappedPhotos[qId] = photosBase64[qId];
          }
        }
      });

      const payload = {
        Type: checkinType,
        Answers: mappedAnswers,
        PhotosBase64: mappedPhotos,
      };

      const res = await apiService.submitWellnessCheck(payload);
      const check = res?.data;

      if (check?.isAsync) {
        setResult(check); // triggers polling useEffect
        toastService.success("We're reviewing your check-in — we'll notify you when ready.");
        setFlowState('analyzing'); // stay on analyzing spinner
      } else {
        setResult(check);
        updateInsights(check);
        fetchHistory();
        setFlowState('result');
        toastService.success('Check-in complete!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      toastService.error(error?.message || 'Failed to submit check-in. Please try again.');
      setFlowState('form');
    }
  };

  const viewHistoryItem = (item) => {
    setCheckinType(item.type);
    setResult(item);
    const parsed = {
      aiResponseJson: item.aiResponseJson,
      detailedOverviewJson: item.detailedOverviewJson,
      progressInsightJson: item.progressInsightJson
    };
    updateInsights(parsed);
    try {
      setHistoryImagesPreview(item.photoUrlsJson ? JSON.parse(item.photoUrlsJson) : null);
    } catch {
      setHistoryImagesPreview(null);
    }
    setFlowState('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Access guards ───────────────────────────────────────────
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen pt-4 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Checking access...</p>
      </div>
    );
  }

  if (membershipTier === 'free') {
    return (
      <div className="min-h-screen pt-24 px-6 pb-12 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🌿</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unlock Wellness Check</h2>
          <p className="text-gray-600 mb-8">
            Access guided check-in forms and automatic AI-powered progress tracking. Upgrade to Plus or Premium to get started.
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-md"
          >
            Upgrade to Plus or Premium
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className={flowState === 'form' ? 'max-w-4xl mx-auto px-6 pt-8 pb-16' : 'w-full'}>

        {/* ── SELECTION ───────────────────────────────────── */}
        {flowState === 'selection' && (
          <>
            {/* ── HERO BANNER ── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 w-full px-8 py-16 md:py-20">
              {/* Decorative blobs */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl" />
              <div className="absolute top-10 left-1/2 w-40 h-40 bg-indigo-300/10 rounded-full blur-2xl" />

              <div className="max-w-7xl mx-auto px-4">
                {/* Device Status Banner */}
                <div className="mb-8">
                  {fitbitConnected && fitbarkConnected ? (
                    <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 text-green-200 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Fitbit & FitBark connected — AI enriched analysis active
                    </div>
                  ) : fitbarkConnected ? (
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 text-blue-200 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> FitBark connected — connect Fitbit for full analysis
                    </div>
                  ) : fitbitConnected ? (
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 text-blue-200 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> Fitbit connected — connect FitBark for better results
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-200 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                      <span className="w-2 h-2 bg-amber-400 rounded-full" /> Connect Fitbit & FitBark for AI-enriched check-ins
                    </div>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                  <div className="max-w-xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                      Wellness
                      <span className="block bg-gradient-to-r from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Check-In</span>
                    </h1>
                    <p className="mt-4 text-lg text-purple-200 leading-relaxed">
                      Monitor your dog's daily health and your shared living environment with AI-powered insights tailored just for you.
                    </p>
                  </div>

                  {/* Check-in cards inside hero */}
                  <div className="flex flex-col md:flex-row flex-wrap gap-5 w-full lg:w-auto">
                    <button
                      onClick={() => startCheckin('DogCheckIn')}
                      className="group relative flex-1 min-w-[220px] lg:w-60 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-md rounded-2xl p-7 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-900/40"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-400 to-purple-500 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        🐾
                      </div>
                      <p className="text-xl font-bold text-white mb-1">Dog Check-in</p>
                      <p className="text-sm text-purple-200">How is your dog doing today?</p>
                      <div className="absolute bottom-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <span className="text-white text-sm">→</span>
                      </div>
                    </button>

                    <button
                      onClick={() => startCheckin('EnvironmentFlow')}
                      className="group relative flex-1 min-w-[220px] lg:w-60 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-md rounded-2xl p-7 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-900/40"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        🏡
                      </div>
                      <p className="text-xl font-bold text-white mb-1">Environment Check-in</p>
                      <p className="text-sm text-purple-200">Reflect on your shared living space today.</p>
                      <div className="absolute bottom-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <span className="text-white text-sm">→</span>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/wellness-check/detailed-analysis')}
                      className="group relative flex-1 min-w-[220px] lg:w-60 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-md rounded-2xl p-7 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-emerald-900/40"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        🔍
                      </div>
                      <p className="text-xl font-bold text-white mb-1">Detailed Analysis</p>
                      <p className="text-sm text-purple-200">Get a deeper report with baseline, vitals, check-ins, and photos.</p>
                      <div className="absolute bottom-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <span className="text-white text-sm">→</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── HISTORY SECTION ── */}
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-base">🕒</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Past Wellness Checks</h2>
                  {history.length > 0 && (
                    <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {history.length} records
                    </span>
                  )}
                </div>
                {history.length > 0 && (
                  <span className="text-sm text-gray-400">Showing {Math.min((currentPage - 1) * itemsPerPage + 1, history.length)}–{Math.min(currentPage * itemsPerPage, history.length)} of {history.length}</span>
                )}
              </div>

              {isLoadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-xl" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-5">
                    <span className="text-4xl">🐾</span>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg mb-1">No check-ins yet</p>
                  <p className="text-gray-400 text-sm">Start your first wellness check above!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => {
                      const isDog = item.type === 'DogCheckIn';
                      return (
                        <div
                          key={item.id}
                          onClick={() => viewHistoryItem(item)}
                          className="group bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 cursor-pointer hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300 hover:-translate-y-0.5"
                        >
                          {/* Thumbnail */}
                          <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm ${
                            isDog
                              ? 'bg-gradient-to-br from-fuchsia-100 to-purple-100'
                              : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                          }`}>
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{isDog ? '🐾' : '🏡'}</span>
                            )}
                          </div>

                        {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                                {getHistoryTitle(item)}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {item.status === 'Pending' && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Processing
                                  </span>
                                )}
                                {item.progressInsightJson && (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                    📈 Progress
                                  </span>
                                )}
                                {/* Delete button */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                                  disabled={isDeletingId === item.id}
                                  title="Delete check-in"
                                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 border border-transparent hover:border-red-200 transition-all duration-200"
                                >
                                  {isDeletingId === item.id ? (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isDog
                                  ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200'
                                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                {isDog ? '🐾 Dog Check-in' : '🏡 Environment'}
                              </span>
                              {item.environmentReferenceCreatedAt && isDog && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🌿 Refers to Environment Check-in on {new Date(item.environmentReferenceCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' at '}
                              {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {history.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(history.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 text-sm font-semibold rounded-xl transition-all ${
                              page === currentPage
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                : 'text-gray-500 hover:bg-violet-50 hover:text-violet-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(history.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── DELETE CONFIRMATION MODAL ───────────────────────────── */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmDeleteId(null)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Check-in?</h3>
              <p className="text-sm text-gray-500 mb-6">This will permanently remove this wellness record. This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FORM ────────────────────────────────────────── */}
        {flowState === 'form' && (
          <div>
            {/* Back + Form title */}
            <button
              onClick={resetFlow}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
            >
              ← Back
            </button>

            {/* Form title — left-aligned, no card */}
            <div className="mb-8 pb-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {checkinType === 'DogCheckIn' ? 'Dog Check-in' : 'Environment & Flow Check-in'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Answer a few quick questions about your {checkinType === 'DogCheckIn' ? 'dog' : 'space'} today.
              </p>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-300">
                  <QuestionLabel 
                    number={index + 1} 
                    text={q.text} 
                    optional={q.optional} 
                    isUploadActive={activeUploadQId === q.id}
                    onToggleUpload={() => setActiveUploadQId(prev => prev === q.id ? null : q.id)}
                    photoPreview={photosPreview[q.id]}
                  />

                  <div className="pl-0 sm:pl-10 mt-2">
                    {q.type === 'yesno' && (
                      <YesNoButtons value={answers[q.id]} onChange={(val) => setAnswer(q.id, val)} />
                    )}

                    {q.type === 'choice' && (
                      <ChoiceButtons options={q.options} value={answers[q.id]} onChange={(val) => setAnswer(q.id, val)} />
                    )}

                    {q.type === 'text' && (
                      <textarea
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 resize-none transition-all bg-gray-50/50 hover:bg-white"
                      />
                    )}

                    {/* Inline Photo Upload for this specific question */}
                    {activeUploadQId === q.id && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <InlinePhotoUpload preview={photosPreview[q.id]} onChange={(e) => handlePhotoUpload(e, q.id)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-base font-bold rounded-2xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Submit Check-in ✨
              </button>
            </div>
          </div>
        )}

        {/* ── ANALYZING ───────────────────────────────────── */}
        {flowState === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <span className="text-6xl inline-block mb-6">🌿</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing your check-in...</h2>
            <p className="text-gray-400 text-sm">Our wellness AI is reviewing your answers. This may take a moment.</p>
          </div>
        )}

        {/* ── RESULT ──────────────────────────────────────── */}
        {flowState === 'result' && (
          <ResultCard
            insight={mainInsight}
            detailedOverview={detailedOverview}
            progressInsight={progressInsight}
            onReset={resetFlow}
            navigate={navigate}
            photosPreview={historyImagesPreview || photosBase64}
            answersJson={result?.AnswersJson || result?.answersJson}
            checkinType={checkinType}
          />
        )}

      </div>
    </div>
  );
};

export default WellnessCheckPage;
