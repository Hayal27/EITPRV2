import React, { useState, useEffect } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  // Enhanced responsive detection and sidebar state management
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail.isCollapsed);
    };

    // Enhanced screen size detection
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setScreenSize('mobile');
      } else if (width <= 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Initial checks
    checkScreenSize();
    
    // Get initial sidebar state from localStorage
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === 'true');
    }

    // Add event listeners
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Enhanced margin calculation based on screen size and sidebar state
  const getFooterMargin = () => {
    switch (screenSize) {
      case 'mobile':
        return '0px'; // No margin on mobile
      case 'tablet':
        return sidebarCollapsed ? '80px' : '0px'; // Collapsed sidebar or no margin on tablet
      case 'desktop':
      default:
        return sidebarCollapsed ? '80px' : '320px'; // Match sidebar widths on desktop
    }
  };

  return (
    <footer 
      className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/60 mt-auto transition-all duration-300 ease-out relative"
      style={{ 
        marginLeft: getFooterMargin(),
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Enhanced Responsive Main Footer Content */}
        <div className="py-6 sm:py-8 lg:py-12">
          {/* Mobile-First Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            {/* Company Info - Enhanced for all screen sizes */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-shield-check text-white text-sm sm:text-lg"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                    ITPC Admin System
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">Plan & Reporting Platform</p>
                </div>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 max-w-md">
                Ethiopian IT Park Corporate comprehensive management system for planning, 
                reporting, and organizational oversight. Streamlining operations with 
                modern technology solutions.
              </p>
              
              {/* Status Indicators - Responsive */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span>System Online</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
                  <i className="bi bi-shield-check text-green-500 flex-shrink-0"></i>
                  <span>Secure Connection</span>
                </div>
              </div>
            </div>

            {/* Quick Links - Enhanced for mobile */}
            <div className="sm:col-span-1">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="/dashboard" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-speedometer2 text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Dashboard</span>
                  </a>
                </li>
                <li>
                  <a href="/reports" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-file-earmark-text text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Reports</span>
                  </a>
                </li>
                <li>
                  <a href="/settings" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-gear text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Settings</span>
                  </a>
                </li>
                <li>
                  <a href="/help" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-question-circle text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Help Center</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Support - Enhanced for mobile */}
            <div className="sm:col-span-1">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">
                Support
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="/docs" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-book text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Documentation</span>
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-envelope text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Contact Support</span>
                  </a>
                </li>
                <li>
                  <a href="/tickets" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-ticket-perforated text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>Support Tickets</span>
                  </a>
                </li>
                <li>
                  <a href="/status" className="text-slate-600 hover:text-slate-800 text-xs sm:text-sm transition-colors duration-200 flex items-center space-x-2 group">
                    <i className="bi bi-activity text-xs group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"></i>
                    <span>System Status</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Responsive Divider */}
        <div className="border-t border-slate-200/60"></div>

        {/* Enhanced Bottom Footer - Mobile-First */}
        <div className="py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            
            {/* Copyright - Responsive */}
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-slate-600">
                © {currentYear} <span className="font-semibold text-slate-800">Ethiopian IT Park Corporate</span>. 
                <span className="block sm:inline mt-1 sm:mt-0">All rights reserved.</span>
              </p>
            </div>

            {/* Version & Status - Enhanced for mobile */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  v2.0.1
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">Professional Edition</span>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <i className="bi bi-clock text-xs flex-shrink-0"></i>
                  <span className="hidden sm:inline">Last updated:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Developer Credit - Mobile-Friendly */}
        <div className="border-t border-slate-200/60 py-3 sm:py-4">
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Developed with <i className="bi bi-heart-fill text-red-400 mx-1"></i> by 
              <span className="font-medium text-slate-500 ml-1">ITPC Development Team</span>
            </p>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 pointer-events-none"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-slate-200/40 to-transparent"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-slate-200/40 to-transparent"></div>
    </footer>
  );
};

export default Footer;