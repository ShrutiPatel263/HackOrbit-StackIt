import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Tag, TrendingUp, Clock, Star } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: TrendingUp, label: 'Popular', path: '/popular' },
    { icon: Clock, label: 'Recent', path: '/recent' },
    { icon: Star, label: 'Featured', path: '/featured' },
    { icon: Tag, label: 'Tags', path: '/tags' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <nav className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Community Stats</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Questions</span>
              <span className="font-medium">1,234</span>
            </div>
            <div className="flex justify-between">
              <span>Answers</span>
              <span className="font-medium">3,456</span>
            </div>
            <div className="flex justify-between">
              <span>Users</span>
              <span className="font-medium">567</span>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Tags</h3>
          <div className="space-y-2">
            {['React', 'JavaScript', 'TypeScript', 'Node.js', 'CSS'].map((tag) => (
              <Link
                key={tag}
                to={`/tags/${tag.toLowerCase()}`}
                className="block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};