import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';

const CommunityGuidelinesPage = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleFooterNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleBackToHome}>
              <img
                src={HoundHeartLogo}
                alt="HoundHeart Logo"
                className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">HoundHeart™</h1>
            </div>

            {/* Right Side - Back Button */}
            <button
              onClick={handleBackToHome}
              className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 border-2 border-purple-500">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="8" cy="6" r="2"/>
                <path d="M8 9c-1.5 0-3 0.5-3 2.5v3h6v-3c0-2-1.5-2.5-3-2.5z"/>
                <circle cx="16" cy="6" r="2"/>
                <path d="M16 9c-1.5 0-3 0.5-3 2.5v3h6v-3c0-2-1.5-2.5-3-2.5z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Community Guidelines</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Welcome to the HoundHeart™ community! Our intention is to deepen the bond between humans and their dogs through connection, energy awareness, and wellness tools.
          </p>
        </div>

        {/* Guidelines Cards */}
        <div className="space-y-6">
          {/* Creating a Safe & Supportive Community */}
          <div className="bg-pink-50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Creating a Safe & Supportive Community</h2>
            <p className="text-gray-700 leading-relaxed">
              To keep this community safe and supportive for all members on their spiritual journey with their dogs, we ask that all users follow these simple guidelines.
            </p>
          </div>

          {/* Guideline 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">1. Be Kind & Respectful</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Treat fellow users, their dogs, and our team with respect.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No bullying, harassment, or hate speech - treat people as pets.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Constructive discussion is encouraged, personal attacks are not.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guideline 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">2. Keep it Safe</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Do not post or share harmful, unsafe, or illegal content.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No promotion of pirated drugs, neglect, or unsafe training practices.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Respect privacy - don't share someone else's personal information without permission.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guideline 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">3. Stay Honest</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Share genuine experience and stay true to the best of your ability.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Do not impersonate others or provide false information that could harm pets or people.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Be authentic in your spiritual journey and energy work practices.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guideline 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="8" cy="6" r="2"/>
                  <path d="M8 9c-1.5 0-3 0.5-3 2.5v3h6v-3c0-2-1.5-2.5-3-2.5z"/>
                  <circle cx="16" cy="6" r="2"/>
                  <path d="M16 9c-1.5 0-3 0.5-3 2.5v3h6v-3c0-2-1.5-2.5-3-2.5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">4. Respect the Spirit of HoundHeart™</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    This is a wellness and connection platform - not a place for spam, unsolicited ads, or disruptive behavior.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No unauthorized marketing, self-promotion, or solicitation without our written permission.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Honor the sacred bond between humans and dogs in all interactions.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guideline 5 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">5. Be Mindful of Wellness Content</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Remember HoundHeart™ insights are for wellness support, not a substitute for veterinary or medical care.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Encourage others to consult a vet or doctor when appropriate.
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Share energy practices and spiritual insights responsibly.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guideline 6 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">6. Report Violations</h3>
                <p className="text-gray-700 mb-4">
                  If you see harmful behavior, unsafe content, or anything that goes against these guidelines, please report it to us immediately.
                </p>
                <p className="text-purple-600 font-bold mb-4">Report via: community@houndheart.com</p>
                <p className="text-gray-700">
                  Include as much detail as possible to help us address the issue quickly and effectively.
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines 7 & 8 - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guideline 7 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">7. Consequences</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Users who violate these guidelines may have their content removed, accounts suspended, or access revoked.
              </p>
              <p className="text-gray-700">
                We believe in second chances, but the safety of our community comes first.
              </p>
            </div>

            {/* Guideline 8 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">8. Our Commitment</h3>
              </div>
              <p className="text-gray-700 mb-4">
                We are committed to creating a safe, positive space for humans and dogs to thrive together.
              </p>
              <p className="text-gray-700">
                These guidelines help make that possible for everyone in our community.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Thank You for Being Part of HoundHeart™</h2>
          <p className="text-lg mb-6 leading-relaxed">
            Together, we're building a community where the sacred bond between humans and dogs can flourish. Your mindful participation helps create a space of healing, growth, and unconditional love.
          </p>
          <p className="text-pink-100">
            Questions about these guidelines? Email us at{' '}
            <a href="mailto:community@houndheart.com" className="text-white font-semibold hover:underline">
              community@houndheart.com
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section */}
          <div className="flex justify-between items-start mb-8">
            {/* Left Section - Branding and Social */}
            <div className="space-y-4">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleBackToHome}>
                <div className="w-18 h-18  rounded-full flex items-center justify-center">
                  <img src={HoundHeartLogo} alt="HoundHeart Logo" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">HoundHeart™</h3>
                  <p className="text-gray-300 text-sm">Heal the Bond, Not Just the Bark</p>
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-4">
                 {/* Facebook Icon */}
                 <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                   </svg>
                 </a>
                 
                 {/* Twitter Icon */}
                 <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                   </svg>
                 </a>
                 
                 {/* Instagram Icon */}
                 <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                   </svg>
                 </a>
                 
                 {/* LinkedIn Icon */}
                 <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
    </div>
  );
};

export default CommunityGuidelinesPage;
