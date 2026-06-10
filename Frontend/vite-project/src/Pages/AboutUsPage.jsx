import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';

const AboutUsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('aboutus');

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleFooterNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToHome}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
            <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">About HoundHeart™</span>
              <span className="sm:hidden">About</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="Man with dog in nature" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Title Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-800">About HoundHeart™</h1>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-purple-600 max-w-4xl mx-auto">
            {activeTab === 'aboutus' 
              ? "Your dog's best friend's companion - your dog is in safe, loving hands."
              : "Discover the power of energetic harmony with your dog."
            }
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('aboutus')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'aboutus'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About Us
            </button>
            {/* <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'about'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </button> */}
          </div>
        </div>

        {/* About Us Tab Content */}
        {activeTab === 'aboutus' && (
          <>
            {/* Our Story Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12 mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <div className="absolute -left-2 top-0 w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="absolute -left-3 top-2 w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Story</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                HoundHeart™ is a first-of-its-kind companion focused on healing the bond and spiritual connection between humans and their dogs. 
                Born from our founder's personal journey with their beloved dog Misha, we understand the profound impact that a deep, 
                meaningful relationship with your canine companion can have on both your lives. Our mission is to help you and your dog 
                thrive together through innovative wellness practices and mindful connection.
              </p>
            </div>
            <div className="w-full lg:w-96 flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Hand touching dog's head" 
                className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Mission, Vision, Philosophy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Our Mission Card */}
          <div className="bg-purple-50 rounded-xl p-6 sm:p-8 border border-purple-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">To help humans and dogs develop deeper, more meaningful connections through wellness practices</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Through intuitive technology and mindful practices, we enhance the bond between you and your canine companion</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Although animal-assisted therapy is not a substitute for professional medical care, we believe in the healing power of the human-animal bond</span>
              </li>
            </ul>
          </div>

          {/* Our Vision Card */}
          <div className="bg-pink-50 rounded-xl p-6 sm:p-8 border border-pink-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">We aspire to create a world where every human-dog relationship is nurtured and celebrated</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">To be the leading platform for canine wellness and human-animal connection</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">To foster a world where the bond between humans and dogs is recognized as a source of healing and joy</span>
              </li>
            </ul>
          </div>

          {/* Our Philosophy Card */}
          <div className="bg-orange-50 rounded-xl p-6 sm:p-8 border border-orange-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Our Philosophy</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">We believe in the transformative power of the human-animal bond</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Every interaction with your dog is an opportunity for mutual growth and healing</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Our approach is holistic, combining technology with mindfulness and compassion</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 sm:p-12 text-center mb-8 sm:mb-12">
          <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold leading-relaxed max-w-4xl mx-auto">
            HoundHeart™ is not just an app - it is a pathway to an enduring, co-evolving, and co-creating a field of love strong enough to transform both your lives.
          </p>
        </div>

        {/* Join the Movement Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                <path d="M20 7a4 4 0 11-8 0 4 4 0 018 0zM16 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" transform="translate(4, 0)"/>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Join the HoundHeart™ Movement!</h2>
          </div>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
            Step into this journey, to bring forth your dog's natural vibrancy, to deepen your mutual spiritual connection, 
            and to help others cultivate more love in their lives. Together, we can create a world where every human-dog 
            relationship is a source of healing, joy, and transformation.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
        Being Your Journey
          </button>
        </div>
          </>
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <div className="mb-8 sm:mb-12">
            {/* Sub-tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white text-sm">
                  Our Philosophy
                </button>
                <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-900 text-sm">
                  Energy Healing
                </button>
                <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-900 text-sm">
                  The Science
                </button>
                <button className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-900 text-sm">
                  Your Journey
                </button>
              </div>
            </div>

            {/* Our Philosophy Content */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-teal-400 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-center mt-3 font-semibold text-gray-900">More Than Companions</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                    At HoundHeart™, we believe your dog is more than a companion. Dogs are naturally energetic healers who feel each moment in the raw, full-bodied joy of now and radiate the highest vibrations of love, trust, gratitude, duty, and loyalty. Your dog's natural gift gives you access to energetic harmony, the root of a power to synergistically heal you inside. That synergy benefits you both in ways science is only beginning to understand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-6 sm:mb-8 space-y-8 lg:space-y-0">
            {/* Left Section - Branding and Social */}
            <div className="space-y-4 w-full lg:w-auto">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0">
                  <img src={HoundHeartLogo} alt="HoundHeart Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">HoundHeart™</h3>
                  <p className="text-gray-300 text-xs sm:text-sm">Heal the Bond, Not Just the Bark</p>
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-3 sm:space-x-4">
                 {/* Facebook Icon */}
                 <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                   </svg>
                 </a>
                 
                 {/* Twitter Icon */}
                 <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                   </svg>
                 </a>
                 
                 {/* Instagram Icon */}
                 <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                   </svg>
                 </a>
                 
                 {/* LinkedIn Icon */}
                 <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                   <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                   </svg>
                 </a>
              </div>
            </div>

            {/* Right Side - Company and Support Links */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row space-y-6 sm:space-y-0 sm:space-x-8 lg:space-x-0 lg:space-y-6 xl:space-y-0 xl:space-x-12 w-full lg:w-auto">
              {/* Company Links */}
              <div className="w-full sm:w-auto">
                <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Company</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><button onClick={() => handleFooterNavigation('/about-us')} className="hover:text-white transition-colors text-sm sm:text-base">About Us</button></li>
                  <li><button onClick={() => handleFooterNavigation('/privacy-policy')} className="hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</button></li>
                  <li><button onClick={() => handleFooterNavigation('/terms-of-use')} className="hover:text-white transition-colors text-sm sm:text-base">Terms of Service</button></li>
                </ul>
              </div>

              {/* Support Links */}
              <div className="w-full sm:w-auto">
                <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Support</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><button onClick={() => handleFooterNavigation('/help-center')} className="hover:text-white transition-colors text-sm sm:text-base">Help Center</button></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sm sm:text-base">Healing Circles</a></li>
                  <li><button onClick={() => handleFooterNavigation('/community-guidelines')} className="hover:text-white transition-colors text-sm sm:text-base">Community Guidelines</button></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Horizontal Line */}
          <div className="border-t border-gray-600 mb-6 sm:mb-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-300 text-xs sm:text-sm text-center sm:text-left">
              © 2025 HoundHeart™. All rights reserved. Heal the Bond, Not Just the Bark.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-6">
              <button onClick={() => handleFooterNavigation('/privacy-policy')} className="text-gray-300 hover:text-white text-xs sm:text-sm transition-colors">Privacy Policy</button>
              <a href="#" className="text-gray-300 hover:text-white text-xs sm:text-sm transition-colors">Cookie Policy</a>
              <button onClick={() => handleFooterNavigation('/terms-of-use')} className="text-gray-300 hover:text-white text-xs sm:text-sm transition-colors">Terms and Conditions</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUsPage;
