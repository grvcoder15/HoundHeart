import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const ExpertMySessionsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchRequests();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMyExpertRequests();
      let data = res;
      if (res?.data) data = res.data;
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      toastService.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (roomUrl) => {
    // Navigate to the video call page and pass the meeting link
    navigate('/video-call', {
      state: {
        roomUrl: roomUrl,
        isExpertSession: true
      }
    });
  };

  const handleViewSlots = (requestId) => {
    navigate('/expert-session-slots/' + requestId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Expert Sessions</h1>
            <p className="text-gray-500 mt-1">Track your requests, slots, and upcoming video calls.</p>
          </div>
          <button
            onClick={() => navigate('/ask-expert')}
            className="text-purple-600 font-medium hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-lg"
          >
            Ask Expert
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No session requests</h3>
            <p className="text-gray-500 mb-6">You haven't requested any video sessions yet.</p>
            <button
              onClick={() => navigate('/expert-book-session')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Book a Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const createdDate = new Date(
                  request.createdAt.endsWith('Z') ? request.createdAt : request.createdAt + 'Z'
              );
              
              // We'll figure out what to display based on status
              const isPending = request.status === 'Pending';
              const isSlotsSent = request.status === 'SlotsSent';
              const isConfirmed = request.status === 'Scheduled' || request.status === 'Confirmed';
              const isCancelled = request.status === 'Cancelled';

              let scheduledDateObj = null;
              let diffMinutes = null;
              let isExpired = false;
              if (isConfirmed && request.slots?.length > 0) {
                 const selectedSlot = request.slots.find(s => s.isSelected);
                 if (selectedSlot) {
                     const raw = selectedSlot.proposedDateTime;
                     scheduledDateObj = new Date(raw.endsWith('Z') ? raw : raw + 'Z');
                     diffMinutes = (scheduledDateObj - currentTime) / 60000;
                     if (diffMinutes < -30) isExpired = true;
                 }
              }

              return (
                <div key={request.requestId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row items-center justify-between">
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto mb-4 md:mb-0">
                    
                    {/* Date Block */}
                    <div className="bg-purple-50 p-4 rounded-xl text-center min-w-[80px] self-start md:self-auto">
                      <div className="text-sm font-semibold text-purple-600 uppercase">
                        {isConfirmed && scheduledDateObj ? scheduledDateObj.toLocaleDateString('en-US', { month: 'short' }) : createdDate.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {isConfirmed && scheduledDateObj ? scheduledDateObj.getDate() : createdDate.getDate()}
                      </div>
                    </div>
                    
                    {/* Info Block */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {isExpired ? 'Expired Session' : isConfirmed ? 'Upcoming Video Session' : isCancelled ? 'Cancelled Session' : 'Session Request'}
                      </h3>
                      
                      {/* Sub Info */}
                      <div className="text-gray-500 text-sm mt-1">
                          <p className="mb-1"><span className="font-semibold text-gray-700">Problem:</span> {request.problemDescription}</p>
                          
                          {isConfirmed && scheduledDateObj ? (
                              <p className="flex items-center text-green-600 font-medium">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Scheduled for {scheduledDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                          ) : isCancelled ? (
                              <p className="text-red-600 font-medium">Reason: {request.cancellationReason || "No reason provided"}</p>
                          ) : (
                              <p><span className="font-semibold text-gray-700">Preferred Timing:</span> {request.preferredTiming}</p>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status Block */}
                  <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100 flex justify-end">
                    
                    {isPending && (
                        <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-lg font-medium text-sm border border-amber-200 flex items-center">
                            <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Waiting for Slots
                        </div>
                    )}

                    {isCancelled && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium text-sm border border-red-200 flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Cancelled
                        </div>
                    )}

                    {isSlotsSent && (
                        <button
                            onClick={() => handleViewSlots(request.requestId)}
                            className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm animate-pulse"
                        >
                            Select a Slot & Book
                        </button>
                    )}

                    {isConfirmed && scheduledDateObj ? (
                        (() => {
                            if (isExpired) {
                                return (
                                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium text-sm border border-red-200 flex items-center">
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Expired
                                    </div>
                                );
                            } else if (diffMinutes <= 5) {
                                return (
                                    <div className="flex flex-col items-end">
                                        <button
                                            onClick={() => navigate(`/expert-video-call?url=${encodeURIComponent(request.meetingLink || "dummy-link")}&scheduledTime=${scheduledDateObj.toISOString()}`)}
                                            className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center shadow-md animate-pulse mb-1.5"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Join Session
                                        </button>
                                        <span className="text-[11px] text-red-500 font-bold text-right max-w-[200px]">Please join promptly. Room link expires 30 mins after scheduled time.</span>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="bg-gray-100 text-gray-500 px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center text-sm">
                                        Join button will appear 5 mins before
                                    </div>
                                );
                            }
                        })()
                    ) : null}

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertMySessionsPage;
