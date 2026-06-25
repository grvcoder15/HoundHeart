import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PreRegisterModal from '../components/PreRegisterModal';
import apiService from '../services/apiService';

// ─── Static fallback course list (shown until API populates DB) ───────────────
const PLACEHOLDER_COURSES = [
  { id: 'c1', title: 'Understanding Your Dog\'s Emotional World', description: 'Deep dive into canine emotions, stress signals, and how your dog processes their world. Build empathy and awareness that transforms your relationship.', price: 79, isFreeWithPlus: false, status: 'Standby' },
  { id: 'c2', title: 'Foundations of Human-Dog Co-Regulation', description: 'Learn the science behind biometric synchrony and how to use breathwork, body language, and calm routines to co-regulate with your dog.', price: 89, isFreeWithPlus: true, status: 'Standby' },
  { id: 'c3', title: 'Stress Detection & Early Intervention', description: 'Master reading early stress cues before they escalate. Practical protocols for decompression, safe spaces, and stress-proofing your dog\'s environment.', price: 69, isFreeWithPlus: false, status: 'Future Development' },
  { id: 'c4', title: 'Nutrition & Gut Health for Dogs', description: 'Evidence-based guidance on canine nutrition, gut microbiome health, and how diet directly impacts mood, energy, and behaviour.', price: 59, isFreeWithPlus: false, status: 'Future Development' },
  { id: 'c5', title: 'Building Resilience in Anxious Dogs', description: 'A structured programme to help dogs with separation anxiety, noise sensitivity, and chronic stress develop true confidence and resilience.', price: 99, isFreeWithPlus: true, status: 'Standby' },
  { id: 'c6', title: 'The Language of Play', description: 'Understand the neuroscience of play and learn to use intentional play sessions to strengthen your bond, reduce reactivity, and improve wellbeing.', price: 49, isFreeWithPlus: false, status: 'Future Development' },
  { id: 'c7', title: 'Sleep, Rest & Recovery for Dogs', description: 'Optimise your dog\'s sleep quality, rest cycles, and recovery periods. A rested dog is a regulated dog — learn how to make it happen.', price: 59, isFreeWithPlus: false, status: 'Future Development' },
  { id: 'c8', title: 'Grief, Loss & Supporting Your Dog Through Change', description: 'Navigate life transitions, loss of a companion, rehoming trauma, and major environmental changes with compassion and practical strategies.', price: 69, isFreeWithPlus: false, status: 'Standby' },
  { id: 'c9', title: 'Senior Dog Wellbeing & End-of-Life Care', description: 'Holistic support for your ageing dog\'s physical comfort, cognitive health, and emotional wellbeing — including compassionate end-of-life planning.', price: 79, isFreeWithPlus: true, status: 'Future Development' },
  { id: 'c10', title: 'Raising a Puppy with Intention', description: 'A science-backed approach to socialisation, bonding, routine-setting, and co-regulation from day one — the foundation for a lifetime of connection.', price: 79, isFreeWithPlus: false, status: 'Standby' },
];

const CHALLENGE_COURSE = {
  id: 'challenge-30',
  title: '30-Day HoundHeart Bond Challenge',
  description: 'A structured 30-day programme designed to measurably strengthen the bond between you and your dog using daily micro-practices, biometric check-ins, and guided reflections. Each day builds on the last — creating lasting habits, deeper connection, and real, trackable change.',
  price: 49,
  isFreeWithPlus: true,
  status: 'Standby',
  highlights: [
    '30 daily guided activities',
    'In-app biometric tracking',
    'Progress milestones & badges',
    'Exclusive community support group',
    'Certificate of completion',
  ],
};

// ─── Status badge colours ────────────────────────────────────────────────────
const STATUS_STYLE = {
  Standby:            'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Future Development': 'bg-blue-100 text-blue-700 border-blue-200',
  comingsoon:         'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const statusLabel = (s) => {
  const key = String(s || '').toLowerCase();
  if (key === 'comingsoon') return 'Standby';
  return s || 'Coming Soon';
};

