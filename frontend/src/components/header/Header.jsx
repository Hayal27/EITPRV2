import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/img/android-chrome-512x512-1.png";
import { useAuth } from "../Auths/AuthContex";

const BACKEND_URL = "http://localhost:5000";

const Header = () => {
  const { state, dispatch } = useAuth();
  const token = localStorage.getItem("token");
  const [profilePic, setProfilePic] = useState("");
  const [role, setRole] = useState("");
  const [unreadPlans, setUnreadPlans] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fetchMessage, setFetchMessage] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log("Fetching user role...");
    axios
      .get(`${BACKEND_URL}/api/userrole`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        console.log("User role response:", res.data);
        if (res.data && res.data.role_name) {
          setRole(res.data.role_name);
        }
      })
      .catch((err) =>
        console.error("Error fetching role:", err.response ? err.response.data : err.message)
      );
  }, [token]);

  useEffect(() => {
    const userId =
      typeof state.user === "object" && state.user.user_id ? state.user.user_id : state.user;
    if (userId) {
      console.log("Fetching profile picture for user:", userId);
      axios
        .get(`${BACKEND_URL}/api/getprofile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          console.log("Backend profile picture response:", res.data);
          if (res.data && res.data.success) {
            let avatarUrl = res.data.avatarUrl;
            avatarUrl = avatarUrl.replace(/\\/g, '/');
            if (avatarUrl.includes("/uploads/")) {
              avatarUrl = avatarUrl.replace("/uploads/", "/uploads/");
            }
            console.log("Normalized avatarUrl:", avatarUrl);
            setProfilePic(avatarUrl);
            setFetchError("");
            setImageLoadFailed(false);
          } else {
            console.warn("No profile picture found in response.");
            setFetchError("No profile picture found.");
            setFetchMessage("");
          }
        })
        .catch((err) => {
          const errorMsg = err.response ? err.response.data : err.message;
          console.error("Error fetching profile picture:", errorMsg);
          setFetchMessage("");
        });
    } else {
      console.warn("User identifier is missing. Unable to fetch profile picture.");
    }
  }, [token, state.user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    dispatch({ type: "LOGOUT" });
    try {
      await fetch(`${BACKEND_URL}/logout/${state.user}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    const planIds = unreadPlans.map((plan) => plan.plan_id);
    try {
      await axios.put(
        `${BACKEND_URL}/api/plan/update-read`,
        { plan_ids: planIds, read_status: "1" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadPlans([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (e, plan_id) => {
    e.preventDefault();
    try {
      await axios.put(
        `${BACKEND_URL}/api/plan/${plan_id}/update-read`,
        { uid: state.user, value: "1" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error updating read status:", err);
    }
  };

  const handleImageLoad = () => {
    console.log("Profile picture rendered successfully in UI:", profilePic);
    setFetchError("");
    setImageLoadFailed(false);
  };

  const handleImageError = (e) => {
    const errorURL = e.target.src;
    console.error("Error rendering profile picture in UI for URL:", errorURL);
    setFetchMessage("");
    setImageLoadFailed(true);
  };

  return (
    <>
      {/* Professional Mobile-First Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 lg:h-20 bg-white/98 backdrop-blur-xl border-b border-slate-200/60 shadow-lg shadow-slate-900/5 z-50">
        <div className="flex items-center justify-between h-full px-2 sm:px-4 lg:px-8 max-w-full">
          
          {/* Left Section - Mobile Menu & Brand */}
          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {/* Professional Mobile Menu Button */}
            <button 
              className="lg:hidden relative p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all duration-300 group active:scale-95"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggleMobileSidebar'));
              }}
            >
              <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                <span className="block w-5 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:w-6"></span>
                <span className="block w-4 h-0.5 bg-current rounded-full mt-1 transition-all duration-300 group-hover:w-6"></span>
                <span className="block w-5 h-0.5 bg-current rounded-full mt-1 transition-all duration-300 group-hover:w-6"></span>
              </div>
              <div className="absolute inset-0 bg-blue-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200"></div>
            </button>

            {/* Brand Section */}
            <Link 
              to="/" 
              className="group flex items-center space-x-2 sm:space-x-3 text-slate-800 hover:text-slate-900 no-underline transition-all duration-300"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src={logo} 
                  alt="ETHITPC Logo" 
                  className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl ring-2 ring-white/50 shadow-sm" 
                />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm sm:text-base lg:text-xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent leading-tight">
                  ETHITPC 
                </h1>
                <p className="text-xs lg:text-sm text-slate-500 font-medium -mt-0.5 hidden sm:block">
                  {role || "Loading..."}
                </p>
              </div>
            </Link>
          </div>

          {/* Center Section - Search (Desktop Only) */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center max-w-2xl">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="bi bi-search text-slate-400 text-sm"></i>
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full h-11 pl-11 pr-4 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 text-sm placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white hover:bg-white/90"
              />
            </div>

            {/* Live Time Display */}
            <div className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-slate-50/80 to-slate-100/80 rounded-xl border border-slate-200/40">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <i className="bi bi-clock text-slate-600 text-sm"></i>
              <span className="text-slate-700 text-sm font-medium tabular-nums">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 lg:space-x-2 flex-shrink-0">

            {/* Mobile Search Button */}
            <button className="lg:hidden p-2 sm:p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all duration-300 active:scale-95">
              <i className="bi bi-search text-lg sm:text-xl"></i>
            </button>

            {/* Quick Actions - Tablet and Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              <button className="p-2 lg:p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all duration-300">
                <i className="bi bi-grid-3x3-gap text-lg"></i>
              </button>
              <button className="p-2 lg:p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all duration-300">
                <i className="bi bi-question-circle text-lg"></i>
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 lg:p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="bi bi-bell text-lg lg:text-xl"></i>
                {unreadPlans.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadPlans.length}
                  </span>
                )}
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200"></div>
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300">
                  {/* Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {unreadPlans.length} new
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-h-80 overflow-y-auto">
                    {unreadPlans.length > 0 ? (
                      unreadPlans.map((plan, index) => (
                        <div key={plan.plan_id} className="px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <i className="bi bi-exclamation-triangle text-white text-sm"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-slate-800 truncate">
                                {plan.plan_subject}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {plan.plan_description}
                              </p>
                              <p className="text-xs text-slate-400 mt-2">
                                {new Date(plan.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <i className="bi bi-bell-slash text-slate-400 text-2xl"></i>
                        </div>
                        <p className="text-slate-500 text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {unreadPlans.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/60">
                      <button
                        className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <Link 
              to="/chat" 
              className="relative p-2 lg:p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 group no-underline"
            >
              <i className="bi bi-chat-dots text-lg lg:text-xl"></i>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
              <div className="absolute inset-0 bg-green-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200"></div>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-3 p-1.5 lg:p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="relative">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl overflow-hidden ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all duration-200">
                    {!imageLoadFailed && profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <i className="bi bi-person text-slate-600 text-lg"></i>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {state.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {role}
                  </p>
                </div>

                <i className="bi bi-chevron-down text-slate-400 text-xs group-hover:text-slate-600 transition-colors duration-200"></i>
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300">
                  {/* Profile Header */}
                  <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-200/60">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-3 ring-white shadow-lg">
                          {!imageLoadFailed && profilePic ? (
                            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                              <i className="bi bi-person text-slate-600 text-xl"></i>
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate">
                          {`${state.name || ""} ${state.lname || ""}`}
                        </h3>
                        <p className="text-sm text-slate-600 truncate">
                          {state.user_name || ""}
                        </p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mt-1">
                          {role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      to="/ProfilePictureUpload" 
                      className="flex items-center space-x-3 px-6 py-3 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 no-underline group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                        <i className="bi bi-image text-blue-600 text-sm"></i>
                      </div>
                      <span className="font-medium">Change Profile Picture</span>
                    </Link>
                    
                    <Link 
                      to="/change-password" 
                      className="flex items-center space-x-3 px-6 py-3 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 no-underline group"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors duration-200">
                        <i className="bi bi-lock text-amber-600 text-sm"></i>
                      </div>
                      <span className="font-medium">Change Password</span>
                    </Link>

                    <div className="my-2 mx-6 h-px bg-slate-200"></div>

                    <button 
                      onClick={handleLogout} 
                      className="flex items-center space-x-3 w-full px-6 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                        <i className="bi bi-box-arrow-right text-red-600 text-sm"></i>
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Toast Messages */}
      {(fetchMessage || fetchError) && (
        <div className="fixed top-24 right-4 z-50 space-y-2">
          {fetchMessage && (
            <div className="flex items-center space-x-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right-2 duration-300">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="bi bi-check text-white text-xs"></i>
              </div>
              <span className="text-sm font-medium">{fetchMessage}</span>
              <button
                onClick={() => setFetchMessage("")}
                className="text-green-600 hover:text-green-800 transition-colors duration-200"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>
          )}
          
          {fetchError && (
            <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right-2 duration-300">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="bi bi-exclamation text-white text-xs"></i>
              </div>
              <span className="text-sm font-medium">{fetchError}</span>
              <button
                onClick={() => setFetchError("")}
                className="text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Header;