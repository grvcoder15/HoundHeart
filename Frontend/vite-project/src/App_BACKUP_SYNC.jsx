import React from 'react';
import './index.css';
import HoundHeartLandingPage from './Pages/HoundHeartLandingPage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
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
import PrivacyPolicyPage from './Pages/PrivacyPolicyPage';
import CommunityGuidelinesPage from './Pages/CommunityGuidelinesPage';
import HelpCenterPage from './Pages/HelpCenterPage';
import AboutUsPage from './Pages/AboutUsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

          {/* under protected routing */}
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
          <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/rituals" element={<ProtectedRoute><ChakraRitualsPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/ask-expert" element={<ProtectedRoute><AskExpertPage /></ProtectedRoute>} />
          <Route path="/sacred-guide" element={<ProtectedRoute><SacredGuidePage /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>} />
          <Route path="/subscription/cancel" element={<ProtectedRoute><SubscriptionCancelPage /></ProtectedRoute>} />
          <Route path="/community-guidelines" element={<ProtectedRoute><CommunityGuidelinesPage /></ProtectedRoute>} />



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
