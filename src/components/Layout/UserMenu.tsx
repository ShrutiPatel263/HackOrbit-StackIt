import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, HelpCircle } from 'lucide-react';
import { User as AppUser } from '../../types';

interface UserMenuProps {
  user: AppUser | null;
  onSignOut: () => void;
  onClose: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{user?.username}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <Link
          to={`/profile/${user?.username}`}
          onClick={onClose}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <User className="w-4 h-4 mr-3" />
          Your Profile
        </Link>
        
        <Link
          to="/questions/my"
          onClick={onClose}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <HelpCircle className="w-4 h-4 mr-3" />
          My Questions
        </Link>

        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Link>
      </div>

      {/* Sign Out */}
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={onSignOut}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign out
        </button>
      </div>
    </div>
  );
};