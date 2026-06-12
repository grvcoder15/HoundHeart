import React from 'react';
import { useNavigate } from 'react-router-dom';

const OnlineStorePage = () => {
  const navigate = useNavigate();

  const storeCategories = [
    {
      id: 'books',
      name: 'Books',
      icon: '📚',
      description: 'HoundHeart digital and audio books',
    },
    {
      id: 'merchandise',
      name: 'Merchandise',
      icon: '👕',
      description: 'Official HoundHeart apparel and gear',
    },
    {
      id: 'memberships',
      name: 'Memberships',
      icon: '✨',
      description: 'Upgrade or manage your membership',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 flex items-center justify-center px-4 py-6">
      <div className="max-w-2xl w-full">

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">

          {/* Header */}
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span className="text-3xl">🛍️</span>
            <h1 className="text-2xl font-bold text-gray-900">HoundHeart Store</h1>
          </div>
          <p className="text-xs text-gray-500 mb-4">Coming Soon — Phase 2</p>

          {/* Coming Soon Badge */}
          <div className="mb-5">
            <span className="inline-block bg-gradient-to-r from-orange-400 to-red-500 text-white px-5 py-1.5 rounded-full font-bold text-xs shadow-md animate-pulse">
              🚀 COMING SOON — Phase 2 Feature
            </span>
          </div>

          {/* Store Categories */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {storeCategories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative group cursor-not-allowed hover:shadow-md transition-all duration-200"
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-200 flex items-center justify-center">
                  <span className="text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    COMING SOON
                  </span>
                </div>

                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500 mb-3 leading-snug">{category.description}</p>
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-5 border border-purple-100 text-left">
            <h2 className="text-sm font-bold text-gray-900 mb-3 text-center">What's Coming to the Store?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-purple-600 mb-2">📚 Books Section</h3>
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>✓ HoundHeart Digital Book</li>
                  <li>✓ HoundHeart Audio Book</li>
                  <li>✓ Exclusive guides &amp; resources</li>
                  <li>✓ Tier-based access</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-purple-600 mb-2">🛍️ Merchandise &amp; More</h3>
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>✓ Official HoundHeart T-shirts</li>
                  <li>✓ Premium member exclusives</li>
                  <li>✓ Secure checkout</li>
                  <li>✓ Order tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-gray-700 text-xs">
              🕐 Expected to launch in <span className="font-bold">Phase 2 (Q3 2024)</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">Next Phase Feature Under Development</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-7 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105"
          >
            ← Go Back
          </button>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">We're building amazing features to enhance your HoundHeart™ experience. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
};

export default OnlineStorePage;
