import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/apiService';

const BondAnalyticsPage = () => {
    const navigate = useNavigate();
    const [score, setScore] = useState(78);
    const [trend, setTrend] = useState('improving');
    
    // Mock data for the correlation chart
    const chartData = [
        { time: '08:00', stress: 65, dogActivity: 20 },
        { time: '10:00', stress: 45, dogActivity: 75 },
        { time: '12:00', stress: 80, dogActivity: 40 },
        { time: '14:00', stress: 30, dogActivity: 35 },
        { time: '16:00', stress: 55, dogActivity: 85 },
        { time: '18:00', stress: 40, dogActivity: 60 },
        { time: '20:00', stress: 20, dogActivity: 25 },
    ];

    const insights = [
        { id: 1, type: 'magic-hour', text: "Your stress levels drop 18% during walks with Luna.", icon: '✨' },
        { id: 2, type: 'sleep-sync', text: "Your sleep quality improves on days when your dog receives more outdoor activity.", icon: '🌙' },
        { id: 3, type: 'calm-sync', text: "Your dog appears calmer when your evening heart rate is lower.", icon: '🧘' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 text-gray-900 overflow-hidden relative">
            {/* Background Immersive Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/30 rounded-full blur-[150px] animate-spin-slow"></div>
            
            <Navbar currentPage="dashboard" />
            
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black text-gray-900 tracking-tight"
                        >
                            Bond <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">Resonance</span>
                        </motion.h1>
                        <p className="text-gray-600 mt-2 font-medium">Quantifying the invisible connection between you and your companion.</p>
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/integrations')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Manage Devices
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Score Gauge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-8 self-start">Synchronization Score</h3>
                        
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Futuristic Multi-layer Gauge */}
                            <svg className="w-full h-full transform -rotate-90 scale-110">
                                <circle
                                    cx="112" cy="112" r="100"
                                    fill="transparent"
                                    stroke="rgba(0,0,0,0.05)"
                                    strokeWidth="10"
                                />
                                <motion.circle
                                    initial={{ strokeDashoffset: 628 }}
                                    animate={{ strokeDashoffset: 628 - (628 * score) / 100 }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    cx="112" cy="112" r="100"
                                    fill="transparent"
                                    stroke="url(#premiumScoreGradient)"
                                    strokeWidth="12"
                                    strokeDasharray="628"
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                />
                                <defs>
                                    <linearGradient id="premiumScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="50%" stopColor="#d946ef" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            <div className="absolute flex flex-col items-center">
                                <motion.span 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-7xl font-black text-gray-900"
                                >
                                    {score}
                                </motion.span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Percent Sync</span>
                            </div>
                        </div>
                        
                        <div className="mt-10 flex items-center gap-4 bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 shadow-sm bg-opacity-70">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-700 font-bold text-sm">Improving</p>
                                <p className="text-xs text-purple-500/80 font-medium">+12% from yesterday</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Middle: Correlation Chart */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl relative group"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-gray-900">Connection Synergy</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-600" />
                                    <span className="text-xs font-bold text-gray-500">Human Stress</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                    <span className="text-xs font-bold text-gray-500">Dog Activity</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-64 relative mt-4">
                            {/* Simple Custom SVG Chart */}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* Grid Lines */}
                                {[0, 1, 2, 3, 4].map(i => (
                                    <line key={i} x1="0" y1={i * 25} x2="100" y2={i * 25} stroke="#f3f4f6" strokeWidth="1" />
                                ))}
                                
                                {/* Stress Line */}
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2 }}
                                    d={Array.isArray(chartData) && chartData.length > 0 ? chartData.reduce((acc, curr, i) => {
                                        const x = (i / (chartData.length - 1)) * 100;
                                        const y = 100 - (curr.stress || 0);
                                        return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                    }, '') : "M 0 0"}
                                    fill="none"
                                    stroke="#8B5CF6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                
                                {/* Dog Activity Line */}
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, delay: 0.5 }}
                                    d={Array.isArray(chartData) && chartData.length > 0 ? chartData.reduce((acc, curr, i) => {
                                        const x = (i / (chartData.length - 1)) * 100;
                                        const y = 100 - (curr.dogActivity || 0);
                                        return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                    }, '') : "M 0 0"}
                                    fill="none"
                                    stroke="#F97316"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray="8 4"
                                />
                            </svg>
                            
                            {/* X-Axis Labels */}
                            <div className="flex justify-between mt-6 px-2">
                                {(chartData || []).map((d, i) => (
                                    <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{d.time}</span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 p-5 bg-purple-50 border border-purple-100/50 rounded-2xl italic text-sm text-purple-900 leading-relaxed shadow-sm">
                            "Notice how **Luna's activity** peaks shortly after your **stress levels** drop in the afternoon. You are creating a calm environment for her."
                        </div>
                    </motion.div>

                    {/* Quick Status Bar */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-3 mb-2 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[1px] rounded-3xl shadow-lg shadow-orange-500/10"
                    >
                        <div className="bg-white/90 backdrop-blur-3xl p-5 rounded-[calc(1.5rem-1px)] flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl animate-pulse border border-orange-200 shadow-inner">
                                    ⚠️
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Quick Status</h4>
                                    <p className="text-gray-700 text-sm font-medium">
                                        Your stress is slightly elevated. A 5-minute walk with <span className="font-bold text-gray-900">Luna</span> will help you both align. 🦮
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Live Telemetry / Biometrics */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                        {/* Human Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-xl flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Human Biometrics</h3>
                                <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
                                    88 <span className="text-sm font-bold text-gray-500">BPM</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold text-orange-600">Elevated</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-rose-100">
                                ❤️
                            </div>
                        </motion.div>

                        {/* Dog Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-xl flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Canine Telemetry</h3>
                                <div className="text-3xl font-black text-gray-900">Resting</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-xs font-bold text-blue-600">Optimal Recovery</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">
                                🐕
                            </div>
                        </motion.div>
                    </div>

                    {/* Insights Grid */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {insights.map((insight, idx) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.9)" }}
                                className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/40 shadow-xl relative overflow-hidden group transition-all"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-4xl">{insight.icon}</span>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm border border-white">
                                    {insight.icon}
                                </div>
                                <p className="text-gray-800 font-medium leading-relaxed">
                                    {insight.text}
                                </p>
                                <button className="mt-4 text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors">
                                    Learn More →
                                </button>
                            </motion.div>
                        ))}
                    </div>
                    
                </div>
            </main>
        </div>
    );
};

export default BondAnalyticsPage;
