import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './components/Auths/AuthContex.jsx'

// Import Bootstrap Icons CSS (fallback method)
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import icon utilities for debugging
import { checkBootstrapIcons } from './utils/icons.jsx'

// Check if Bootstrap Icons are loaded after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const iconsLoaded = checkBootstrapIcons();
    if (!iconsLoaded) {
      console.warn('Bootstrap Icons may not be loaded properly. Check network and CSS imports.');
    } else {
      console.log('✅ Bootstrap Icons loaded successfully!');
    }
  }, 1000);
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <AuthProvider>
    <App />
	</AuthProvider>
  </React.StrictMode>,
)
