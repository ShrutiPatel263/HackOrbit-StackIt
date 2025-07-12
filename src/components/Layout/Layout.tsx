import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'max-w-[calc(100%-16rem)]' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};