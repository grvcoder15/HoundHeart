import React from 'react';
import './index.css';
import apiService from './services/apiService';
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
import CoursesPage from './Pages/CoursesPage';
import WellnessGuidePage from './Pages/WellnessGuidePage';
import WellnessCheckPage from './Pages/WellnessCheckPage';
import DetailedAnalysisPage from './Pages/DetailedAnalysisPage';
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
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import WelcomePage from './Pages/WelcomePage';
import TravelClubPage from './Pages/TravelClubPage';
import WearableMarketplacePage from './Pages/WearableMarketplacePage';
import OnlineStorePage from './Pages/OnlineStorePage';
import BooksLibraryPage from './Pages/BooksLibraryPage';
import LegacyProjectPage from './Pages/LegacyProjectPage';
import GriefSupportPage from './Pages/GriefSupportPage';
import { NotificationPopupProvider } from './hooks/useNotificationPopup';
import NotificationPopup from './components/NotificationPopup';

// Pages that should NOT show the global Navbar
const NO_NAVBAR_PATHS = ['/', '/login', '/signup', '/verify-email', '/welcome', '/profile-setup'];

const AppContent = () => {
  const location = useLocation();
  const isAuthenticated = apiService.isAuthenticated();
  const isPolicyPage = ['/privacy-policy', '/privacy-policy-full', '/terms-of-use'].includes(location.pathname);
  
  // Check if user is in registration flow
  const inRegistrationFlow = 
    location.state?.from === 'signup' || 
    sessionStorage.getItem('registrationInProgress') === 'true';

  // Effective authentication for UI purposes
  const isEffectivelyAuthenticated = isAuthenticated && !inRegistrationFlow;

  // Pages that inherently don't show the global Navbar
  const isNoNavbarPath = NO_NAVBAR_PATHS.includes(location.pathname);
  
  // Show Navbar if it's not a NO_NAVBAR path.
  // For policy pages, only show the Navbar if the user is effectively authenticated.
  const showNavbar = !isNoNavbarPath && !(isPolicyPage && !isEffectivelyAuthenticated);

  return (
    <>
      {showNavbar && <Navbar />}
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
        <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
        <Route path="/wellness-guide" element={<ProtectedRoute><WellnessGuidePage /></ProtectedRoute>} />
        <Route path="/wellness-check" element={<ProtectedRoute><WellnessCheckPage /></ProtectedRoute>} />
        <Route path="/wellness-check/detailed-analysis" element={<ProtectedRoute><DetailedAnalysisPage /></ProtectedRoute>} />
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
        <Route path="/legacy-project" element={<ProtectedRoute><LegacyProjectPage /></ProtectedRoute>} />
        <Route path="/grief-support" element={<ProtectedRoute><GriefSupportPage /></ProtectedRoute>} />

        {/* Public or informational pages */}
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage key="privacy-policy" showHeaderFooter={!isEffectivelyAuthenticated} />} />
        <Route path="/privacy-policy-full" element={<PrivacyPolicyPage showHeaderFooter={false} />} />
        <Route path="/terms-of-use" element={<PrivacyPolicyPage key="terms-of-use" showHeaderFooter={!isEffectivelyAuthenticated} initialTab="houndheart" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <NotificationPopupProvider>
      <div>
        <Router>
          <AppContent />
        </Router>
        <NotificationPopup />
      </div>
    </NotificationPopupProvider>
  );
};

export default App;
