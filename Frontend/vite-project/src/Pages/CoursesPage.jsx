import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [waitlistMap, setWaitlistMap] = useState({});
  const [joiningMap, setJoiningMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpgrade = () => navigate('/subscription');

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [courses]
  );

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await apiService.getCourses();
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setCourses(items);

        const statusPairs = await Promise.all(
          items.map(async (course) => {
            try {
              const statusRes = await apiService.getCourseWaitlistStatus(course.id);
              const joined = !!(statusRes?.data?.joined);
              return [course.id, joined];
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

  const onNotifyMe = async (courseId) => {
    if (waitlistMap[courseId] || joiningMap[courseId]) return;

    setJoiningMap((prev) => ({ ...prev, [courseId]: true }));
    try {
      await apiService.joinCourseWaitlist(courseId);
      setWaitlistMap((prev) => ({ ...prev, [courseId]: true }));
    } catch (error) {
      setErrorMsg(error.message || 'Could not join waitlist.');
    } finally {
      setJoiningMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar currentPage="courses" onUpgrade={handleUpgrade} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Explore upcoming HoundHeart learning tracks. Join the waitlist to be notified first.
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedCourses.map((course) => {
              const joined = !!waitlistMap[course.id];
              const joining = !!joiningMap[course.id];
              const isComingSoon = String(course.status || '').toLowerCase() === 'comingsoon';
              return (
                <article key={course.id} className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h2>
                    {isComingSoon && (
                      <span className="shrink-0 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full border border-yellow-200">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-4">{course.description}</p>

                  <div className="mt-auto">
                    <div className="mb-4">
                      {course.isFreeWithPlus ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                            Free with Plus
                          </span>
                          <span className="text-sm font-semibold text-gray-800">${Number(course.price || 0).toFixed(0)} standalone</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-purple-700">${Number(course.price || 0).toFixed(0)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => onNotifyMe(course.id)}
                      disabled={joined || joining}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        joined
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90'
                      }`}
                    >
                      {joined ? "✓ You're on the list" : joining ? 'Joining...' : 'Notify Me'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesPage;
