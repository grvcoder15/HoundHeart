import React from 'react';

const SubscriptionStatusBadge = ({ status, className = '' }) => {
    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'active':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    dot: 'bg-green-500',
                    label: 'Active'
                };
            case 'canceled':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    dot: 'bg-red-500',
                    label: 'Canceled'
                };
            case 'past_due':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    dot: 'bg-yellow-500',
                    label: 'Past Due'
                };
            case 'trialing':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    dot: 'bg-blue-500',
                    label: 'Trial'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    dot: 'bg-gray-500',
                    label: 'Free Plan'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${className}`}>
            <div className={`w-2 h-2 rounded-full ${config.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
        </div>
    );
};

export default SubscriptionStatusBadge;
