import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toastService from '../services/toastService';
import apiService from '../services/apiService';

const WearableIntegrationPage = () => {
    const navigate = useNavigate();
    
    const [devices, setDevices] = useState({
        human: [
            { id: 'apple', name: 'Apple Health', category: 'Human', icon: '🍎', connected: localStorage.getItem('appleConnected') === 'true', lastSync: localStorage.getItem('appleConnected') === 'true' ? '2 mins ago' : '-' },
            { id: 'fitbit', name: 'Fitbit', category: 'Human', icon: '💠', connected: false, lastSync: '-', isConnecting: false },
            { id: 'garmin', name: 'Garmin', category: 'Human', icon: '🔺', connected: false, lastSync: '-' },
        ],
        dog: [
            { id: 'hound-collar', name: 'HoundHeart Smart Collar', category: 'Dog', icon: '💜', connected: localStorage.getItem('petpaceConnected') === 'true', lastSync: localStorage.getItem('petpaceConnected') === 'true' ? 'Active Now' : '-' },
            { id: 'fi', name: 'Fi Smart Collar', category: 'Dog', icon: '⚡', connected: false, lastSync: '-' },
            { id: 'whistle', name: 'Whistle Tracker', category: 'Dog', icon: '📯', connected: false, lastSync: '-' },
        ]
    });

    // Check Fitbit connection status on component mount
    useEffect(() => {
        checkFitbitStatus();
    }, []);

    const getUserId = () => {
        return localStorage.getItem('userId') || apiService.getCurrentUserId();
    };

    const checkFitbitStatus = async () => {
        try {
            const userId = getUserId();
            if (!userId) return;
            
            const response = await apiService.getFitbitStatus(userId);
            
            setDevices(prev => ({
                ...prev,
                human: prev.human.map(d => 
                    d.id === 'fitbit' ? {
                        ...d,
                        connected: response.success,
                        lastSync: response.success ? response.data?.lastSync || 'Active' : '-'
                    } : d
                )
            }));
        } catch (error) {
            console.error('Error checking Fitbit status:', error);
        }
    };

    const handleFitbitConnect = async () => {
        const userId = getUserId();
        if (!userId) {
            toastService.error('Please log in to connect Fitbit');
            return;
        }

        // 🚀 Fix: Open popup immediately on user click to avoid browser blocking
        // We open it with a loading state while we fetch the URL from the backend
        const authWindow = window.open('about:blank', 'fitbitAuth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        if (!authWindow) {
            toastService.error('❌ Popup blocked! Please allow popups for this site.');
            return;
        }

        // Show loading in the popup
        authWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;text-align:center;"><div><h2 style="color:#6366f1;">Initializing Connection...</h2><p>Please wait while we redirect you to Fitbit.</p></div></body></html>');

        try {
            // Set connecting state in UI
            setDevices(prev => ({
                ...prev,
                human: prev.human.map(d => 
                    d.id === 'fitbit' ? { ...d, isConnecting: true } : d
                )
            }));

            // Get authorization URL from backend
            const response = await apiService.getFitbitAuthUrl(userId);
            
            if (response.success && response.data.authUrl) {
                // Update the existing popup with the actual URL
                authWindow.location.href = response.data.authUrl;
                
                toastService.info('🔄 Complete Fitbit authorization in the popup window');

                // Monitor for successful connection
                const checkConnection = setInterval(async () => {
                    try {
                        const statusResponse = await apiService.getFitbitStatus(userId);
                        
                        if (statusResponse.success) {
                            // Connection successful!
                            setDevices(prev => ({
                                ...prev,
                                human: prev.human.map(d => 
                                    d.id === 'fitbit' ? {
                                        ...d,
                                        connected: true,
                                        lastSync: 'Just now',
                                        isConnecting: false
                                    } : d
                                )
                            }));
                            
                            clearInterval(checkConnection);
                            // The popup will close itself in mock mode, but we close it here as well for safety
                            if (authWindow && !authWindow.closed) {
                                // Small delay to let the "Success" screen show on mock page if applicable
                                setTimeout(() => authWindow.close(), 1000);
                            }
                            
                            toastService.success('✅ Fitbit connected successfully! Data sync starting...');
                        }
                    } catch (error) {
                        // Still checking...
                    }
                }, 2000);
                
                // Stop checking after 5 minutes
                setTimeout(() => {
                    clearInterval(checkConnection);
                    setDevices(prev => ({
                        ...prev,
                        human: prev.human.map(d => 
                            d.id === 'fitbit' ? { ...d, isConnecting: false } : d
                        )
                    }));
                }, 300000);
                
            } else {
                authWindow.close();
                throw new Error(response.message || 'Failed to get authorization URL');
            }

        } catch (error) {
            console.error('Fitbit connection error:', error);
            if (authWindow) authWindow.close();
            toastService.error(`❌ Failed to connect Fitbit: ${error.message}`);
            
            setDevices(prev => ({
                ...prev,
                human: prev.human.map(d => 
                    d.id === 'fitbit' ? { ...d, isConnecting: false } : d
                )
            }));
        }
    };

    const handleFitbitDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Fitbit? This will stop data sync.')) {
            return;
        }

        try {
            const userId = getUserId();
            if (!userId) return;

            await apiService.disconnectFitbit(userId);
            
            setDevices(prev => ({
                ...prev,
                human: prev.human.map(d => 
                    d.id === 'fitbit' ? {
                        ...d,
                        connected: false,
                        lastSync: '-'
                    } : d
                )
            }));
            
            toastService.success('📱 Fitbit disconnected successfully');
        } catch (error) {
            console.error('Fitbit disconnect error:', error);
            toastService.error(`❌ Failed to disconnect Fitbit: ${error.message}`);
        }
    };

    const toggleDevice = (type, id) => {
        if (id === 'fitbit') {
            const fitbitDevice = devices.human.find(d => d.id === 'fitbit');
            if (fitbitDevice?.connected) {
                handleFitbitDisconnect();
            } else {
                handleFitbitConnect();
            }
            return;
        }

        // Handle other devices (Apple Health, PetPace, etc.)
        setDevices(prev => {
            const newDevices = {
                ...prev,
                [type]: prev[type].map(d => 
                    d.id === id ? { ...d, connected: !d.connected, lastSync: !d.connected ? 'Active Now' : '-' } : d
                )
            };
            
            // Persist to localStorage for Sandbox simulation
            if (id === 'apple') {
                const newState = !prev.human.find(d => d.id === 'apple').connected;
                localStorage.setItem('appleConnected', newState);
                if (newState) toastService.success('Apple Health permissions granted (Sandbox)');
            }
            if (id === 'hound-collar') {
                const newState = !prev.dog.find(d => d.id === 'hound-collar').connected;
                localStorage.setItem('petpaceConnected', newState);
                if (newState) toastService.success('HoundHeart Collar (PetPace Mock) linked successfully');
            }
            
            return newDevices;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 text-gray-900 overflow-hidden relative">
            {/* Background Immersive Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/20 rounded-full blur-[150px] animate-spin-slow"></div>
            
            <Navbar currentPage="dashboard" />
            
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-12 text-center relative z-10">
                    <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-black text-gray-900 mb-4 tracking-tighter"
                    >
                        Integration <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">Hub</span>
                    </motion.h1>
                    <p className="text-gray-600 max-w-lg mx-auto font-medium">
                        Seamlessly bridge your biometrics with canine telemetry for deep resonance data.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Human Wearables Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-blue-100/50 rounded-2xl flex items-center justify-center text-2xl border border-blue-200 shadow-sm">🧘</div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Human Biometrics</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {devices.human.map((device) => (
                                <DeviceCard key={device.id} device={device} onToggle={() => toggleDevice('human', device.id)} />
                            ))}
                        </div>
                    </section>

                    {/* Dog Wearables Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-purple-100/50 rounded-2xl flex items-center justify-center text-2xl border border-purple-200 shadow-sm">🐕</div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Companion Trackers</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {devices.dog.map((device) => (
                                <DeviceCard key={device.id} device={device} onToggle={() => toggleDevice('dog', device.id)} />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-16 p-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl text-gray-900 relative overflow-hidden shadow-xl shadow-purple-200 border border-purple-200">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.454A1 1 0 005.5 5.5a5 5 0 00-.8 9.06 6.5 6.5 0 1111.9-4.942 1 1 0 001.05.495 7.002 7.002 0 015.965 3.125 1 1 0 001.714-.154 8.243 8.243 0 00.32-2.187 1 1 0 00-1.45-.385 1 1 0 00-.345.23l-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 101.89 0c.037-.156.075-.315.113-.475a33.36 33.36 0 01.68-3.415c.236-1.012.53-2.016.892-2.887.18-.435.388-.84.622-1.198.239-.367.545-.733.98-1.022a1 1 0 00.117-1.471z" clipRule="evenodd" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-2 text-indigo-900">Ready to Synchronize?</h3>
                        <p className="text-indigo-800/80 max-w-md mb-6">
                            Once your devices are connected, the Synchronization Score will start generating deep insights about your shared energy.
                        </p>
                        <button 
                            onClick={() => navigate('/sync-score')}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Go to Analytics
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const DeviceCard = ({ device, onToggle }) => {
    return (
        <motion.div
            whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.9)" }}
            className={`bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border transition-all duration-500 shadow-xl ${
                device.connected ? 'border-purple-300 shadow-purple-200' : 'border-white/40'
            }`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100">
                    {device.icon}
                </div>
                <button
                    onClick={onToggle}
                    className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        device.connected 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {device.connected ? 'Linked 🧬' : 'Connect'}
                </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{device.name}</h3>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${device.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-semibold text-gray-500">
                    {device.connected ? `Synced ${device.lastSync}` : 'Offline'}
                </span>
            </div>
        </motion.div>
    );
};

export default WearableIntegrationPage;
