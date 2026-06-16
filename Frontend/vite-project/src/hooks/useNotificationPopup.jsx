import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationPopupContext = createContext(null);

export const useNotificationPopup = () => {
  const context = useContext(NotificationPopupContext);
  if (!context) {
    throw new Error('useNotificationPopup must be used within a NotificationPopupProvider');
  }
  return context;
};

export const NotificationPopupProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  const showPopup = useCallback((type) => {
    setQueue((prevQueue) => {
      // Prevent duplicate identical popups back to back
      if (prevQueue.length > 0 && prevQueue[prevQueue.length - 1].type === type) {
        return prevQueue;
      }
      return [...prevQueue, { id: Date.now(), type }];
    });
  }, []);

  const dismissPopup = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  useEffect(() => {
    if (!currentNotification && queue.length > 0) {
      setCurrentNotification(queue[0]);
      setQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [currentNotification, queue]);

  useEffect(() => {
    if (currentNotification) {
      const timer = setTimeout(() => {
        dismissPopup();
      }, 4000); // Auto dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [currentNotification, dismissPopup]);

  return (
    <NotificationPopupContext.Provider value={{ showPopup, currentNotification, dismissPopup }}>
      {children}
    </NotificationPopupContext.Provider>
  );
};
