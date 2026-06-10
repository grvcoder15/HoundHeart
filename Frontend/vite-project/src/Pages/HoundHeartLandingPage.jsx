import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Country, State, City } from 'country-state-city';
import apiService from '../services/apiService';
import toast from '../services/toastService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HoundHeartLogo from '../assets/images/Houndheart_logo.svg';

// Add validation styling for better visibility
const validationStyles = `
  input:invalid, select:invalid {
    border-color: #ef4444 !important;
    background-color: #fee2e2 !important;
  }
  input:focus:invalid {
    border-color: #dc2626 !important;
    background-color: #fecaca !important;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
  }
  input::placeholder, select::placeholder {
    color: #9ca3af;
  }
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = validationStyles;
  document.head.appendChild(style);
}
import DogIcon from '../assets/images/dog_icon_landingpage.svg';
import OurPhilosophyIcon from '../assets/images/Our Philosophy page icon.svg';
import MoreThanCompanionsLogo from '../assets/images/More Than Companions_logo.svg';
import BondedScoreIcon from '../assets/images/Bonded Score Tracking.svg';
import ChakraRitualsIcon from '../assets/images/Chakra Rituals_icon.svg';
import LegacyJournalIcon from '../assets/images/Legacy Journal_icon.svg';
import HealingCirclesIcon from '../assets/images/Healing Circles_icon.svg';
import WellnessInsightsIcon from '../assets/images/Wellness insights icon.svg';
import ReadyToBeginIcon from '../assets/images/Ready to Begin Your Journey icon.svg';
import EnergyHealingIcon from '../assets/images/energy healing icon.svg';
import TheScienceIcon from '../assets/images/The Science icon.svg';
import EnergyHealingLogo from '../assets/images/Energy Healing_logo.svg';
import TheScienceLogo from '../assets/images/The Science_logo.svg';
import TransformLivesLogo from '../assets/images/Transform Your Lives Together_logo.svg';

const HoundHeartLandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('philosophy');

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPreRegisterModal, setShowPreRegisterModal] = useState(false);
  const [showPreRegisterSuccess, setShowPreRegisterSuccess] = useState(false);
  const [showPreRegisterDetails, setShowPreRegisterDetails] = useState(false);
  const [preRegisterSuccessEmail, setPreRegisterSuccessEmail] = useState('');
  const [isPreRegisterSubmitting, setIsPreRegisterSubmitting] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [launchFlags, setLaunchFlags] = useState({
    enablePreRegistration: true,
    enableTshirtSales: false,
    ctaLabel: 'Pre-Register'
  });
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [isVisible, setIsVisible] = useState({});
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => (selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []), [selectedCountryCode]);
  const cities = useMemo(() => (
    selectedCountryCode && selectedStateCode
      ? City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      : []
  ), [selectedCountryCode, selectedStateCode]);
  const fixedPlans = useMemo(() => ([
    {
      planId: 'free-member',
      tierLevel: 'free',
      planName: 'Free Member',
      description: 'Essential access to begin your HoundHeart journey',
      badge: undefined,
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyOnly: false,
      features: [
        'Create and manage account',
        'Create and manage dog profile(s)',
        'Basic app access',
        'Access to newsletter and announcements',
        'Purchase books and merchandise'
      ]
    },
    {
      planId: 'houndheart-plus',
      tierLevel: 'plus',
      planName: 'HoundHeart Plus',
      description: 'Advanced wellness and connection tools for dedicated members',
      badge: 'Most Popular',
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
      yearlyOnly: false,
      features: [
        'Includes all Free Member features',
        'Full app access',
        'Full Bonded Score access',
        'Wellness tracking tools',
        'Free digital and audio book',
        'Travel directory access',
        'Partner discounts and wearable connection'
      ]
    },
    {
      planId: 'houndheart-premium',
      tierLevel: 'premium',
      planName: 'HoundHeart Premium',
      description: 'The complete premium lifestyle package for top-tier members',
      badge: 'Best Value',
      monthlyPrice: null,
      yearlyPrice: 149.99,
      yearlyOnly: true,
      features: [
        'Includes all HoundHeart Plus features',
        'Paperback HoundHeart book',
        'Official HoundHeart T-shirt',
        '$10 donation to animal welfare charities',
        'Travel Club access and premium discounts',
        'Premium Member badge in profile'
      ]
    }
  ]), []);

  // Function to get icon and title based on active tab
  const getTabContent = (tab) => {
    switch (tab) {
      case 'philosophy':
        return {
          icon: MoreThanCompanionsLogo,
          title: 'More Than Companions'
        };
      case 'energy':
        return {
          icon: EnergyHealingLogo,
          title: 'Energy Healing'
        };
      case 'science':
        return {
          icon: TheScienceLogo,
          title: 'The Science'
        };
      case 'journey':
        return {
          icon: TransformLivesLogo,
          title: 'Transform Your Lives Together'
        };
      default:
        return {
          icon: OurPhilosophyIcon,
          title: 'More Than Companions'
        };
    }
  };

  // Scroll animation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleOpenPreRegister = () => {
    if (launchFlags.enableTshirtSales) {
      handlePricingClick();
      return;
    }

    if (!launchFlags.enablePreRegistration) {
      toast.info('Pre-registration is currently closed.');
      return;
    }

    setSelectedCountryCode('');
    setSelectedStateCode('');
    setSelectedCity('');
    setShowPreRegisterDetails(false);
    setShowPreRegisterModal(true);
  };

  const handleClosePreRegisterModal = () => {
    setSelectedCountryCode('');
    setSelectedStateCode('');
    setSelectedCity('');
    setShowPreRegisterDetails(false);
    setShowPreRegisterModal(false);
  };

  const handleClosePreRegisterSuccess = () => {
    setShowPreRegisterSuccess(false);
    setPreRegisterSuccessEmail('');
  };

  const handlePreRegisterSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phoneNumber = String(formData.get('phoneNumber') || '').trim();
    const addressLine1 = String(formData.get('addressLine1') || '').trim();
    const addressLine2 = String(formData.get('addressLine2') || '').trim();
    const city = selectedCity.trim();
    const state = states.find((s) => s.isoCode === selectedStateCode)?.name?.trim() || '';
    const country = countries.find((c) => c.isoCode === selectedCountryCode)?.name?.trim() || '';
    const postalCode = String(formData.get('postalCode') || '').trim();
    const consentGiven = formData.get('consentGiven') === 'on';

    const address = [addressLine1, addressLine2, city, state, country, postalCode]
      .filter(Boolean)
      .join(', ');

    if (!fullName || !email || !phoneNumber || !addressLine1 || !city || !state || !country || !postalCode) {
      toast.error('Please complete all required shipping fields.');
      return;
    }

    if (!consentGiven) {
      toast.error('Please agree to receive launch updates before submitting.');
      return;
    }

    try {
      setIsPreRegisterSubmitting(true);
      const payload = {
        fullName,
        email,
        phoneNumber,
        address,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        consentGiven,
        source: 'LandingHeader'
      };

      await apiService.submitPreRegistration(payload);
      setShowPreRegisterModal(false);
      setShowPreRegisterSuccess(true);
      setPreRegisterSuccessEmail(email);
      setSelectedCountryCode('');
      setSelectedStateCode('');
      setSelectedCity('');
      e.currentTarget?.reset?.();
    } catch (error) {
      toast.error(error.message || 'Failed to submit pre-registration. Please try again.');
    } finally {
      setIsPreRegisterSubmitting(false);
    }
  };



  const handleCloseSignupModal = () => {
    setShowSignupModal(false);
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };

  const handlePricingCardClick = () => {
    navigate('/signup');
  };

  useEffect(() => {
    const fetchLaunchFlags = async () => {
      const data = await apiService.getPublicLaunchFlags();
      setLaunchFlags({
        enablePreRegistration: data?.enablePreRegistration ?? true,
        enableTshirtSales: data?.enableTshirtSales ?? false,
        ctaLabel: data?.ctaLabel || ((data?.enableTshirtSales ?? false) ? 'Buy T-Shirt' : 'Pre-Register')
      });
    };

    fetchLaunchFlags();
  }, []);

  useEffect(() => {
    if (!showPreRegisterModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showPreRegisterModal]);

  useEffect(() => {
    if (!showPreRegisterSuccess) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showPreRegisterSuccess]);

  const plans = useMemo(() => {
    return fixedPlans.map((plan) => {
      if (plan.tierLevel === 'free') {
        return {
          ...plan,
          price: 0,
          billingLabel: 'Forever',
          originalPrice: undefined,
          savingsText: undefined
        };
      }

      if (plan.tierLevel === 'plus') {
        if (billingPeriod === 'yearly') {
          const fullYearAtMonthly = (plan.monthlyPrice || 0) * 12;
          return {
            ...plan,
            price: plan.yearlyPrice,
            billingLabel: 'Per Year',
            originalPrice: fullYearAtMonthly.toFixed(2),
            savingsText: `Save $${(fullYearAtMonthly - (plan.yearlyPrice || 0)).toFixed(2)} per year`
          };
        }

        return {
          ...plan,
          price: plan.monthlyPrice,
          billingLabel: 'Per Month',
          originalPrice: undefined,
          savingsText: undefined
        };
      }

      return {
        ...plan,
        price: plan.yearlyPrice,
        billingLabel: 'Per Year (Yearly Only)',
        originalPrice: undefined,
        savingsText: undefined
      };
    });
  }, [billingPeriod, fixedPlans]);




  const handleTryNow = (feature) => {
    console.log(`Trying ${feature}`);
    navigate('/login');
  };


  const handleFeaturesClick = () => {
    // Scroll to the Transform Your Connection section
    const featuresSection = document.getElementById('transform-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleAboutClick = () => {
    navigate('/about-us');
  };

  const handleAboutNavClick = () => {
    // Scroll to the About section on the same page
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleFooterNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleHomeClick = () => {
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handlePremiumClick = () => {
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePricingClick = () => {
    // Scroll to the pricing section
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleHelpCenterClick = () => {
    navigate('/help-center');
  };

  // About Section Component
  const AboutSection = () => (
    <section id="about-section" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About HoundHeart™</h2>
          <h2 className="text-xl text-gray-600">Discover the power of energetic harmony with your dog.</h2>

        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('philosophy')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'philosophy'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              Our Philosophy
            </button>
            <button
              onClick={() => setActiveTab('energy')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'energy'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              Energy Healing
            </button>
            <button
              onClick={() => setActiveTab('science')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'science'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              The Science
            </button>
            <button
              onClick={() => setActiveTab('journey')}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'journey'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
                }`}
            >
              Your Journey
            </button>

          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Icon */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                <img
                  src={getTabContent(activeTab).icon}
                  alt={getTabContent(activeTab).title}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">{getTabContent(activeTab).title}</h3>
            </div>

            {/* Right Side - Text */}
            <div className="space-y-6">
              {activeTab === 'philosophy' && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    At HoundHeart™, we believe your dog is more than a companion. Dogs are naturally energetic healers
                    who feel each moment in the raw, full-bodied joy of now and radiate the highest vibrations of love,
                    trust, gratitude, duty, and loyalty.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Your dog's natural gift gives you access to energetic harmony, the root of a power to synergistically
                    heal you inside. That synergy benefits you both in ways science is only beginning to understand.
                  </p>
                </div>
              )}
              {activeTab === 'energy' && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    In everyday life, stress, challenges, and conflicts create what we call energy ridges—dense collision points of opposing energy flows formed when your natural forward movement meets the resistance of daily living.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    These ridges are experienced as emotional or physical pain and upsets, restricting and scattering your life energy, and contributing to illness, be it chronic or acute.
                    Your dog's pure presence and high-vibration energy helps dissolve these ridges, clearing the way for balance, vitality, and emotional well-being.
                  </p>
                </div>
              )}
              {activeTab === 'science' && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Ancient Wisdom Meets Modern Science
                    Your own consciousness and loving energy strengthen and nourish your dog's energy flows, creating a mutual exchange that deepens your bond and supports both your health and your dog's.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    We draw on both ancient wisdom-such as chakra alignment-and modern biofeedback to make these benefits accessible in your daily life through wearable integration, guided practices, and intuitive tools.
                  </p>
                </div>
              )}
              {activeTab === 'journey' && (
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    HoundHeart™ is designed to help you harness this connection. You'll learn to align with your dog's natural rhythms, sync your energy fields, and support each other's well-being on every level: physical, emotional, and spiritual.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    HoundHeart™ is more than technology. It is a pathway to a deeper relationship with your dog and a healthier, more vibrant you. Together, you and your dog can create a field of love and presence powerful enough to transform both your lives.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );



  // Premium Section Component
  const PremiumSection = () => (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Premium Experience</h2>
          <p className="text-xl text-gray-600">Unlock advanced features for deeper spiritual connection</p>
        </div>

        {/* Premium Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Side - Features List */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Coaching Sessions</h3>
                <p className="text-gray-600">One-on-one guidance from certified spiritual dog trainers</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Chakra Practices</h3>
                <p className="text-gray-600">Deep dive into energy healing techniques for you and your dog</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exclusive Healing Circles</h3>
                <p className="text-gray-600">Access to private, intimate group sessions with limited participants</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Support</h3>
                <p className="text-gray-600">24/7 access to our spiritual guidance team</p>
              </div>
            </div>
          </div>

          {/* Right Side - CTA */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Go Premium?</h3>
            <p className="text-purple-100 mb-6">Transform your relationship with advanced spiritual practices</p>
            <button
              onClick={handlePricingCardClick}
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );



  // Premium Upgrade Modal Component
  const PremiumModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleClosePremiumModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl p-6 lg:p-8 relative animate-slideUp max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClosePremiumModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-orange-500">Upgrade to Premium</h2>
          </div>
          <p className="text-gray-600 text-lg">Unlock the full potential of your spiritual journey with your dog</p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-full p-1 flex relative">
            <button
              onClick={() => setIsYearlyPlan(false)}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 text-lg ${!isYearlyPlan ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearlyPlan(true)}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-300 relative text-lg ${isYearlyPlan ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-sm px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <div className={`border-2 rounded-xl p-6 ${!isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Monthly Plan</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">$19.99<span className="text-xl font-normal">/month</span></div>
            <p className="text-base text-gray-600">Billed monthly, cancel anytime</p>
          </div>

          {/* Yearly Plan */}
          <div className={`border-2 rounded-xl p-6 relative ${isYearlyPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
            {isYearlyPlan && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Yearly Plan</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">$199.99<span className="text-xl font-normal">/year</span></div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xl text-gray-500 line-through">$239.00</span>
              <span className="text-base text-green-600 font-medium">Save $30.00</span>
            </div>
            <p className="text-base text-gray-600">Billed yearly, cancel anytime</p>
          </div>
        </div>

        {/* Premium Features */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Premium Features</h3>
          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Unlimited Chakra Rituals</h4>
                <p className="text-base text-gray-600">Access to all 7 chakra alignment practices and advanced guided meditations</p>
              </div>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Exclusive Healing Circles</h4>
                <p className="text-base text-gray-600">Monthly premium group sessions and workshops with expert facilitators</p>
              </div>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Advanced Aura Tracking</h4>
                <p className="text-base text-gray-600">Deep energy field analysis and detailed bonded score insights</p>
              </div>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Legacy Export & Archive</h4>
                <p className="text-base text-gray-600">Download your complete journal as a beautiful PDF and backup all memories</p>
              </div>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="text-center">
          <button
            onClick={handlePricingCardClick}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );

  const preRegisterModal = (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
        <button
          onClick={handleClosePreRegisterModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h2 className="text-3xl font-bold text-purple-600 mb-2">Pre-Register for Launch</h2>
          <p className="text-gray-600">Join the early list for launch access, drop alerts, and your invite-first checkout link for the HoundHeart tee.</p>
        </div>

        <div className="mb-5 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-900">Shirt:</span> HoundHeart™ — My Dog Likes...</p>
              <p><span className="font-semibold text-gray-900">Shipping:</span> Free within Continental US...</p>
              <p><span className="font-semibold text-gray-900">Give Back:</span> $10 from every shirt...</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreRegisterDetails((prev) => !prev)}
              className="self-start rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-white"
            >
              {showPreRegisterDetails ? 'Less' : 'More'}
            </button>
          </div>

          {showPreRegisterDetails && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">HoundHeart™ — My Dog Likes Me Anyway</p>
                  <p>$25. One color for all orders. Multiple sizes available.</p>
                </div>
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">Shipping</p>
                  <p>Free within Continental US. International shipping rates apply outside the U.S.</p>
                </div>
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">Give Back</p>
                  <p>$10 from every shirt supports animal welfare organizations helping dogs and other animals.</p>
                </div>
              </div>

              <div className="rounded-xl border border-purple-100 bg-white/60 p-4">
                <h3 className="text-base font-bold text-gray-900 mb-2">Every Shirt Helps a Dog</h3>
                <p className="text-sm text-gray-700 mb-3">
                  $10 from each shirt sold is donated to a trusted animal welfare organization based on the purchaser's country.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1 text-sm text-gray-700 mb-3">
                  <p><span className="font-semibold">United States:</span> Best Friends Animal Society</p>
                  <p><span className="font-semibold">Canada:</span> Humane Canada</p>
                  <p><span className="font-semibold">United Kingdom:</span> Dogs Trust</p>
                  <p><span className="font-semibold">Australia:</span> RSPCA Australia</p>
                  <p><span className="font-semibold">New Zealand:</span> SPCA New Zealand</p>
                  <p><span className="font-semibold">Norway:</span> Dyrebeskyttelsen Norge</p>
                  <p className="md:col-span-2"><span className="font-semibold">European Union (other EU countries):</span> Eurogroup for Animals</p>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-semibold">Simple Promise:</span> You buy the shirt. We donate $10. Dogs get helped.</p>
                  <p><span className="font-semibold">Transparency:</span> Monthly donation totals will be posted on this page.</p>
                  <p><span className="font-semibold">Checkout Note:</span> Your purchase includes a $10 donation for your region.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="space-y-3" onSubmit={handlePreRegisterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select
                value={selectedCountryCode}
                onChange={(e) => {
                  setSelectedCountryCode(e.target.value);
                  setSelectedStateCode('');
                  setSelectedCity('');
                }}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select country</option>
                {countries.map((countryOption) => (
                  <option key={countryOption.isoCode} value={countryOption.isoCode}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                placeholder="House/Flat, Street"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
              <input
                type="text"
                name="addressLine2"
                placeholder="Landmark, Area"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State / Province</label>
              <select
                value={selectedStateCode}
                onChange={(e) => {
                  setSelectedStateCode(e.target.value);
                  setSelectedCity('');
                }}
                disabled={!selectedCountryCode}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select state</option>
                {states.map((stateOption) => (
                  <option key={stateOption.isoCode} value={stateOption.isoCode}>
                    {stateOption.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select
                name="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedCountryCode || !selectedStateCode}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select city</option>
                {cities.map((cityOption) => (
                  <option key={`${cityOption.name}-${cityOption.stateCode}`} value={cityOption.name}>
                    {cityOption.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PIN / ZIP Code</label>
              <input
                type="text"
                name="postalCode"
                placeholder="Postal code"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consentGiven"
              id="launch-consent"
              required
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="launch-consent" className="text-sm text-gray-600">
              I agree to receive launch updates and invitation emails from HoundHeart™.
            </label>
          </div>

          <button
            type="submit"
            disabled={isPreRegisterSubmitting}
            className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${isPreRegisterSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-purple-600 hover:to-pink-600'}`}
          >
            {isPreRegisterSubmitting ? 'Submitting...' : 'Submit Pre-Registration'}
          </button>
        </form>
      </div>
    </div>
  );

  const preRegisterSuccessModal = (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-7 relative border border-purple-100">
        <button
          onClick={handleClosePreRegisterSuccess}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close success popup"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">You are officially pre-registered!</h3>
          <p className="text-gray-600 mb-3">
            Your launch spot is secured. We will notify you via email the moment HoundHeart goes live.
          </p>

          {preRegisterSuccessEmail && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-2 mb-4 text-sm text-purple-700 break-all">
              Notification email: <span className="font-semibold">{preRegisterSuccessEmail}</span>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-3 mb-5 text-left">
            <p className="text-sm font-semibold text-gray-900 mb-1">What happens next?</p>
            <p className="text-sm text-gray-600">You will get early launch access, product drop alerts, and first-checkout invite.</p>
          </div>

          <button
            onClick={handleClosePreRegisterSuccess}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Awesome, I am in!
          </button>
        </div>
      </div>
    </div>
  );

  // Signup Modal Component
  const SignupModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-slideUp">
        {/* Close Button */}
        <button
          onClick={handleCloseSignupModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-purple-600 mb-2">Join HoundHeart™</h2>
          <p className="text-gray-600">Begin your spiritual journey</p>
        </div>

        {/* Form */}
        <form className="space-y-6">
          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I accept the{' '}
              <button onClick={() => handleFooterNavigation('/terms-of-use')} className="text-purple-500 hover:text-purple-600 font-medium">
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                onClick={() => navigate('/privacy-policy')}
                className="text-purple-500 hover:text-purple-600 font-medium"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Create Account
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={handleLogin}
              className="text-purple-500 hover:text-purple-600 font-medium border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Separator */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex space-x-3">
          {/* Google Button */}
          <button className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 font-medium">Google</span>
          </button>

          {/* Apple Button */}
          <button className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-gray-700 font-medium">Apple</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Hero Section Component
  const HeroSection = () => (
    <section className="relative bg-gradient-to-b from-white to-purple-50 py-20 overflow-hidden">
      {/* Animated floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-pink-300 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Subtle curved lines in background - positioned like in your image */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-64 opacity-10">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <path d="M0,150 Q100,100 200,150 T400,150" stroke="#8b5cf6" strokeWidth="1" fill="none" className="animate-pulse" />
          <path d="M0,180 Q100,130 200,180 T400,180" stroke="#ec4899" strokeWidth="1" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <path d="M0,160 Q100,110 200,160 T400,160" stroke="#a855f7" strokeWidth="1" fill="none" className="animate-pulse" style={{ animationDelay: '2s' }} />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Title with Gradient - exactly as in your image */}
        <motion.h1
          className="text-5xl lg:text-6xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.span
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Deepen Your Bond with Your Dog,
          </motion.span>
          <br />
          <motion.span
            className="text-purple-600"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Spiritually & Emotionally
          </motion.span>
        </motion.h1>

        {/* Subtitle - exact text from your image */}
        <motion.p
          className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Discover the spiritual connection between you and your canine companion through guided chakra practices,
          mindful journaling, and a supportive community of fellow dog lovers.
        </motion.p>

        {/* Hero Content - Side by Side Layout like reference image */}
        <div className="flex items-center justify-center relative">
          {/* Dog Icon from assets - Left Side */}
          <motion.div
            className="flex-shrink-0 relative z-12"
            initial={{ opacity: 0, x: -100, rotate: -10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <div className="w-58 h-58 flex items-center justify-center px-10 py-10">
              <motion.img
                src={DogIcon}
                alt="Cute dog"
                className="w-75 h-75 py-18 object-contain cursor-pointer"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
              />
            </div>
          </motion.div>

          {/* CTA Button - Right Side with moderate overlap like reference image */}
          <motion.div
            className="flex-shrink-0 relative z-20 -ml-16 mt-11"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
          >
            <motion.button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg relative overflow-hidden group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <span className="relative z-10">Begin Your Journey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <img
                src={HoundHeartLogo}
                alt="HoundHeart Logo"
                className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">HoundHeart™</h1>
            </div>

            {/* Center - Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={handleAboutNavClick}
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
              <button
                onClick={handlePricingClick}
                className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 cursor-pointer relative group"
              >
                Online Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button>
              {/* <button
                onClick={handlePremiumClick}
                className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 cursor-pointer relative group"
              >
                Premium
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </button> */}
            </nav>

            {/* Right Side - Login/Register + Launch CTA */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenPreRegister}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
              >
                {launchFlags.ctaLabel}
              </button>

              <div className="flex items-center space-x-2 group">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <button
                  onClick={handleLogin}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105"
                >
                  Login/Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Order: Always show Hero Section first, then other sections */}
      <>
        {/* Hero Section Always First */}
        <HeroSection />

        {/* About Section */}
        <AboutSection />
      </>

      {/* Transform Your Connection Section */}
      <section id="transform-section" className="py-20 bg-gray-50 relative">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transform Your Connection</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform offers unique tools and practices designed to enhance the spiritual bond between you and your dog.
            </p>
          </div>


          {/* Feature Cards - All 5 cards in horizontal layout */}
          <div className="flex flex-nowrap gap-4 justify-center overflow-x-auto pb-4 scrollbar-hide">
            {/* Card 1: Bonded Score Tracking */}
            <div
              id="card-1"
              data-animate
              className={`bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-56 ${isVisible['card-1'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: '0.1s' }}
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors duration-300 group-hover:scale-110">
                <img src={BondedScoreIcon} alt="Bonded Score Tracking" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors duration-300">Bonded Score Tracking</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Monitor and strengthen your spiritual connection with your dog through guided practices and mindful moments.
              </p>
              <button
                onClick={() => handleTryNow('Bonded Score Tracking')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-all duration-300"
              >
                Try Now →
              </button>
            </div>

            {/* Card 2: Chakra Rituals */}
            <div
              id="card-2"
              data-animate
              className={`bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-56 ${isVisible['card-2'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors duration-300 group-hover:scale-110">
                <img src={ChakraRitualsIcon} alt="Chakra Rituals" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">Chakra Rituals</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Experience guided meditation and energy alignment practices designed for you and your canine companion.
              </p>
              <button
                onClick={() => handleTryNow('Chakra Rituals')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-all duration-300"
              >
                Try Now →
              </button>
            </div>

            {/* Card 3: Legacy Journal */}
            <div
              id="card-3"
              data-animate
              className={`bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-56 ${isVisible['card-3'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: '0.3s' }}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors duration-300 group-hover:scale-110">
                <img src={LegacyJournalIcon} alt="Legacy Journal" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">Legacy Journal</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Preserve precious memories, write letters to your dog, and create a lasting digital legacy of your bond.
              </p>
              <button
                onClick={() => handleTryNow('Legacy Journal')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-all duration-300"
              >
                Try Now →
              </button>
            </div>

            {/* Card 4: Healing Circles */}
            <div
              id="card-4"
              data-animate
              className={`bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-56 ${isVisible['card-4'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: '0.4s' }}
            >
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors duration-300 group-hover:scale-110">
                <img src={HealingCirclesIcon} alt="Healing Circles" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors duration-300">Healing Circles</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Join our supportive community for live healing sessions and connect with other spiritual dog lovers.
              </p>
              <button
                onClick={() => handleTryNow('Healing Circles')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-all duration-300"
              >
                Try Now →
              </button>
            </div>

            {/* Card 5: Wellness Insights */}
            <div
              id="card-5"
              data-animate
              className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-56 opacity-100 translate-y-0"
              style={{ transitionDelay: '0.5s' }}
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors duration-300 group-hover:scale-110">
                <img src={WellnessInsightsIcon} alt="Wellness Insights" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors duration-300">Wellness Insights</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                AI-powered analysis of stress patterns and wellness recommendations.
              </p>
              <button
                onClick={() => handleTryNow('Wellness Insights')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-all duration-300"
              >
                Try Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Highlights Section */}


      {/* Ready to Begin Your Journey Section */}
      <section
        id="ready-section"
        data-animate
        className={`py-20 bg-gradient-to-r from-pink-500 to-purple-600 relative overflow-hidden ${isVisible['ready-section'] ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-1000`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 right-20 w-6 h-6 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Ready to Begin Icon */}
          <div
            id="ready-icon"
            data-animate
            className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-1000 delay-200 ${isVisible['ready-icon'] ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-180'
              }`}
          >
            <img
              src={ReadyToBeginIcon}
              alt="Ready to Begin"
              className="w-8 h-8 hover:scale-110 transition-transform duration-300"
            />
          </div>

          {/* Title */}
          <h2
            id="ready-title"
            data-animate
            className={`text-4xl font-bold text-white mb-6 transition-all duration-1000 delay-400 ${isVisible['ready-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Ready to Begin Your Journey?
          </h2>

          {/* Subtitle */}
          <p
            id="ready-subtitle"
            data-animate
            className={`text-xl text-white/90 mb-8 leading-relaxed transition-all duration-1000 delay-600 ${isVisible['ready-subtitle'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Start your journey toward deeper connection and energetic harmony with your beloved companion.
          </p>

          {/* CTA Button */}
          <div
            id="ready-button"
            data-animate
            className={`transition-all duration-1000 delay-800 ${isVisible['ready-button'] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
          >
            <button
              onClick={handleGetStarted}
              className="bg-white text-gray-900 px-12 py-4 rounded-full text-xl font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Get Started Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Online Pricing Section */}
      <section
        id="pricing-section"
        data-animate
        className={`py-20 bg-white ${isVisible['pricing-section'] ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-1000`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div
            id="pricing-header"
            data-animate
            className={`text-center mb-16 transition-all duration-1000 ${isVisible['pricing-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <h2 className="text-4xl font-bold text-gray-900">Online Pricing</h2>
          </div>

          {/* Billing Toggle Header */}
          <div className="flex justify-center mb-10">
            <div className="bg-gray-100 p-1 rounded-xl inline-flex items-center">
              <span className={`text-sm font-medium mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-14 h-7 bg-purple-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out ${billingPeriod === 'yearly' ? 'transform translate-x-7' : ''
                  }`}></div>
              </button>
              <span className={`text-sm font-medium ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className={`grid grid-cols-1 gap-8 max-w-6xl mx-auto ${plans.length === 1
              ? 'md:grid-cols-1 max-w-md'
              : plans.length === 2
                ? 'md:grid-cols-2 max-w-4xl'
                : 'md:grid-cols-3'
            }`}>
            {plans.map((plan) => {
                const isFree = plan.price === 0;
                const isPopular = plan.badge === 'Most Popular';

                return (
                  <div
                    key={plan.planId}
                    className={`relative rounded-2xl border-2 p-5 transition-all hover:shadow-xl ${isPopular
                      ? 'border-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-white'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        {plan.badge}
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${isFree ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-600 to-pink-600'
                      }`}>
                      {isFree ? (
                        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : isPopular ? (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      )}
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-lg font-bold text-center text-gray-900 mb-1">
                      {plan.planName}
                    </h3>
                    <p className="text-xs text-center text-gray-600 mb-3">{plan.description}</p>

                    {/* Price */}
                    <div className="text-center mb-3">
                      {plan.originalPrice && (
                        <div className="text-xs text-gray-500 line-through mb-1">
                          ${plan.originalPrice}
                        </div>
                      )}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {plan.billingLabel}
                        </span>
                      </div>
                      {plan.savingsText && (
                        <div className="text-xs text-green-600 font-semibold mt-1">
                          {plan.savingsText}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <svg
                            className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={handlePricingCardClick}
                      className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                    >
                      {isFree ? 'Start Free' : plan.tierLevel === 'premium' ? 'Get Premium' : 'Get Plus'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section */}
          <div className="flex justify-between items-start mb-8">
            {/* Left Section - Branding and Social */}
            <div className="space-y-4">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
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
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Twitter Icon */}
                <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>

                {/* Instagram Icon */}
                <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* LinkedIn Icon */}
                <a href="#" className="w-12 h-12  rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

      {/* Pre-Register Modal */}
      {showPreRegisterModal && createPortal(preRegisterModal, document.body)}

      {/* Pre-Register Success Modal */}
      {showPreRegisterSuccess && createPortal(preRegisterSuccessModal, document.body)}

      {/* Signup Modal */}
      {showSignupModal && <SignupModal />}

      {/* Premium Modal */}
      {showPremiumModal && <PremiumModal />}
    </div>
  );
};

export default HoundHeartLandingPage;
