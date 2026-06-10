import React from 'react';
import AdminLayout from '../components/AdminLayout';

const BooksAdminPage = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-4xl">📚</span>
            <h1 className="text-4xl font-bold text-gray-900">Books Management</h1>
          </div>
          <p className="text-gray-600">Phase 2 - Coming Soon Feature</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-400 rounded-lg p-8 text-center">
          <span className="inline-block bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse mb-4">
            🚀 COMING SOON - Phase 2
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Books Library Management</h2>
          <p className="text-gray-700 mb-6">
            Manage digital books, audiobooks, and library content for members.
          </p>
          
          <div className="bg-white rounded-lg p-6 inline-block max-w-2xl">
            <h3 className="text-xl font-bold text-purple-600 mb-4">Planned Features:</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>✓ Book Management</div>
              <div>✓ Audiobook Upload</div>
              <div>✓ Access Control</div>
              <div>✓ Reading Analytics</div>
              <div>✓ Tier-based Access</div>
              <div>✓ Content Updates</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BooksAdminPage;
