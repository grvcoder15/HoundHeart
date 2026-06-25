import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Country, State, City } from 'country-state-city';
import toast from '../services/toastService';
import apiService from '../services/apiService';

const PreRegisterModal = ({ isOpen, onClose }) => {
  const [showPreRegisterDetails, setShowPreRegisterDetails] = useState(false);
  const [showPreRegisterSuccess, setShowPreRegisterSuccess] = useState(false);
  const [preRegisterSuccessEmail, setPreRegisterSuccessEmail] = useState('');
  const [isPreRegisterSubmitting, setIsPreRegisterSubmitting] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => (selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []), [selectedCountryCode]);
  const cities = useMemo(() => (selectedCountryCode && selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : []), [selectedCountryCode, selectedStateCode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleClose = () => {
    setSelectedCountryCode('');
    setSelectedStateCode('');
    setSelectedCity('');
    setShowPreRegisterDetails(false);
    onClose();
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

    const address = [addressLine1, addressLine2, city, state, country, postalCode].filter(Boolean).join(', ');

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
        source: 'OnlineStorePage'
      };

      await apiService.submitPreRegistration(payload);
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

  if (!isOpen && !showPreRegisterSuccess) return null;

  if (showPreRegisterSuccess) {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 text-center relative animate-in zoom-in duration-300">
          <button onClick={() => { setShowPreRegisterSuccess(false); onClose(); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Registration Successful!</h2>
          <p className="text-gray-600 mb-4">Thank you for joining the HoundHeart™ early access list. We'll be in touch soon with updates and exclusive offers.</p>
          <p className="text-sm text-gray-500 bg-gray-50 py-2 px-3 rounded-lg inline-block">Notification email: <span className="font-semibold">{preRegisterSuccessEmail}</span></p>
          <button onClick={() => { setShowPreRegisterSuccess(false); onClose(); }} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md">
            Return to Store
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="mb-5">
          <h2 className="text-3xl font-bold text-purple-600 mb-2">Pre-Register Now</h2>
          <p className="text-gray-600">Join the early access list for launch updates, product drops, exclusive HoundHeart merchandise announcements, and priority access to future releases.</p>
        </div>

        <div className="mb-5 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-900">Merchandise:</span> Official HoundHeart Merchandise</p>
              <p><span className="font-semibold text-gray-900">Pricing:</span> Special Member Discounts Apply</p>
              <p><span className="font-semibold text-gray-900">Give Back:</span> Portion supports the Legacy Project™</p>
            </div>
            <button type="button" onClick={() => setShowPreRegisterDetails((prev) => !prev)} className="self-start rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-white">
              {showPreRegisterDetails ? 'Less' : 'More'}
            </button>
          </div>

          {showPreRegisterDetails && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">Official HoundHeart Merchandise</p>
                  <p>Get exclusive early access to our premium merchandise drops before the public launch.</p>
                </div>
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">Shipping</p>
                  <p>Free within Continental US. International shipping rates apply outside the U.S.</p>
                </div>
                <div className="bg-white/70 border border-purple-100 rounded-xl p-3 text-gray-700">
                  <p className="font-semibold text-gray-900">Give Back</p>
                  <p>A portion of every sale supports the HoundHeart Legacy Project™.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="space-y-3" onSubmit={handlePreRegisterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input type="text" name="fullName" placeholder="Enter your full name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input type="email" name="email" placeholder="you@example.com" required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" name="phoneNumber" placeholder="Enter your phone number" required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select value={selectedCountryCode} onChange={(e) => { setSelectedCountryCode(e.target.value); setSelectedStateCode(''); setSelectedCity(''); }} required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select country</option>
                {countries.map((countryOption) => (
                  <option key={countryOption.isoCode} value={countryOption.isoCode}>{countryOption.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
              <input type="text" name="addressLine1" placeholder="House/Flat, Street" required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
              <input type="text" name="addressLine2" placeholder="Landmark, Area" className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State / Province</label>
              <select value={selectedStateCode} onChange={(e) => { setSelectedStateCode(e.target.value); setSelectedCity(''); }} disabled={!selectedCountryCode} required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select state</option>
                {states.map((stateOption) => (
                  <option key={stateOption.isoCode} value={stateOption.isoCode}>{stateOption.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedCountryCode || !selectedStateCode} required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select city</option>
                {cities.map((cityOption) => (
                  <option key={`${cityOption.name}-${cityOption.stateCode}`} value={cityOption.name}>{cityOption.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PIN / ZIP Code</label>
              <input type="text" name="postalCode" placeholder="Postal code" required className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" name="consentGiven" id="launch-consent" required className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
            <label htmlFor="launch-consent" className="text-sm text-gray-600">I agree to receive launch updates and invitation emails from HoundHeart™.</label>
          </div>

          <button type="submit" disabled={isPreRegisterSubmitting} className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${isPreRegisterSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-purple-600 hover:to-pink-600'}`}>
            {isPreRegisterSubmitting ? 'Submitting...' : 'Submit Pre-Registration'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PreRegisterModal;
