import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';

const PrivacyPolicyPage = ({ showHeaderFooter = true, initialTab = 'general' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // Use initialTab prop or default to Privacy Policy tab
  const isAuthenticated = apiService.isAuthenticated() && !!apiService.getToken();
  const homePath = isAuthenticated ? '/dashboard' : '/';

  // Scroll to top when component mounts
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Ensure the correct tab is active when component mounts
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  const handleHomeClick = () => {
    navigate(homePath);
  };

  const handleAboutClick = () => {
    navigate(homePath);
  };

  const handleFooterNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleFeaturesClick = () => {
    navigate(homePath);
  };

  const handleLogin = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header - only show if showHeaderFooter is true */}
      {showHeaderFooter && (
        <header className="bg-white shadow-sm border-b border-gray-100 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              {/* Left Side - Logo */}
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleHomeClick}>
                <img
                  src={HoundHeartLogo}
                  alt="HoundHeart Logo"
                  className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                />
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">HoundHeart™</h1>
              </div>

              {/* Center - Navigation - Hide on Terms of Use and Privacy Policy pages */}
              {activeTab !== 'houndheart' && activeTab !== 'general' && (
                <nav className="hidden md:flex space-x-8">
                  <button
                    onClick={handleAboutClick}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 cursor-pointer relative group"
                  >
                    About
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                  </button>
                  <button
                    onClick={handleFeaturesClick}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 cursor-pointer relative group"
                  >
                    Features
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                  </button>
                </nav>
              )}

              {/* Right Side - Login/Register */}
              <div className="flex items-center space-x-2 group">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <button
                  onClick={handleLogin}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105"
                >
                  {isAuthenticated ? 'Dashboard' : 'Login/Register'}
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Navigation Bar - Always Visible */}
        <div className="flex justify-start mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('houndheart')}
              className={`text-base font-medium transition-all duration-300 ${
                activeTab === 'houndheart'
                  ? 'text-purple-500 border-b border-purple-500'
                  : 'text-gray-400 hover:text-purple-500'
              }`}
            >
              Terms of Use
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`text-base font-medium transition-all duration-300 ${
                activeTab === 'general'
                  ? 'text-purple-500 border-b border-purple-500'
                  : 'text-gray-400 hover:text-purple-500'
              }`}
            >
              Privacy Policy
            </button>
          </div>
        </div>
        
        {/* Purple Line Below Tabs */}
        <div className="w-full h-px bg-purple-500 mb-8"></div>

        {/* Page Header */}
        <div className="text-center mb-12" id="privacy-policy-top">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {activeTab === 'general' ? 'Privacy Policy' : 'Terms of Use'}
          </h1>
          <p className="text-gray-500 text-base mb-4">
            Last updated: {activeTab === 'general' ? 'September 2023' : 'September 2025'}
          </p>
          <div className="w-20 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto"></div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Back to Home Link */}
              <div className="mb-6">
                <button
                  onClick={handleHomeClick}
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                  {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
                </button>
              </div>

              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-purple-600 mb-4">Privacy Policy</h1>
                <p className="text-purple-500 text-lg">
                  Your privacy matters to us. Learn how we collect and handle your information.
                </p>
              </div>

              {/* Key Highlights Summary Section */}
              <div className="bg-purple-50 rounded-2xl p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Privacy in Plain Language */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Privacy in Plain Language</h3>
                    <p className="text-gray-700 text-sm">We explain our policies clearly and simply.</p>
                  </div>

                  {/* Strong Security */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Strong Security</h3>
                    <p className="text-gray-700 text-sm">We use industry-standard encryption and robust security measures.</p>
                  </div>

                  {/* Limited Sharing */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5V22h6zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-2.5-7.5A1.5 1.5 0 0 0 5.04 8H4c-.8 0-1.54.37-2.01.99L1 10.5V22h6.5z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Limited Sharing</h3>
                    <p className="text-gray-700 text-sm">Only with trusted service providers who help us run HoundHeart™ securely.</p>
                  </div>

                  {/* Your Control */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Your Control</h3>
                    <p className="text-gray-700 text-sm">Access, download, or delete your data anytime.</p>
                  </div>
                </div>
              </div>

              {/* About the Content Section */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About the Content</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• HoundHeart™ Terms, what your rights & how to use HoundHeart™ work.</li>
                  <li>• Platform data activity and health info of your Hound to track™ to elevate your Bonded Score™.</li>
                  <li>• App usage from data™ to improve the app and helpful updates.</li>
                </ul>
              </div>

              {/* HoundHeart™ Privacy Policy Introduction */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">HoundHeart™ Privacy Policy</h2>
                <p className="text-gray-600 mb-4">Your Privacy Matters</p>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p><strong>Effective Date:</strong> January 1, 2024</p>
                  <p><strong>Last Updated:</strong> January 1, 2024</p>
                </div>
                <p className="text-gray-700">
                  At HoundHeart™, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
                </p>
              </div>

              {/* Numbered Sections */}
              <div className="space-y-6">
                {/* Section 1 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h3>
                  <p className="text-gray-700 mb-4">We collect information that helps us deliver and improve HoundHeart™, including:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">a. Personal Information</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Name, email address, phone number, and profile details</li>
                        <li>• Payment information (processed through secure third-party providers)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">b. Pet Information</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Your dog's name, age, breed, weight, health history, and activity data</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">c. Health & Wellness Data (Optional)</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Bonded Score data and wellness insights</li>
                        <li>• Energy tracking data and health monitoring information</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">d. Device & Usage Data</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• IP address, device identifiers, operating system</li>
                        <li>• App interactions, preferences, usage logs, and app state</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">e. Location Data</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Approximate or precise location (if you enable location services)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h3>
                  <p className="text-gray-700 mb-4">We use the information we collect to:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• Provide, personalize, and improve our Services</li>
                    <li>• Develop your Bonded Score™ and wellness insights</li>
                    <li>• Communicate with you about updates and features</li>
                    <li>• Monitor system security and prevent fraud</li>
                    <li>• Conduct research and analytics to improve HoundHeart™</li>
                    <li>• Comply with legal requirements and enforce our Terms of Use</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. How We Share Your Information</h3>
                  <p className="text-gray-700 mb-4">We may share your information in the following circumstances:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">a. Service Providers</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• With trusted third-party service providers who help us operate our platform</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">b. Legal Requirements</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• When required by law or to protect our rights and safety</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">c. Business Transfers</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• In connection with mergers, acquisitions, or asset sales</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">d. Aggregated Data</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Anonymized and aggregated data for research and analytics</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">e. With Your Consent</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• When you explicitly consent to sharing your information</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">f. Public Forums</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Information you choose to share in public community forums</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">g. Third-Party Integrations</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Data shared with third-party integrations you choose to connect</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">4. Your Choices & Rights</h3>
                  <p className="text-gray-700 mb-4">You have control over your personal information:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">a. Access & Update</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• View and update your account information anytime</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">b. Opt-Out</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Unsubscribe from marketing communications</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">c. Data Deletion</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Request deletion of your account and associated data</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">d. Location & Health Data</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Disable location services or revoke permissions</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">e. Promotional Communications</h4>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Manage your communication preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 5 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h3>
                  <p className="text-gray-700">
                    We use industry-standard encryption, secure servers, and access controls to protect your information. While we take every reasonable step to secure your data, no method of transmission or storage is 100% secure.
                  </p>
                </div>

                {/* Section 6 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">6. Children's Privacy</h3>
                  <p className="text-gray-700">
                    HoundHeart™ is not directed to children under 16. We do not knowingly collect personal data from children under 16.
                  </p>
                </div>

                {/* Section 7 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">7. International Users</h3>
                  <p className="text-gray-700">
                    If you access HoundHeart™ from outside the United States, your data may be transferred to and stored on servers located in the United States.
                  </p>
                </div>

                {/* Section 8 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h3>
                  <p className="text-gray-700">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website.
                  </p>
                </div>

                {/* Section 9 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h3>
                  <p className="text-gray-700 mb-2">
                    If you have questions about this Privacy Policy, please contact us:
                  </p>
                  <p className="text-gray-700"><strong>HoundHeart™ Privacy Team</strong></p>
                  <p className="text-purple-600 underline">privacy@houndheart.com</p>
                  <p className="text-purple-600 underline">www.houndheart.com</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms of Use Tab */}
        {activeTab === 'houndheart' && (
          <div className="space-y-8">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Back to Home Link */}
              <div className="mb-6">
                <button
                  onClick={handleHomeClick}
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  ← Back to Home
                </button>
              </div>

              {/* Main Title with Icon */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    <path d="M9 15l3 3 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-purple-600 mb-4">Terms of Use</h1>
                <p className="text-gray-600 text-lg">
                  Please read these terms carefully. They govern your use of HoundHeart™ and protect both you and us.
                </p>
              </div>

              {/* Important Health Disclaimer Alert */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Health Disclaimer</h3>
                    <p className="text-gray-700">
                      HoundHeart™ provides wellness and lifestyle insights, not medical advice. We do not diagnose, treat, cure, or prevent any disease. Always consult a qualified veterinarian or healthcare professional before making any decisions about yourself or your pet.
                    </p>
                  </div>
                </div>
              </div>

              {/* HoundHeart™ Terms of Use Introduction */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">HoundHeart™ Terms of Use</h2>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p><strong>Effective Date:</strong> January 1, 2024</p>
                  <p><strong>Last Updated:</strong> January 1, 2024</p>
                </div>
                <p className="text-gray-700">
                  Welcome to HoundHeart™! ("HoundHeart", "we", "us", or "our") By accessing or using our website, app, services, or content (the "Services"), you ("you" or "your") agree to these Terms of Use ("Terms"). If you do not agree, please do not use the Services.
                </p>
              </div>

              {/* Numbered Sections */}
              <div className="space-y-6">
                {/* Section 1 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1. Eligibility</h3>
                  <p className="text-gray-700">
                    You must be at least 13 years old (or the minimum age of consent in your country) to use HoundHeart™. By using the Services, you confirm that you meet this requirement.
                  </p>
                </div>

                {/* Section 2 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2. Your Account</h3>
                  <p className="text-gray-700 mb-3">You may need an account to use some features. You agree to:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• Provide accurate and up-to-date information</li>
                    <li>• Keep your login credentials secure</li>
                    <li>• Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p className="text-gray-700 mt-3">You are responsible for all activity under your account.</p>
                </div>

                {/* Section 3 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. Use of Services</h3>
                  <p className="text-gray-700 mb-3">You agree to use our Services responsibly and not to:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• Infringe on intellectual property rights</li>
                    <li>• Post harmful, illegal, or inappropriate content</li>
                    <li>• Attempt to gain unauthorized access to our systems</li>
                    <li>• Use the Services for any unlawful purpose</li>
                  </ul>
                </div>

                {/* Section 4 - Health & Wellness Disclaimer Alert */}
                <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Health & Wellness Disclaimer</h3>
                      <p className="text-gray-700">
                        HoundHeart™ provides wellness and lifestyle insights, not medical advice. We do not diagnose, treat, cure, or prevent any disease. Always consult a qualified veterinarian or healthcare professional before making any decisions about yourself or your pet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">5. Intellectual Property</h3>
                  <p className="text-gray-700">
                    The Services and their original content, features, and functionality are owned by HoundHeart™ and are protected by copyright, trademark, and other laws. You may not reproduce, distribute, or create derivative works without our permission.
                  </p>
                </div>

                {/* Section 6 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">6. Payments & Subscriptions</h3>
                  <p className="text-gray-700 mb-3">If you purchase a subscription:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• Subscription plans auto-renew unless you cancel</li>
                    <li>• You can cancel anytime through your account settings</li>
                    <li>• Refunds are available within 7 days of initial purchase</li>
                    <li>• Prices may change with 30 days' notice</li>
                  </ul>
                </div>

                {/* Section 7 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">7. Termination</h3>
                  <p className="text-gray-700">
                    We may terminate or suspend your account at any time for violations of these Terms. You may also terminate your account at any time by contacting us.
                  </p>
                </div>

                {/* Section 8 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">8. Limitations of Liability</h3>
                  <p className="text-gray-700 mb-3">To the fullest extent permitted by law, HoundHeart™ shall not be liable for:</p>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li>• Indirect, incidental, or consequential damages</li>
                    <li>• Loss of profits, data, or business opportunities</li>
                    <li>• Any damages exceeding the amount paid for the Services</li>
                  </ul>
                </div>

                {/* Section 9 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">9. Indemnification</h3>
                  <p className="text-gray-700">
                    You agree to defend, indemnify, and hold harmless HoundHeart™ from any claims, damages, or expenses arising from your use of the Services or violation of these Terms.
                  </p>
                </div>

                {/* Section 10 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">10. Changes to These Terms</h3>
                  <p className="text-gray-700">
                    We may update these Terms from time to time. We will notify you of any material changes by posting the new Terms on our website. Your continued use of the Services after such changes constitutes acceptance of the new Terms.
                  </p>
                </div>

                {/* Section 11 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">11. Governing Law</h3>
                  <p className="text-gray-700">
                    These Terms are governed by the laws of [State/Country] without regard to conflict of law principles. Any disputes will be resolved in the courts of [State/Country].
                  </p>
                </div>

                {/* Section 12 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">12. Contact Us</h3>
                  <p className="text-gray-700 mb-2">
                    If you have any questions about these Terms, please contact us:
                  </p>
                  <p className="text-gray-700"><strong>Email:</strong> support@houndheart.com</p>
                  <p className="text-gray-700"><strong>Website:</strong> www.houndheart.com</p>
                </div>
              </div>

              {/* Agreement Acknowledgment */}
              <div className="bg-purple-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Agreement Acknowledgment</h3>
                <p className="text-gray-700">
                  By using HoundHeart™, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy. These documents constitute the entire agreement between you and HoundHeart™.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - only show if showHeaderFooter is true */}
      {showHeaderFooter && (
        <footer className="bg-black text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Section */}
            <div className="flex justify-between items-start mb-8">
              {/* Left Section - Branding and Social */}
              <div className="space-y-4">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <img src={HoundHeartLogo} alt="HoundHeart Logo" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">HoundHeart™</h3>
                    <p className="text-gray-300 text-sm">Heal the Bond, Not Just the Bark</p>
                  </div>
                </div>

                {/* Social Media Icons */}
                <div className="flex space-x-3">
                  <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Right Side - Company and Support Links */}
              <div className="flex space-x-12">
                {/* Company Links */}
                <div>
                  <h4 className="font-semibold mb-4 text-white">Company</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><button onClick={() => handleFooterNavigation('/about-us')} className="hover:text-white transition-colors">About Us</button></li>
                    <li><button onClick={() => handleFooterNavigation('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                    <li><button onClick={() => handleFooterNavigation('/terms-of-use')} className="hover:text-white transition-colors">Terms of Service</button></li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h4 className="font-semibold mb-4 text-white">Support</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><button onClick={() => handleFooterNavigation('/help-center')} className="hover:text-white transition-colors">Help Center</button></li>
                    <li><a href="#" className="hover:text-white transition-colors">Healing Circles</a></li>
                    <li><button onClick={() => handleFooterNavigation('/community-guidelines')} className="hover:text-white transition-colors">Community Guidelines</button></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Horizontal Line */}
            <div className="border-t border-gray-600 mb-8"></div>

            {/* Bottom Section */}
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-300 text-sm mb-4 md:mb-0">
                © 2025 HoundHeart™. All rights reserved. Heal the Bond, Not Just the Bark.
              </p>
              <div className="flex space-x-6">
                <button onClick={() => handleFooterNavigation('/privacy-policy')} className="text-gray-300 hover:text-white text-sm transition-colors">Privacy Policy</button>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Cookie Policy</a>
                <button onClick={() => handleFooterNavigation('/terms-of-use')} className="text-gray-300 hover:text-white text-sm transition-colors">Terms and Conditions</button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PrivacyPolicyPage;
