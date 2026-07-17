import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ requestId, clientSecret, onSuccess, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message);
        toastService.error(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Use paymentIntent.id from the confirmed result (not the stale prop)
        await apiService.handleExpertSessionPaymentSuccess(requestId, paymentIntent.id);
        toastService.success('Payment successful! Session is booked.');
        onSuccess();
      } else if (paymentIntent) {
        setPaymentError(`Unexpected payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      setPaymentError(err.message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {paymentError && <div className="text-red-500 text-sm">{paymentError}</div>}
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition ${
          isProcessing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Pay $30.00 & Confirm Booking'}
      </button>
    </form>
  );
};

const ExpertSessionSlotsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [id]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await apiService.getExpertSessionSlots(id);
      let parsed = data;
      if (data?.data) parsed = data.data;
      setRequest(parsed);
      
      // If already scheduled/confirmed, redirect
      if (parsed.status === 'Scheduled' || parsed.status === 'Confirmed') {
        setIsSuccess(true);
      }
    } catch (err) {
      toastService.error('Failed to load slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async (slotId) => {
    setSelectedSlot(slotId);
    try {
      // Clear previous secret if any
      setClientSecret(null);
      const res = await apiService.confirmExpertSessionSlot(id, slotId);
      const data = res?.data || res;
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      toastService.error('Failed to initiate payment.');
      setSelectedSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-8">
            Your payment was successful and your session is scheduled. Check your email for the meeting link.
          </p>
          <button
            onClick={() => navigate('/my-expert-sessions')}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            View My Sessions
          </button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Request not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Slots */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select a Time Slot</h1>
          <p className="text-gray-500 mb-8">
            The expert has proposed the following times based on your request.
          </p>

          <div className="space-y-4">
            {request.slots?.length > 0 ? (
              request.slots.map(slot => {
                // Ensure UTC parsing by appending Z if missing
                const rawDt = slot.proposedDateTime;
                const dateObj = new Date(rawDt.endsWith('Z') ? rawDt : rawDt + 'Z');
                const isSelected = selectedSlot === slot.slotId;
                
                return (
                  <div 
                    key={slot.slotId}
                    onClick={() => !clientSecret && handleSelectSlot(slot.slotId)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    } ${clientSecret && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {dateObj.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-purple-600 font-medium">
                          {dateObj.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-red-500">No slots available for this request.</p>
            )}
          </div>
        </div>

        {/* Right Column: Payment */}
        <div>
          {clientSecret ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-12 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Payment</h2>
              <div className="flex justify-between text-gray-600 mb-6 pb-6 border-b">
                <span>Expert Video Session (15 min)</span>
                <span className="font-semibold text-gray-900">$30.00</span>
              </div>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <CheckoutForm 
                  requestId={id} 
                  clientSecret={clientSecret} 
                  paymentIntentId={paymentIntentId}
                  onSuccess={() => setIsSuccess(true)} 
                />
              </Elements>
              <button 
                onClick={() => {
                  setClientSecret(null);
                  setSelectedSlot(null);
                }}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-800"
              >
                Change Time Slot
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-2xl border border-gray-200 border-dashed p-8 h-full flex flex-col items-center justify-center text-center opacity-70">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-500 font-medium">Select a time slot to proceed to payment</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExpertSessionSlotsPage;
