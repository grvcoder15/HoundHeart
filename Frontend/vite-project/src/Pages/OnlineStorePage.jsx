import React, { useState } from 'react';

const OnlineStorePage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const storeCategories = [
    {
      id: 'books',
      name: 'Books',
      icon: '📚',
      description: 'HoundHeart digital and audio books',
      comingSoon: true
    },
    {
      id: 'merchandise',
      name: 'Merchandise',
      icon: '👕',
      description: 'Official HoundHeart apparel and gear',
      comingSoon: true
    },
    {
      id: 'memberships',
      name: 'Memberships',
      icon: '✨',
      description: 'Upgrade or manage your membership',
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-4xl">🛍️</span>
            <h1 className="text-4xl font-bold text-gray-900">HoundHeart Store</h1>
          </div>
          <p className="text-gray-600">Coming Soon - Phase 2</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Coming Soon Badge */}
        <div className="mb-12 text-center">
          <span className="inline-block bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">
            🚀 COMING SOON - Phase 2 Feature
          </span>
        </div>

        {/* Store Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {storeCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-not-allowed group relative overflow-hidden"
            >
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  COMING SOON
                </span>
              </div>

              {/* Icon */}
              <div className="text-5xl mb-4">{category.icon}</div>

              {/* Category Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h3>

              {/* Description */}
              <p className="text-gray-600">{category.description}</p>

              {/* Disabled Button */}
              <button
                disabled
                className="mt-6 w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed opacity-60"
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Coming to the Store?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-600">📚 Books Section</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>✓ HoundHeart Digital Book</li>
                <li>✓ HoundHeart Audio Book</li>
                <li>✓ Exclusive guides & resources</li>
                <li>✓ Tier-based access</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-600">🛍️ Merchandise & More</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>✓ Official HoundHeart T-shirts</li>
                <li>✓ Premium member exclusive items</li>
                <li>✓ Secure checkout</li>
                <li>✓ Order tracking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Expected Timeline */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            🕐 Expected to launch in <span className="font-bold">Phase 2 (Q3 2024)</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Next Phase Feature Under Development
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnlineStorePage;
