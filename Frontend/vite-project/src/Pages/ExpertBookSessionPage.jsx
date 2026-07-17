import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const ExpertBookSessionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    problemDescription: '',
    preferredTiming: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Try to auto-fill name from auth data
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = apiService.parseJwtPayload(token);
        if (payload && payload.unique_name) {
          setFormData(prev => ({ ...prev, name: payload.unique_name }));
        }
      }
    } catch (err) {
      console.warn("Could not parse name from token", err);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.problemDescription.trim() || !formData.preferredTiming) {
      toastService.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      await apiService.createExpertSessionRequest({
        problemDescription: formData.problemDescription,
        preferredTiming: formData.preferredTiming
      });
      setSuccess(true);
    } catch (err) {
      toastService.error(err.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-6">
            Our expert will review your request and share available time slots soon. We will notify you when slots are ready.
          </p>
          <button
            onClick={() => navigate('/ask-expert')}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Book an Expert Video Session</h1>
          <p className="text-gray-600 mt-2">
            Schedule a 15-minute 1-on-1 video call with our spiritual wellness expert.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              placeholder="Name auto-filled"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What would you like to discuss? *</label>
            <textarea
              name="problemDescription"
              value={formData.problemDescription}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Please briefly describe what you need help with..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Timing *</label>
            <select
              name="preferredTiming"
              value={formData.preferredTiming}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Select a preferred time of day</option>
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
              <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
              <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
              <option value="Flexible">Flexible / Anytime</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/ask-expert')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-purple-600 text-white rounded-lg font-medium transition ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Request Slots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpertBookSessionPage;
