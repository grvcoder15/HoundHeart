import React, { useEffect, useState } from 'react';
import { useNotificationPopup } from '../hooks/useNotificationPopup';

const NOTIFICATION_CONFIGS = {
  fitbit_connected: {
    icon: '💙',
    title: 'Fitbit Connected!',
    message: "Your Fitbit device is now connected. We'll start monitoring your health data.",
    colors: {
      bg: 'bg-white',
      border: 'border-blue-100',
      iconBg: 'bg-blue-50',
      title: 'text-blue-900',
      progress: 'bg-blue-500'
    }
  },
  fitbark_connected: {
    icon: '🐾',
    title: 'FitBark Connected!',
    message: "Your FitBark device is now connected. Tommy's activity tracking begins now!",
    colors: {
      bg: 'bg-white',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50',
      title: 'text-emerald-900',
      progress: 'bg-emerald-500'
    }
  },
  baseline_formed: {
    icon: '🎯',
    title: 'Baseline Established!',
    message: "Excellent! Your baseline has been formed. We can now detect meaningful changes in your bond.",
    colors: {
      bg: 'bg-white',
      border: 'border-purple-100',
      iconBg: 'bg-purple-50',
      title: 'text-purple-900',
      progress: 'bg-purple-500'
    }
  },
  score_increased: {
    icon: '🌟',
    title: 'Bond Score Surge!',
    message: "Your bond with Tommy has strengthened significantly! Keep up the amazing connection.",
    colors: {
      bg: 'bg-white',
      border: 'border-yellow-100',
      iconBg: 'bg-yellow-50',
      title: 'text-yellow-700',
      progress: 'bg-yellow-400'
    }
  },
  score_decreased: {
    icon: '⚠️',
    title: 'Bond Score Drop',
    message: "Your bond score has dropped. Tommy might need some extra love and attention today.",
    colors: {
      bg: 'bg-white',
      border: 'border-orange-100',
      iconBg: 'bg-orange-50',
      title: 'text-orange-800',
      progress: 'bg-orange-500'
    }
  }
};

const NotificationPopup = () => {
  const { currentNotification, dismissPopup } = useNotificationPopup();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (currentNotification) {
      setIsVisible(true);
      setProgress(100);
      
      const startTime = Date.now();
      const duration = 4000;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 16); // ~60fps
      
      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const config = NOTIFICATION_CONFIGS[currentNotification.type];
  if (!config) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={dismissPopup} />
      
      {/* Popup Card */}
      <div 
        className={`relative z-10 w-full max-w-[400px] mx-4 overflow-hidden rounded-[20px] shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'} ${config.colors.bg} border ${config.colors.border}`}
      >
        {/* Close Button */}
        <button 
          onClick={dismissPopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 pb-10 flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4 ${config.colors.iconBg}`}>
            {config.icon}
          </div>
          
          {/* Title */}
          <h2 className={`text-[22px] font-bold mb-3 ${config.colors.title}`}>
            {config.title}
          </h2>
          
          {/* Message */}
          <p className="text-[16px] text-gray-500 leading-relaxed">
            {config.message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
          <div 
            className={`h-full ${config.colors.progress} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
