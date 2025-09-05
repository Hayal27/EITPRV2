import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auths/AuthContex';
import axios from 'axios';
import logo from "../../assets/img/android-chrome-512x512-1.png";

function Sidebar() {
  // Core state management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState('light');
  const [sidebarSettings, setSidebarSettings] = useState({
    showIcons: true,
    showBadges: true,
    compactMode: false,
    autoCollapse: false
  });

  // Refs
  const sidebarRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useAuth();

  // Enhanced responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024; // Changed from 768 to 1024 for better tablet support
      const tablet = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile and tablet
      if (tablet && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isCollapsed]);

  // Fetch user profile and notifications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (state.user && state.isAuthenticated) {
          // Fetch user profile
          const profileResponse = await axios.get(`http://localhost:5000/api/user/profile/${state.user}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (profileResponse.data.success) {
            setUserProfile(profileResponse.data.user);
          }

          // Fetch notifications
          const notificationResponse = await axios.get(`http://localhost:5000/api/notifications/${state.user}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (notificationResponse.data.success) {
            setNotifications(notificationResponse.data.notifications.slice(0, 5));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user data:', err.message);
      }
    };

    fetchUserData();
  }, [state.user, state.isAuthenticated]);

  // Enhanced menu fetching with caching
  const fetchMenuItems = useCallback(async () => {
    try {
      if (state.user && state.role_id && state.isAuthenticated) {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = `menu_items_${state.role_id}`;
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        
        // Use cache if less than 5 minutes old
        if (cachedData && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 300000) {
          const parsedData = JSON.parse(cachedData);
          setMenuItems(parsedData);
          setFilteredMenuItems(parsedData);
          setLoading(false);
          return;
        }

        const apiUrl = `http://localhost:5000/api/menu-permissions/user-permissions/${state.role_id}`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          timeout: 10000
        });

        if (response.data && response.data.success) {
          const menuData = response.data.data;
          setMenuItems(menuData);
          setFilteredMenuItems(menuData);
          
          // Cache the data
          localStorage.setItem(cacheKey, JSON.stringify(menuData));
          localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
          
          setError(null);
        } else {
          throw new Error(response.data?.message || 'Failed to load menu items');
        }
      } else {
        throw new Error('Authentication data missing');
      }
    } catch (err) {
      let errorMessage = 'Failed to load menu items';
      if (err.response) {
        errorMessage = `Server Error ${err.response.status}: ${err.response.data?.message || err.message}`;
      } else if (err.request) {
        errorMessage = 'Network Error: Unable to reach server';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [state.user, state.role_id, state.isAuthenticated]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Advanced search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMenuItems(menuItems);
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    const filtered = menuItems.filter(item => {
      // Search in main item
      if (item.name.toLowerCase().includes(searchLower)) return true;
      
      // Search in children
      if (item.children && item.children.length > 0) {
        return item.children.some(child => 
          child.name.toLowerCase().includes(searchLower)
        );
      }
      
      return false;
    }).map(item => {
      // If main item matches, return as is
      if (item.name.toLowerCase().includes(searchLower)) {
        return item;
      }
      
      // If children match, return item with filtered children
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: item.children.filter(child => 
            child.name.toLowerCase().includes(searchLower)
          )
        };
      }
      
      return item;
    });

    setFilteredMenuItems(filtered);
  }, [searchQuery, menuItems]);

  // Enhanced sidebar toggle with animations
  const handleToggleSidebar = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // Close search and submenus when collapsing
    if (newCollapsedState) {
      setActiveSubmenu(null);
      setSearchQuery('');
      setIsSearchFocused(false);
    }

    // Update main content margin with smooth transition
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      if (isMobile) {
        mainContent.style.marginLeft = '0px';
      } else {
        mainContent.style.marginLeft = newCollapsedState ? '80px' : '320px';
      }
    }

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { 
        isCollapsed: newCollapsedState,
        width: newCollapsedState ? 80 : 320,
        timestamp: Date.now()
      }
    }));

    // Save preference
    localStorage.setItem('sidebar_collapsed', newCollapsedState.toString());
  }, [isCollapsed, isMobile]);

  // Load saved preferences
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    const savedTheme = localStorage.getItem('sidebar_theme');
    const savedSettings = localStorage.getItem('sidebar_settings');

    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true');
    }
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedSettings) {
      setSidebarSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Enhanced submenu toggle
  const toggleSubmenu = useCallback((menuId) => {
    if (isCollapsed) return;
    setActiveSubmenu(current => current === menuId ? null : menuId);
  }, [isCollapsed]);

  // Check if current path matches
  const isActiveLink = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.warn('Logout API call failed:', err.message);
    } finally {
      // Clear all data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('menu_items_')) {
          localStorage.removeItem(key);
        }
      });
      
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  }, [dispatch, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
      
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isCollapsed && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      
      // Escape to close search
      if (e.key === 'Escape' && isSearchFocused) {
        setSearchQuery('');
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleToggleSidebar, isCollapsed, isSearchFocused]);

  // Click outside to close on mobile and handle mobile toggle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && !isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    };

    const handleMobileToggle = () => {
      if (isMobile) {
        setIsCollapsed(!isCollapsed);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('toggleMobileSidebar', handleMobileToggle);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('toggleMobileSidebar', handleMobileToggle);
    };
  }, [isMobile, isCollapsed]);

  // Enhanced menu item renderer
  const renderMenuItem = useCallback((item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isActiveLink(item.path);
    const isSubmenuActive = activeSubmenu === item.id;
    const isHovered = hoveredItem === item.id;

    if (hasChildren) {
      return (
        <li key={item.id} className="group">
          <div
            className={`relative flex items-center px-3 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-300 ease-out ${
              isSubmenuActive 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg shadow-blue-100/50 scale-[1.02]' 
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
            }`}
            onClick={() => toggleSubmenu(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            title={isCollapsed ? item.name : ""}
          >
            {/* Enhanced icon with badge support */}
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
              isSubmenuActive 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700 group-hover:shadow-sm'
            }`}>
              <i className={`${item.icon} text-base`}></i>
              {sidebarSettings.showBadges && item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            
            {!isCollapsed && (
              <>
                <span className="ml-3 text-sm font-semibold tracking-wide flex-1">{item.name}</span>
                <div className={`transition-transform duration-300 ${isSubmenuActive ? 'rotate-180' : ''}`}>
                  <i className="bi bi-chevron-down text-xs"></i>
                </div>
              </>
            )}
            
            {/* Active indicator */}
            {isSubmenuActive && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && isHovered && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                {item.name}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>

          {/* Enhanced submenu with smooth animations */}
          {!isCollapsed && (
            <div className={`overflow-hidden transition-all duration-500 ease-out ${
              isSubmenuActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <ul className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                {item.children.map(child => (
                  <li key={child.id}>
                    <Link
                      to={child.path}
                      className={`flex items-center px-3 py-2.5 mx-2 rounded-lg text-sm transition-all duration-300 ease-out ${
                        isActiveLink(child.path) 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 font-semibold scale-[1.02]' 
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 hover:text-gray-800 hover:scale-[1.01]'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-lg mr-3 transition-all duration-300 ${
                        isActiveLink(child.path) 
                          ? 'bg-white/20 text-white shadow-sm' 
                          : 'bg-gray-200 text-gray-400 group-hover:bg-gray-300'
                      }`}>
                        <i className={`${child.icon} text-xs`}></i>
                      </div>
                      <span className="font-medium flex-1">{child.name}</span>
                      
                      {/* Badge for submenu items */}
                      {sidebarSettings.showBadges && child.badge && (
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                          isActiveLink(child.path) 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {child.badge}
                        </span>
                      )}
                      
                      {/* Active indicator */}
                      {isActiveLink(child.path) && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      );
    } else {
      return (
        <li key={item.id} className="group">
          <Link
            to={item.path}
            className={`relative flex items-center px-3 py-3 mx-2 rounded-xl transition-all duration-300 ease-out ${
              isActive 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 scale-[1.02]' 
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
            }`}
            title={isCollapsed ? item.name : ""}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* Enhanced icon */}
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-white/20 text-white shadow-md' 
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700 group-hover:shadow-sm'
            }`}>
              <i className={`${item.icon} text-base`}></i>
              {sidebarSettings.showBadges && item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            
            {!isCollapsed && (
              <>
                <span className="ml-3 text-sm font-semibold tracking-wide flex-1">{item.name}</span>
                {sidebarSettings.showBadges && item.badge && (
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
            
            {/* Active indicator */}
            {isActive && (
              <>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                {!isCollapsed && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && isHovered && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                {item.name}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </Link>
        </li>
      );
    }
  }, [isCollapsed, activeSubmenu, hoveredItem, isActiveLink, toggleSubmenu, sidebarSettings]);

  // Loading state
  if (loading) {
    return (
      <>
        {/* Toggle Button - Positioned below header */}
        <button
          className={`fixed top-20 lg:top-24 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-300 hover:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            isCollapsed ? 'left-4 lg:left-6' : 'left-4 lg:left-6'
          }`}
          onClick={handleToggleSidebar}
        >
          <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-sm lg:text-base`}></i>
        </button>

        <aside 
          ref={sidebarRef}
          className={`fixed top-16 lg:top-20 left-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transition-all duration-500 ease-out shadow-2xl ${
            isCollapsed ? 'w-16 lg:w-20' : 'w-72 lg:w-80'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                </div>
                {!isCollapsed && (
                  <div className="ml-4">
                    <div className="h-5 bg-gray-300 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Loading content */}
            <div className="flex-1 flex flex-col justify-center items-center p-6">
              <div className="relative mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
              </div>
              {!isCollapsed && (
                <div className="text-center">
                  <p className="text-gray-600 font-medium">Loading menu...</p>
                  <p className="text-gray-400 text-sm mt-1">Please wait</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        {/* Toggle Button - Positioned below header */}
        <button
          className={`fixed top-20 lg:top-24 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-300 hover:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            isCollapsed ? 'left-4 lg:left-6' : 'left-4 lg:left-6'
          }`}
          onClick={handleToggleSidebar}
        >
          <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-sm lg:text-base`}></i>
        </button>

        <aside 
          ref={sidebarRef}
          className={`fixed top-16 lg:top-20 left-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transition-all duration-500 ease-out shadow-2xl ${
            isCollapsed ? 'w-16 lg:w-20' : 'w-72 lg:w-80'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  <i className="bi bi-exclamation-triangle text-white text-xl"></i>
                </div>
                {!isCollapsed && (
                  <div className="ml-4">
                    <h1 className="text-lg font-bold text-red-700">Error</h1>
                    <p className="text-sm text-red-500">Failed to load</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error content */}
            <div className="flex-1 p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start">
                  <i className="bi bi-exclamation-triangle text-red-500 text-lg mr-3 mt-1"></i>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 mb-2">Menu Loading Failed</h3>
                    {!isCollapsed && (
                      <>
                        <p className="text-red-700 text-sm mb-4">{error}</p>
                        <button
                          onClick={fetchMenuItems}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Professional Toggle Button - Positioned below header */}
      <button
        className={`fixed top-20 lg:top-24 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-300 hover:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
          isCollapsed ? 'left-4 lg:left-6' : 'left-4 lg:left-6'
        }`}
        onClick={handleToggleSidebar}
        title={`${isCollapsed ? 'Expand' : 'Collapse'} Sidebar (Ctrl+B)`}
      >
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-sm lg:text-base transition-transform duration-300`}></i>
      </button>

      {/* Professional Sidebar - Positioned below header */}
      <aside 
        ref={sidebarRef}
        className={`fixed top-16 lg:top-20 left-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transition-all duration-500 ease-out shadow-2xl ${
          isCollapsed ? 'w-16 lg:w-20' : 'w-72 lg:w-80'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Premium Header */}
    

          {/* Search Bar */}
          {!isCollapsed && (
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-search text-gray-400"></i>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search menu... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <i className="bi bi-x text-sm"></i>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <ul className="space-y-2">
              {filteredMenuItems && filteredMenuItems.length > 0 ? (
                filteredMenuItems.map(item => renderMenuItem(item))
              ) : (
                <li className="p-8 text-center">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mx-auto mb-4">
                    <i className="bi bi-inbox text-blue-500 text-3xl"></i>
                  </div>
                  {!isCollapsed && (
                    <div>
                      <p className="font-semibold text-gray-600 mb-2">
                        {searchQuery ? 'No results found' : 'No menu items'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {searchQuery ? 'Try a different search term' : 'Contact administrator for access'}
                      </p>
                    </div>
                  )}
                </li>
              )}
            </ul>
          </nav>

          {/* User Profile Section */}
          {!isCollapsed && userProfile && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userProfile.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile.role || 'Role'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <i className="bi bi-box-arrow-right text-sm"></i>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          {!isCollapsed && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="text-center">
                <p className="text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                  ITPC Plan & Reporting v2.0
                </p>
                <p className="text-xs text-gray-400 mt-1">Professional Edition</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}

export default Sidebar;