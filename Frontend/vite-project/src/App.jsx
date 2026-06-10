import React from 'react';
import './index.css';
import HoundHeartLandingPage from './Pages/HoundHeartLandingPage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import EmailVerificationPage from './Pages/EmailVerificationPage';
import ProfileSetupPage from './Pages/ProfileSetupPage';
import ProfileSettingsPage from './Pages/ProfileSettingsPage';
import DashboardPage from './Pages/DashboardPage';
import ChakraRitualsPage from './Pages/ChakraRitualsPage';
import JournalPage from './Pages/JournalPage';
import CommunityPage from './Pages/CommunityPage';
import AskExpertPage from './Pages/AskExpertPage';
import SacredGuidePage from './Pages/SacredGuidePage';
import SubscriptionPage from './Pages/SubscriptionPage';
import SubscriptionSuccessPage from './Pages/SubscriptionSuccessPage';
import SubscriptionCancelPage from './Pages/SubscriptionCancelPage';
import SubscriptionPortalReturnPage from './Pages/SubscriptionPortalReturnPage';
import BondAnalyticsPage from './Pages/BondAnalyticsPage';
import WearableIntegrationPage from './Pages/WearableIntegrationPage';
import PrivacyPolicyPage from './Pages/PrivacyPolicyPage';
import CommunityGuidelinesPage from './Pages/CommunityGuidelinesPage';
import HelpCenterPage from './Pages/HelpCenterPage';
import AboutUsPage from './Pages/AboutUsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './Pages/WelcomePage';
import TravelClubPage from './Pages/TravelClubPage';
import WearableMarketplacePage from './Pages/WearableMarketplacePage';
import OnlineStorePage from './Pages/OnlineStorePage';
import BooksLibraryPage from './Pages/BooksLibraryPage';
// import HoundheartLogo from "./assets/images/Houndheart_logo.svg";

const App = () => {
  return (
    <div>
      {/* <img src={HoundheartLogo} alt="HoundHeart Logo" />; */}
      <Router>
        <Routes>
          {/* Not under protected routing */}
          <Route path="/" element={<HoundHeartLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* under protected routing */}
          <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
          <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/rituals" element={<ProtectedRoute requiredTier="plus"><ChakraRitualsPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/ask-expert" element={<ProtectedRoute><AskExpertPage /></ProtectedRoute>} />
          <Route path="/sacred-guide" element={<ProtectedRoute><SacredGuidePage /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>} />
          <Route path="/subscription/cancel" element={<ProtectedRoute><SubscriptionCancelPage /></ProtectedRoute>} />
          <Route path="/subscription/portal-return" element={<ProtectedRoute><SubscriptionPortalReturnPage /></ProtectedRoute>} />
          <Route path="/sync-score" element={<ProtectedRoute requiredTier="plus"><BondAnalyticsPage /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute requiredTier="plus"><WearableIntegrationPage /></ProtectedRoute>} />
          <Route path="/community-guidelines" element={<ProtectedRoute><CommunityGuidelinesPage /></ProtectedRoute>} />

          {/* Coming Soon / Phase 2 Features */}
          <Route path="/travel-club" element={<ProtectedRoute><TravelClubPage /></ProtectedRoute>} />
          <Route path="/wearable-marketplace" element={<ProtectedRoute><WearableMarketplacePage /></ProtectedRoute>} />
          <Route path="/store" element={<ProtectedRoute><OnlineStorePage /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><BooksLibraryPage /></ProtectedRoute>} />



          {/* Not under protected routing */}
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage key="privacy-policy" showHeaderFooter={true} />} />
          <Route path="/privacy-policy-full" element={<PrivacyPolicyPage showHeaderFooter={false} />} />
          <Route path="/terms-of-use" element={<PrivacyPolicyPage key="terms-of-use" showHeaderFooter={true} initialTab="houndheart" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
