import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toastService from '../services/toastService';

const ExpertSessionNotificationPoller = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get user id from token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = apiService.parseJwtPayload(token);
        if (payload && payload.nameid) {
          setUserId(payload.nameid);
        }
      }
    } catch (e) {
      console.warn("Failed to get user id for polling");
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const pollNotifications = async () => {
      try {
        const res = await apiService.getExpertSessionNotifications(userId);
        let notifications = res;
        if (res?.data) notifications = res.data;

        if (Array.isArray(notifications) && notifications.length > 0) {
          for (const notif of notifications) {
            // Show toast
            toastService.success(notif.message, { autoClose: 10000 });
            
            // Mark as read
            await apiService.markExpertSessionNotificationRead(notif.notificationId);
          }
        }
      } catch (err) {
        // Silently fail polling
      }
    };

    // Initial poll
    pollNotifications();

    // Poll every 30 seconds
    const interval = setInterval(pollNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return null; // This is a background component
};

export default ExpertSessionNotificationPoller;
