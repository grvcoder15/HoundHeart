import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';
import apiService from '../services/apiService';

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('medical');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [loadingFAQs, setLoadingFAQs] = useState(false);

  // Load FAQs from API when FAQ tab is active
  useEffect(() => {
    if (activeTab === 'faq') {
      loadFAQs();
    }
  }, [activeTab]);

  const loadFAQs = async () => {
    try {
      setLoadingFAQs(true);
      const response = await apiService.getAllFAQs();
      // Convert API response to match frontend format
      const convertedFAQs = response.map(faq => ({
        id: faq.faqId || faq.FAQId,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        status: faq.status,
        order: faq.displayOrder || 0
      }));
      setFaqs(convertedFAQs.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading FAQs:', error);
      // If API fails, show empty array
      setFaqs([]);
    } finally {
      setLoadingFAQs(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleFooterNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToDashboard}
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
              <span className="hidden sm:inline">Help Center</span>
              <span className="sm:hidden">Help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">How can we help you?</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-4 sm:px-0">Find answers, get support, and learn more about HoundHeart™.</p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-8">
            <button
              onClick={() => setActiveTab('medical')}
              className={`pb-2 border-b-2 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeTab === 'medical'
                ? 'border-purple-500 text-purple-500'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Medical Research</span>
              <span className="sm:hidden">Medical</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`pb-2 border-b-2 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeTab === 'faq'
                ? 'border-purple-500 text-purple-500'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`pb-2 border-b-2 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeTab === 'guides'
                ? 'border-purple-500 text-purple-500'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="hidden sm:inline">User Guides</span>
              <span className="sm:hidden">Guides</span>
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`pb-2 border-b-2 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeTab === 'support'
                ? 'border-purple-500 text-purple-500'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
              <span>Support</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'medical' && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medical Research & Scientific Backing</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 px-4 sm:px-0">Notable Medical Advocates for the Health Benefits of Having a Dog</p>
                </div>
              </div>
            </div>

            {/* Doctor Profile Cards */}
            <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
              {/* Dr. Edward T. Creagan Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Doctor Icon */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  {/* Doctor Information */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">Dr. Edward T. Creagan, M.D.</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-blue-600 font-medium text-sm sm:text-base">Retired Oncologist & Professor Emeritus, Mayo Clinic</p>
                      <p className="text-blue-600 font-medium text-sm sm:text-base">Animal-Assisted Therapy Pioneer</p>
                    </div>

                    {/* Quote */}
                    <blockquote className="bg-gray-50 border-l-4 border-purple-500 pl-4 py-3 mb-6 italic text-gray-700">
                      "Interacting with pets can elevate oxytocin levels while lowering the stress hormone cortisol."
                    </blockquote>

                    {/* Key Contributions */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Contributions</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Strong proponent of animal-assisted therapy</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Encourages 'prescribing' animal bonding</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Considers pets part of patient medical history</span>
                        </li>
                      </ul>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>Booking: (402) 334-2547 or Sandra@SandraWendel.com</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Clinic: Mayo Clinic Rochester, (507) 284-8413</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          <span>Website: Ask Doctor Ed website contact form</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dr. Francisco Lopez-Jimenez Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-start space-x-6">
                  {/* Doctor Icon */}
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>

                  {/* Doctor Information */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Francisco Lopez-Jimenez, M.D.</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-gray-600 font-medium">Chair, Division of Preventive Cardiology, Mayo Clinic</p>
                      <p className="text-blue-600 font-medium">Cardiovascular Health & Dog Ownership</p>
                    </div>

                    {/* Quote */}
                    <blockquote className="bg-gray-50 border-l-4 border-purple-500 pl-4 py-3 mb-6 italic text-gray-700">
                      "Dog ownership tends to encourage regular activity, reduce social isolation, and support better cardiovascular health."
                    </blockquote>

                    {/* Key Contributions */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Contributions</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Research linking dog ownership with heart health</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Promotes cardiovascular benefits of pet ownership</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Studies on exercise and social connection benefits</span>
                        </li>
                      </ul>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email: lopez@mayo.edu</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Clinic: Mayo Clinic Rochester, +1 507-284-2511</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dr. Nicholas Breiten & Dr. Mohamed Gouda Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-start space-x-6">
                  {/* Doctor Icon */}
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>

                  {/* Doctor Information */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Nicholas Breiten, M.D. & Dr. Mohamed Gouda, M.D.</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-gray-600 font-medium">Cardiologists, Mayo Clinic</p>
                    </div>

                    {/* Quote */}
                    <blockquote className="bg-gray-50 border-l-4 border-purple-500 pl-4 py-3 mb-6 italic text-gray-700">
                      "Dog ownership shown to improve cardiac function through increased physical activity, social interaction, and emotional stimulation."
                    </blockquote>

                    {/* Key Contributions */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Contributions</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Research on cardiovascular health benefits</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Studies on dog-assisted physical activity</span>
                        </li>
                        <li className="flex items-center space-x-2 text-gray-600">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>Promotes emotional benefits of pet ownership</span>
                        </li>
                      </ul>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email: breiten.nicholas@mayoclinic.com</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>Phone: (507) 284-2511</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab Content */}
        {activeTab === 'faq' && (
          <div className="mb-8 sm:mb-12">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 max-w-4xl mx-auto">
              {/* FAQ Header */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
              </div>

              {/* FAQ Items */}
              <div className="space-y-8">
                {loadingFAQs ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 mt-4">Loading FAQs...</p>
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No FAQs available at the moment.</p>
                  </div>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq.id} className="flex space-x-4">
                      <div className="w-1 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{faq.question}</h3>
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Guides Tab Content */}
        {activeTab === 'guides' && (
          <div className="mb-8 sm:mb-12">
            <div className="bg-pink-50 min-h-screen py-8">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">User Guides</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Getting Started Guide Card */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Getting Started Guide</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Set up your profile and add your dog</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Connect your wearable devices</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Complete your first energy sync session</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Explore guided meditations</span>
                      </li>
                    </ul>
                  </div>

                  {/* Advanced Features Card */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Advanced Features</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Understanding Bonded Score™ analytics</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Creating custom meditation routines</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Using Legacy Mode™ effectively</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm sm:text-base">Multi-dog household management</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Tab Content */}
        {activeTab === 'support' && (
          <div className="mb-8 sm:mb-12">
            <div className="bg-pink-50 min-h-screen py-8">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Support</h2>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto">
                  {/* Contact Support Card */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Support</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Email Support */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Email Support</h4>
                        <p className="text-gray-600 text-sm sm:text-base">support@houndheart.com</p>
                      </div>

                      {/* Phone Support */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Phone Support</h4>
                        <p className="text-gray-600 text-sm sm:text-base">1-800-HOUND-HEART</p>
                      </div>

                      {/* Response Time */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Response Time</h4>
                        <p className="text-gray-600 text-sm sm:text-base">Within 24 hours for Premium members</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Medical Research Content - Only show when medical tab is active */}
        {activeTab === 'medical' && (
          <>
            {/* Official Medical and Health Organizations */}
            <div className="mb-12">
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Official Medical and Health Organizations</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* American Heart Association */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">American Heart Association</h3>
                  <p className="text-gray-600 text-sm">
                    Acknowledges cardiovascular benefits of dog ownership—citing lower risks of heart disease,
                    improved physical activity, and increased likelihood of meeting recommended exercise goals
                    (e.g., 150 minutes per week) among dog owners.
                  </p>
                </div>

                {/* Mayo Clinic */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mayo Clinic</h3>
                  <p className="text-gray-600 text-sm">
                    Highlights benefits such as reduced blood pressure, lower stress, improved mood,
                    and increased social connection among dog owners.
                  </p>
                </div>

                {/* Harvard Health */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Harvard Health</h3>
                  <p className="text-gray-600 text-sm">
                    Documents health benefits including stress reduction, improved cardiovascular health,
                    and enhanced well-being among pet owners.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Contact Summary */}
            <div className="mb-12">
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Quick Contact Summary</h2>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-6xl mx-auto">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 text-lg">Physician</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 text-lg">Contact Method</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 text-lg">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dr. Edward T. Creagan */}
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4 text-gray-900 font-semibold text-lg">Dr. Edward T. Creagan</td>
                        <td className="py-4 px-4 text-gray-600">Publisher (for speaking/media/book requests)</td>
                        <td className="py-4 px-4 text-gray-600">(402) 334-2547 or Sandra@SandraWendel.com</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4"></td>
                        <td className="py-4 px-4 text-gray-600">Contact Form on website</td>
                        <td className="py-4 px-4 text-gray-600">Available via 'Ask Doctor Ed' site</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4"></td>
                        <td className="py-4 px-4 text-gray-600">Clinic Address / Phone</td>
                        <td className="py-4 px-4 text-gray-600">Mayo Clinic Rochester, (507) 284-8413 (general clinic line)</td>
                      </tr>

                      {/* Dr. Francisco Lopez-Jimenez */}
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4 text-gray-900 font-semibold text-lg">Dr. Francisco Lopez-Jimenez</td>
                        <td className="py-4 px-4 text-gray-600">Email</td>
                        <td className="py-4 px-4 text-gray-600">lopez@mayo.edu</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4"></td>
                        <td className="py-4 px-4 text-gray-600">Clinic Address / Phone</td>
                        <td className="py-4 px-4 text-gray-600">Mayo Clinic Rochester, +1 507-284-2511</td>
                      </tr>

                      {/* Dr. Nicholas Breiten & Dr. Mohamed Gouda */}
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4 text-gray-900 font-semibold text-lg">Dr. Nicholas Breiten & Dr. Mohamed Gouda</td>
                        <td className="py-4 px-4 text-gray-600">Email</td>
                        <td className="py-4 px-4 text-gray-600">breiten.nicholas@mayoclinic.com</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-4 px-4"></td>
                        <td className="py-4 px-4 text-gray-600">Phone</td>
                        <td className="py-4 px-4 text-gray-600">(507) 284-2511</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Feedback Section */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Is this article helpful?</h3>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Yes
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              No
            </button>
          </div>
        </div> */}

      </div>

      {/* Scientific Community Recognition */}
      {/* <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-700 text-lg leading-relaxed">
            The scientific community increasingly recognizes the profound health benefits of human-animal bonds, 
            validating the principles that guide HoundHeart™'s approach to wellness.
          </p>
        </div>
      </div> */}

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
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Twitter Icon */}
                <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>

                {/* Instagram Icon */}
                <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* LinkedIn Icon */}
                <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

export default HelpCenterPage;