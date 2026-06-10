import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleBeginJourney = () => {
    console.log('Begin Journey clicked');
    // Navigate to profile setup page
    navigate('/profile-setup');
  };

  const steps = [
    {
      number: 1,
      text: 'Choose your path',
      bgColor: 'bg-teal-400',
      textColor: 'text-teal-400'
    },
    {
      number: 2,
      text: 'Create your profiles',
      bgColor: 'bg-orange-400',
      textColor: 'text-orange-400'
    },
    {
      number: 3,
      text: 'Learn the basics',
      bgColor: 'bg-blue-400',
      textColor: 'text-blue-400'
    },
    {
      number: 4,
      text: '14-Day Baseline Calibration',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 via-purple-200 to-purple-600 p-4">
      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <div className="flex space-x-1">
              <div className="w-2 h-4 bg-white rounded-full opacity-90"></div>
              <div className="w-2 h-4 bg-white rounded-full opacity-90"></div>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to HoundHeart™
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Let's create your spiritual profile and connect you with your canine companion on a deeper energetic level.
          </p>
        </div>

        {/* Steps Section */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {/* Step Number Icon */}
              <div className={`w-8 h-8 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-semibold text-sm">{step.number}</span>
              </div>
              {/* Step Text */}
              <span className="text-gray-800 font-medium">{step.text}</span>
            </div>
          ))}
        </div>

        {/* Begin Journey Button */}
        <button
          onClick={handleBeginJourney}
          className="w-full bg-gradient-to-r from-purple-400 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
