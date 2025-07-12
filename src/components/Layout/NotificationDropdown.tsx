import React, { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import { Check, CheckCheck } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-gray-400" />
            </div>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                notification.is_read 
                  ? 'border-transparent' 
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};