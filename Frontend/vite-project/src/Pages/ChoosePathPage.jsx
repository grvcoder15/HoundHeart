import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChoosePathPage = () => {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState('');

  const handlePathSelection = (path) => {
    setSelectedPath(path);
    console.log('Selected path:', path);
    // Navigate to profile setup page after path selection
    navigate('/profile-setup');
  };

  const handleBack = () => {
    navigate('/signup');
  };

  const pathOptions = [
    {
      id: 'pet-parent',
      title: 'Pet Parent',
      description: 'I want to deepen my bond with my dog through spiritual practices and energy work.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'text-green-500'
    },
    {
      id: 'energy-healer',
      title: 'Energy Healer',
      description: 'I\'m a practitioner who wants to help others connect with their pets spiritually.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} cx="12" cy="12" r="5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      color: 'text-orange-500'
    },
    {
      id: 'both',
      title: 'Both',
      description: 'I\'m both a pet parent and energy practitioner, seeking to help others while deepening my own bond.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 via-purple-200 to-purple-600 p-4">
      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Choose Your Path
          </h1>
          <p className="text-gray-600 text-sm">
            How do you connect with the spiritual world?
          </p>
        </div>

        {/* Path Options */}
        <div className="space-y-4 mb-8">
          {pathOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handlePathSelection(option.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedPath === option.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`${option.color} flex-shrink-0`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Link */}
        <div className="text-left">
          <button
            onClick={handleBack}
            className="text-blue-500 hover:text-blue-600 text-sm transition-colors cursor-pointer flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChoosePathPage;
