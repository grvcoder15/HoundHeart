import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import apiService from '../services/apiService';

const TIER_RANK = {
  free: 0,
  plus: 1,
  premium: 2
};

const normalizeTier = (tier) => {
  const value = String(tier || 'free').toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(TIER_RANK, value) ? value : 'free';
};

export const hasAccess = (userTier, requiredTier = 'free') => {
  const normalizedUserTier = normalizeTier(userTier);
  const normalizedRequiredTier = normalizeTier(requiredTier);
  return TIER_RANK[normalizedUserTier] >= TIER_RANK[normalizedRequiredTier];
};

const ProtectedRoute = ({ children, requiredTier = 'free' }) => {
  // Check authentication using existing apiService methods
  const isAuthenticated = apiService.isAuthenticated();
  const token = apiService.getToken();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const syncKey = 'stripeSyncLastRun';
    const now = Date.now();
    const lastRun = Number(sessionStorage.getItem(syncKey) || '0');

    // Avoid hitting Stripe-backed sync on every route transition.
    if (now - lastRun < 60000) {
      return;
    }

    sessionStorage.setItem(syncKey, String(now));

    const syncAccessState = async () => {
      try {
        await apiService.syncSubscriptionFromStripe();
      } catch {
        // Silent background sync: ignore missing subscription or transient Stripe issues.
      }

      try {
        const response = await apiService.makeRequest('/Subscription/check-access', {
          method: 'GET'
        });

        const data = response?.data || response;
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        const normalizedTierLevel = normalizeTier(data?.tierLevel ?? existingUser.tierLevel);

        localStorage.setItem('user', JSON.stringify({
          ...existingUser,
          tierLevel: normalizedTierLevel,
          roleId: data?.roleId ?? existingUser.roleId,
          RoleId: data?.roleId ?? existingUser.RoleId
        }));
      } catch {
        // Leave current local auth state untouched if the access check fails.
      }
    };

    syncAccessState();
  }, [isAuthenticated, token]);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userTier = normalizeTier(existingUser?.tierLevel);

  if (!hasAccess(userTier, requiredTier)) {
    const normalizedRequiredTier = normalizeTier(requiredTier);
    const accessMessage = normalizedRequiredTier === 'premium'
      ? 'Upgrade to HoundHeart Premium to access this feature'
      : 'Upgrade to HoundHeart Plus to access this feature';

    return (
      <Navigate
        to="/subscription"
        replace
        state={{
          accessMessage
        }}
      />
    );
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;


