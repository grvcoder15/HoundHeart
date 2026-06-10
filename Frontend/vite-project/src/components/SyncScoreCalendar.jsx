import React, { useState, useEffect } from 'react';

const SyncScoreCalendar = ({ userId }) => {
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load calendar data for the last 30 days
  useEffect(() => {
    fetchCalendarData();
  }, [userId]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/data/${userId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCalendarData(result.data);
        console.log('📅 Calendar data loaded:', result.data);
      } else {
        setError('Failed to load calendar data');
      }
    } catch (err) {
      console.error('❌ Calendar data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreDetails = async (date) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/score-details/${userId}/${date}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setScoreDetails(result.data);
        console.log('📊 Score details loaded:', result.data);
      }
    } catch (err) {
      console.error('❌ Score details fetch error:', err);
    }
  };

  const handleDateClick = (dayData) => {
    setSelectedDate(dayData.date);
    fetchScoreDetails(dayData.date);
  };

  const getScoreColor = (score) => {
    if (score >= 91) return '#10b981'; // Full Alignment - Green
    if (score >= 81) return '#22c55e'; // Strong Sync - Light Green
    if (score >= 71) return '#84cc16'; // Good Alignment - Lime
    if (score >= 61) return '#eab308'; // Mild Sync - Yellow
    if (score >= 51) return '#f59e0b'; // Neutral - Orange
    if (score >= 41) return '#f97316'; // Low Alignment - Dark Orange
    if (score >= 31) return '#ef4444'; // Elevated - Red
    if (score >= 21) return '#dc2626'; // Disconnected - Dark Red
    if (score >= 11) return '#991b1b'; // Severe Imbalance - Very Dark Red
    return '#7f1d1d'; // Critical Disconnect - Darkest Red
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '🔄';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading sync scores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Sync Score Calendar</h2>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
        
        {calendarData.map((dayData, index) => (
          <div
            key={index}
            onClick={() => handleDateClick(dayData)}
            className="relative border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
            style={{ backgroundColor: `${getScoreColor(dayData.score)}20` }}
          >
            <div className="text-sm font-medium">
              {new Date(dayData.date).getDate()}
            </div>
            
            <div 
              className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold mt-1"
              style={{ backgroundColor: getScoreColor(dayData.score) }}
            >
              {dayData.score}
            </div>
            
            <div className="text-xs mt-1">
              {getTrendIcon(dayData.trend)}
            </div>
            
            <div className="text-xs text-gray-600 mt-1 truncate">
              {dayData.scoreTitle}
            </div>
          </div>
        ))}
      </div>

      {/* Score Details Modal */}
      {scoreDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">
                {new Date(scoreDetails.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button 
                onClick={() => setScoreDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div 
                  className="w-12 h-12 rounded-full text-white text-lg font-bold flex items-center justify-center mr-4"
                  style={{ backgroundColor: getScoreColor(scoreDetails.score) }}
                >
                  {scoreDetails.score}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{scoreDetails.scoreTitle}</h4>
                  <p className="text-sm text-gray-600">
                    {getTrendIcon(scoreDetails.trend)} {scoreDetails.trend}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="font-semibold mb-2">Description:</h5>
              <p className="text-gray-700 leading-relaxed">{scoreDetails.scoreDescription}</p>
            </div>

            <div className="mb-6">
              <h5 className="font-semibold mb-2">Recommended Action:</h5>
              <p className="text-gray-700 leading-relaxed">{scoreDetails.scoreAction}</p>
            </div>

            {/* Detailed Metrics */}
            <div className="mb-6">
              <h5 className="font-semibold mb-3">Daily Metrics:</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Heart Rate:</strong> {scoreDetails.detailedMetrics.avgHeartRate.toFixed(1)} bpm
                  <br />
                  <span className="text-xs text-gray-500">
                    Range: {scoreDetails.detailedMetrics.minHeartRate.toFixed(1)} - {scoreDetails.detailedMetrics.maxHeartRate.toFixed(1)}
                  </span>
                </div>
                <div>
                  <strong>HRV:</strong> {scoreDetails.detailedMetrics.avgHRV.toFixed(1)} ms
                  <br />
                  <span className="text-xs text-gray-500">
                    Range: {scoreDetails.detailedMetrics.minHRV.toFixed(1)} - {scoreDetails.detailedMetrics.maxHRV.toFixed(1)}
                  </span>
                </div>
                <div>
                  <strong>Steps:</strong> {scoreDetails.detailedMetrics.totalSteps.toLocaleString()}
                </div>
                <div>
                  <strong>Sleep Score:</strong> {scoreDetails.detailedMetrics.avgSleepScore.toFixed(1)}/10
                </div>
                <div>
                  <strong>Stress Score:</strong> {scoreDetails.detailedMetrics.avgStressScore.toFixed(1)}/10
                </div>
                <div>
                  <strong>Data Points:</strong> {scoreDetails.detailedMetrics.dataPointsCount}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 italic">
              {scoreDetails.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold mb-2">Score Legend:</h5>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
            91-100: Full Alignment
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }}></div>
            81-90: Strong Sync
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#84cc16' }}></div>
            71-80: Good Alignment
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#eab308' }}></div>
            61-70: Mild Sync
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#f59e0b' }}></div>
            51-60: Neutral
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#f97316' }}></div>
            41-50: Low Alignment
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#ef4444' }}></div>
            31-40: Elevated
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#dc2626' }}></div>
            21-30: Disconnected
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#991b1b' }}></div>
            11-20: Severe Imbalance
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#7f1d1d' }}></div>
            0-10: Critical Disconnect
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncScoreCalendar;