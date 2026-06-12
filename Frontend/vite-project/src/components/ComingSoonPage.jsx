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
      case 'premium': return 'from-yellow-400 to-amber-500';
      case 'plus':    return 'from-purple-400 to-pink-500';
      default:        return 'from-blue-400 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 flex items-center justify-center px-4 py-6">
      <div className="max-w-lg w-full">

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">

          {/* Icon */}
          {iconEmoji && (
            <div className="mb-3 text-5xl animate-bounce">{iconEmoji}</div>
          )}

          {/* Coming Soon Badge */}
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-5 py-1.5 rounded-full font-bold text-xs shadow-md animate-pulse">
              🚀 COMING SOON
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>

          {/* Tier Badge */}
          {tierRequired && (
            <div className="mb-4 inline-block">
              <span className={`bg-gradient-to-r ${getTierBadgeColor(tierRequired)} text-white px-4 py-1.5 rounded-lg font-semibold text-xs`}>
                {tierRequired === 'premium' ? '⭐ Premium Feature' : '✨ Plus Feature'}
              </span>
            </div>
          )}

          {/* Features List */}
          {features.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 mb-4 border border-purple-100 text-left">
              <h3 className="text-base font-bold text-gray-900 mb-3 text-center">What's Coming:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-purple-500 font-bold mt-0.5">✓</span>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Phase */}
          <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-gray-700 text-sm">
              <span className="font-bold">Expected Release:</span> {expectedPhase}
            </p>
            <p className="text-xs text-gray-500 mt-1">Next Phase Feature Under Development</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-7 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105"
          >
            ← Go Back
          </button>
        </div>

        {/* Bottom Info */}
        <div className="mt-4 text-center text-gray-500">
          <p className="text-xs">We're building amazing features to enhance your HoundHeart™ experience. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
