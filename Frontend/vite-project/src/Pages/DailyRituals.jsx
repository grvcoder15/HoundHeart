import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';


// Simple Icon mapping based on IconType string
const getIcon = (type) => {
    switch (type) {
        case 'Sun': return '☀️';
        case 'Heart': return '❤️';
        case 'Battery': return '🔋';
        case 'Walk': return '🚶';
        case 'Moon': return '🌙';
        case 'Star': return '✨';
        default: return '✨';
    }
};

const DailyRituals = ({ userId, onScoreUpdate }) => {
    const [rituals, setRituals] = useState([]);
    const [dailyBonusEarned, setDailyBonusEarned] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchRituals();
        }
    }, [userId]);

    const fetchRituals = async () => {
        try {
            setLoading(true);
            const data = await apiService.getRitualSuggestions(userId);
            // Expected: { dailyBonusEarned: boolean, rituals: [...] }
            if (data) {
                setRituals(data.rituals || []);
                setDailyBonusEarned(data.dailyBonusEarned || false);
            }
        } catch (error) {
            console.error('Failed to fetch rituals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (ritualId, isCompleted) => {
        if (isCompleted || processingId) return; // Prevent double click or unchecking for now if not supported

        try {
            setProcessingId(ritualId);

            // Optimistic Update
            setRituals(prev => prev.map(r =>
                r.id === ritualId ? { ...r, isCompleted: true } : r
            ));

            const response = await apiService.completeRitual(userId, ritualId);

            if (response && response.bonusAwarded) {
                setDailyBonusEarned(true);
                // Refresh global score in parent
                if (onScoreUpdate) onScoreUpdate();
            }
        }

        catch (error) {
            console.error('Error completing ritual', error);
            // Revert optimistic update on failure
            setRituals(prev => prev.map(r =>
                r.id === ritualId ? { ...r, isCompleted: false } : r
            ));
        } finally {
            setProcessingId(null);
        }
    };

    const categories = ['Morning', 'Afternoon', 'Evening'];
    const completedCount = rituals.filter(r => r.isCompleted).length;
    const totalCount = rituals.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (loading) return <div className="p-4 text-center">Loading rituals...</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Daily Rituals</h2>
                    <p className="text-sm text-gray-500">Cultivate connection through small acts</p>
                </div>
                {!dailyBonusEarned ? (
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                        Complete any ritual for +2 pts
                    </div>
                ) : (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ✨ Daily Bonus Unlocked!
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Today's Spiritual Practice</span>
                    <span>{completedCount}/{totalCount} Completed</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="space-y-6">
                {categories.map(category => {
                    const categoryRituals = rituals.filter(r => r.category === category);
                    if (categoryRituals.length === 0) return null;

                    return (
                        <div key={category}>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{category}</h3>
                            <div className="space-y-3">
                                {categoryRituals.map(ritual => (
                                    <div
                                        key={ritual.id}
                                        className={`flex items-start p-3 rounded-lg border transition-all ${ritual.isCompleted
                                            ? 'bg-gray-50 border-gray-100 opacity-75'
                                            : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex-shrink-0 mt-0.5 mr-3">
                                            <button
                                                onClick={() => handleComplete(ritual.id, ritual.isCompleted)}
                                                disabled={ritual.isCompleted || processingId === ritual.id}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ritual.isCompleted
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-indigo-400 text-transparent'
                                                    }`}
                                            >
                                                ✓
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm font-medium ${ritual.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                    {getIcon(ritual.iconType)} {ritual.title}
                                                </h4>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                                                    {ritual.duration}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 ${ritual.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {ritual.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyRituals;
