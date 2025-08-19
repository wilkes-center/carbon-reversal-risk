import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';

const NotificationItem = ({ message, isDarkMode, index }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg 
               flex items-center justify-center gap-3 min-w-[300px]"
    style={{
      background: isDarkMode ? '#1F2937' : 'white',
      border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
      color: isDarkMode ? '#E5E7EB' : '#1F2937',
      top: `${24 + (index * 45)}px`,
      zIndex: 99999
    }}
  >
    <Loader className="animate-spin" size={16} />
    <span className="text-sm font-medium">{message}</span>
  </motion.div>
);

const UploadNotification = ({ uploadStatus, isDarkMode }) => {
  const [notifications, setNotifications] = useState([]);

  // Debug log
  useEffect(() => {
    console.log('Current uploadStatus:', uploadStatus);
    console.log('Current notifications:', notifications);
  }, [uploadStatus, notifications]);

  useEffect(() => {
    if (uploadStatus) {
      console.log('Adding new notification:', uploadStatus); // Debug log
      const newNotification = {
        id: Date.now(),
        message: uploadStatus
      };

      setNotifications(prev => [...prev, newNotification]);

      // Remove after 3 seconds
      setTimeout(() => {
        console.log('Removing notification:', uploadStatus); // Debug log
        setNotifications(prev => 
          prev.filter(notification => notification.id !== newNotification.id)
        );
      }, 1500);
    }
  }, [uploadStatus]);

  // If no notifications, don't render anything
  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            message={notification.message}
            isDarkMode={isDarkMode}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default UploadNotification;