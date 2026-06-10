import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ContentModerationPage from './pages/ContentModerationPage';
import HealingCirclesPage from './pages/HealingCirclesPage';
import ExpertQueriesPage from './pages/ExpertQueriesPage';
import SacredGuidePage from './pages/SacredGuidePage';
import UploadSacredGuidePage from './pages/UploadSacredGuidePage';
import SettingsPage from './pages/SettingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import FAQManagementPage from './pages/FAQManagementPage';
import MembershipPlansPage from './pages/MembershipPlansPage';
import PreRegistrationsPage from './pages/PreRegistrationsPage';
import TravelClubAdminPage from './pages/TravelClubAdminPage';
import WearableMarketplaceAdminPage from './pages/StoreAdminPage';
import BooksAdminPage from './pages/BooksAdminPage';
import StoreManagementPage from './pages/StoreManagementPage';
import CharityPartnershipPage from './pages/CharityPartnershipPage';

function App() {
  return (
    <>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/content" element={<ContentModerationPage />} />
          <Route path="/healing-circles" element={<HealingCirclesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/queries" element={<ExpertQueriesPage />} />
          <Route path="/sacred-guide" element={<SacredGuidePage />} />
          <Route path="/sacred-guide/upload" element={<UploadSacredGuidePage />} />
          <Route path="/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/membership-plans" element={<MembershipPlansPage />} />
          <Route path="/pre-registrations" element={<PreRegistrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/faq" element={<FAQManagementPage />} />
          
          {/* Phase 2 Coming Soon Features */}
          <Route path="/travel-club" element={<TravelClubAdminPage />} />
          <Route path="/wearable-marketplace" element={<WearableMarketplaceAdminPage />} />
          <Route path="/books" element={<BooksAdminPage />} />
          <Route path="/store" element={<StoreManagementPage />} />
          <Route path="/charity" element={<CharityPartnershipPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;