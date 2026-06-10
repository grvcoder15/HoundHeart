import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoonPage = ({ 
  title = 'Coming Soon', 
  description = 'This feature is coming in the next phase',
  iconEmoji = '✨',
  features = [],
  expectedPhase = 'Phase 2',
  tierRequired = null
}) => {
  const navigate = useNavigate();

  const getTierBadgeColor = (tier) => {
    switch(tier) {
      case 'premium':
        return 'from-yellow-400 to-amber-500';
      case 'plus':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-blue-400 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center transform transition-all duration-300 hover:shadow-3xl hover:scale-105">
          
          {/* Icon Emoji */}
          {iconEmoji && (
            <div className="mb-6 text-6xl animate-bounce">
              {iconEmoji}
            </div>
          )}

          {/* Coming Soon Badge */}
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
              🚀 COMING SOON
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">{description}</p>

          {/* Tier Badge */}
          {tierRequired && (
            <div className="mb-8 inline-block">
              <span className={`bg-gradient-to-r ${getTierBadgeColor(tierRequired)} text-white px-4 py-2 rounded-lg font-semibold text-sm`}>
                {tierRequired === 'premium' ? '⭐ Premium Feature' : '✨ Plus Feature'}
              </span>
            </div>
          )}

          {/* Features List */}
          {features.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 mb-8 border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What's Coming:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <span className="text-2xl">✓</span>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Phase */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-gray-700">
              <span className="font-bold">Expected Release:</span> {expectedPhase}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Next Phase Feature Under Development
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            ← Go Back
          </button>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            We're building amazing features to enhance your HoundHeart™ experience. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