// ─── CourseCard ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, joined, joining, onPreRegister }) => {
  const discountedPrice = Math.round(course.price * 0.8);
  const status = course.status || 'Coming Soon';

  return (
    <article className="bg-white rounded-2xl shadow-md border border-purple-100 p-5 flex flex-col hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-gray-900 leading-snug">{course.title}</h2>
        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {statusLabel(status)}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{course.description}</p>

      {/* Pricing */}
      <div className="mt-auto">
        <div className="mb-3">
          {course.isFreeWithPlus && (
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 mb-2">
              Free with Plus
            </span>
          )}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-purple-700">${discountedPrice}</span>
            <span className="text-sm text-gray-400 line-through">${course.price}</span>
            <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">20% off if pre-registered</span>
          </div>
        </div>

        {/* 20% discount notice */}
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Pre-register now to lock in your <span className="font-semibold text-purple-600">20% early-access discount</span>. Full price applies after launch.
        </p>

        <button
          onClick={() => onPreRegister(course.id)}
          disabled={joined || joining}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            joined
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : joining
              ? 'bg-purple-200 text-purple-600 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 shadow-sm'
          }`}
        >
          {joined ? '✓ Pre-Registered — 20% Discount Locked' : joining ? 'Processing...' : '🎟 Pre-Register Now'}
        </button>
      </div>
    </article>
  );
};


// ─── Main Page ───────────────────────────────────────────────────────────────
const CoursesPage = () => {
  const navigate = useNavigate();
  const [apiCourses, setApiCourses] = useState([]);
  const [waitlistMap, setWaitlistMap] = useState({});
  const [joiningMap, setJoiningMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreRegister, setShowPreRegister] = useState(false);

  const handleUpgrade = () => navigate('/subscription');

  // Merge API courses with placeholders: API data takes priority
  const displayCourses = useMemo(() => {
    if (apiCourses.length >= 10) {
      return [...apiCourses].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).slice(0, 10);
    }
    // Supplement with placeholders to always show 10
    const apiIds = new Set(apiCourses.map((c) => c.id));
    const extras = PLACEHOLDER_COURSES.filter((p) => !apiIds.has(p.id));
    return [...apiCourses, ...extras].slice(0, 10);
  }, [apiCourses]);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        const res = await apiService.getCourses();
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setApiCourses(items);

        const statusPairs = await Promise.all(
          items.map(async (course) => {
            try {
              const statusRes = await apiService.getCourseWaitlistStatus(course.id);
              return [course.id, !!(statusRes?.data?.joined)];
            } catch {
              return [course.id, false];
            }
          })
        );
        setWaitlistMap(Object.fromEntries(statusPairs));
      } catch (error) {
        setErrorMsg(error.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const onPreRegister = async (courseId) => {
    // For placeholder courses (no real API id), open the global pre-register modal
    if (courseId.startsWith('c') && !apiCourses.find(c => c.id === courseId)) {
      setShowPreRegister(true);
      return;
    }
    if (waitlistMap[courseId] || joiningMap[courseId]) return;
    setJoiningMap((prev) => ({ ...prev, [courseId]: true }));
    try {
      await apiService.joinCourseWaitlist(courseId);
      setWaitlistMap((prev) => ({ ...prev, [courseId]: true }));
    } catch (error) {
      // Fallback: open modal
      setShowPreRegister(true);
    } finally {
      setJoiningMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar currentPage="courses" onUpgrade={handleUpgrade} />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Explore our upcoming HoundHeart learning tracks — all currently in development.
          </p>
        </div>

        {/* 20% Discount Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">🎟 Early Access Offer</p>
            <h2 className="text-xl font-bold leading-tight">Pre-Register Now & Save 20%</h2>
            <p className="text-sm opacity-90 mt-1">
              Users who pre-register today will receive a <strong>20% discount</strong> when courses launch. Those who wait will pay the full price.
            </p>
          </div>
          <button
            onClick={() => setShowPreRegister(true)}
            className="shrink-0 bg-white text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-md text-sm whitespace-nowrap"
          >
            🎟 Pre-Register Now
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── 10 Courses Grid ── */}
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">📚 Courses</h2>
              <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">10 Courses</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
              {displayCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  joined={!!waitlistMap[course.id]}
                  joining={!!joiningMap[course.id]}
                  onPreRegister={onPreRegister}
                />
              ))}
            </div>

            {/* ── 30-Day Challenge — Separate Section ── */}
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">🏆 30-Day Challenge</h2>
              <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">Special Programme</span>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6 flex flex-col md:flex-row gap-6">
              {/* Left: Info */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl shrink-0">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{CHALLENGE_COURSE.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${STATUS_STYLE[CHALLENGE_COURSE.status]}`}>
                      {CHALLENGE_COURSE.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{CHALLENGE_COURSE.description}</p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHALLENGE_COURSE.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-500 font-bold">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Pricing & CTA */}
              <div className="md:w-64 shrink-0 flex flex-col justify-between bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div>
                  <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 mb-3">
                    Free with Plus
                  </span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold text-purple-700">${Math.round(CHALLENGE_COURSE.price * 0.8)}</span>
                    <span className="text-sm text-gray-400 line-through">${CHALLENGE_COURSE.price}</span>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">20% off if pre-registered</span>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    Pre-register now to lock in your <span className="font-semibold text-purple-600">20% early-access discount</span>. Full price after launch.
                  </p>
                </div>
                <button
                  onClick={() => setShowPreRegister(true)}
                  className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 transition-all shadow-md"
                >
                  🎟 Pre-Register Now
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Pre-Register Modal */}
      <PreRegisterModal isOpen={showPreRegister} onClose={() => setShowPreRegister(false)} />
    </div>
  );
};

export default CoursesPage;
