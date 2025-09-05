import React, { useState, useEffect } from "react";
import logo from "../../assets/img/SNRS_logo.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auths/AuthContex";
import Axios from "axios";
import jwt_decode from 'jwt-decode';

const Login = () => {
  const [user_name, setuser_name] = useState("");
  const [pass, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  const { dispatch } = useAuth();
  const navigate = useNavigate();

  // Hide preloader after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check for token and validate on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode.default(token);
        dispatch({ type: 'LOGIN', payload: decoded });
        navigate("/");
      } catch (error) {
        console.error("Invalid token:", error);
        dispatch({ type: 'LOGOUT' });
      }
    }
  }, [dispatch, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
  
    try {
      const response = await Axios.post("http://localhost:5000/login", {
        user_name,
        pass,
      });
  
      if (response.data.success) {
        const { user, token } = response.data;
        const decodedToken = jwt_decode(token);
        
        localStorage.setItem("token", token);
        dispatch({ type: "LOGIN", payload: user });
        navigate("/"); 
      } else {
        setMessage("Login failed. Please check your credentials.");
      }
    } catch (error) {
      setMessage("An error occurred, please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Preloader */}
      {showPreloader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-tr from-slate-900 via-gray-800 to-slate-800">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-indigo-600"></div>
              <div className="relative p-4">
                <img 
                  src={logo} 
                  alt="Loading..." 
                  className="h-20 w-20 rounded-2xl object-cover shadow-2xl ring-2 ring-blue-500/50 animate-bounce"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-extrabold text-white">
                Loading Portal...
              </div>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Login Container */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Geometric Shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl rotate-45 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-32 left-40 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl rotate-12 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-full animate-ping"></div>
          
          {/* Mesh Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-gray-900/20"></div>
          
          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236B7280' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Main Content */}
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-lg">
            {/* Login Card */}
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              
              {/* Main Card */}
              <div className="relative bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                {/* Header Section */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-20"></div>
                    <div className="relative bg-white p-3 rounded-2xl border border-gray-200 shadow-lg">
                      <img 
                        src={logo} 
                        alt="logo" 
                        className="h-30 w-30"
                      />
                    </div>
                  </div>
                  
                  <h1 className="text-4xl font-bold text-gray-800 mb-3">
                    Welcome Back
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">Please sign in to your account</p>
                </div>

                {/* Error Message */}
                {message && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-shake">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-red-700 font-medium">{message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="user_name"
                        value={user_name}
                        onChange={(e) => setuser_name(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={pass}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-gray-100"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-300"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                        Remember me
                      </label>
                    </div>
                    <div>
                      <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full mt-6 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-white font-semibold shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <span className="relative flex items-center justify-center">
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Sign In</span>
                          <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </span>
                  </button>
                </form>

                {/* Divider */}
                <div className="mt-8 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Need help?</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-300">
                      Contact Administrator
                    </a>
                  </p>
                  
                  {/* Action Links */}
                  <div className="flex justify-center space-x-4">
                    <a href="#" className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </a>
                    <a href="#" className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Credits */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Developed with{" "}
                <span className="text-red-500">❤️</span>
                {" "}by{" "}
                <a href="#" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors duration-300">
                  ITPC IT Department
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;