import React from 'react';

// Bootstrap Icons utility for ensuring icons are loaded
// This file helps debug and ensure Bootstrap Icons are properly loaded

export const checkBootstrapIcons = () => {
  // Check if Bootstrap Icons CSS is loaded
  const stylesheets = Array.from(document.styleSheets);
  const bootstrapIconsLoaded = stylesheets.some(sheet => {
    try {
      return sheet.href && (
        sheet.href.includes('bootstrap-icons') || 
        sheet.href.includes('bi.css')
      );
    } catch (e) {
      return false;
    }
  });

  // Check if any Bootstrap Icon classes exist in CSS
  const testElement = document.createElement('i');
  testElement.className = 'bi bi-house';
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const hasIconFont = computedStyle.fontFamily.includes('bootstrap-icons') || 
                     computedStyle.content !== 'none';
  
  document.body.removeChild(testElement);

  console.log('Bootstrap Icons Debug Info:', {
    stylesheetLoaded: bootstrapIconsLoaded,
    iconFontDetected: hasIconFont,
    totalStylesheets: stylesheets.length
  });

  return bootstrapIconsLoaded || hasIconFont;
};

// Common Bootstrap Icons used in the application
export const ICONS = {
  // Navigation
  chevronLeft: 'bi-chevron-left',
  chevronRight: 'bi-chevron-right',
  chevronDown: 'bi-chevron-down',
  chevronUp: 'bi-chevron-up',
  
  // Actions
  search: 'bi-search',
  bell: 'bi-bell',
  chatDots: 'bi-chat-dots',
  person: 'bi-person',
  boxArrowRight: 'bi-box-arrow-right',
  
  // Status
  checkCircle: 'bi-check-circle',
  exclamationTriangle: 'bi-exclamation-triangle',
  clock: 'bi-clock',
  inbox: 'bi-inbox',
  
  // UI Elements
  grid: 'bi-grid',
  list: 'bi-list',
  eye: 'bi-eye',
  gear: 'bi-gear',
  plus: 'bi-plus',
  x: 'bi-x'
};

// Fallback icon component for when Bootstrap Icons fail to load
export const FallbackIcon = ({ icon, className = '', style = {} }) => {
  const iconMap = {
    'bi-chevron-left': '‹',
    'bi-chevron-right': '›',
    'bi-chevron-down': '⌄',
    'bi-chevron-up': '⌃',
    'bi-search': '🔍',
    'bi-bell': '🔔',
    'bi-chat-dots': '💬',
    'bi-person': '👤',
    'bi-box-arrow-right': '↗',
    'bi-check-circle': '✓',
    'bi-exclamation-triangle': '⚠',
    'bi-clock': '🕐',
    'bi-inbox': '📥',
    'bi-grid': '⊞',
    'bi-list': '☰',
    'bi-eye': '👁',
    'bi-gear': '⚙',
    'bi-plus': '+',
    'bi-x': '×'
  };

  const fallbackChar = iconMap[icon] || '?';
  
  return (
    <span 
      className={`fallback-icon ${className}`}
      style={{ 
        display: 'inline-block',
        textAlign: 'center',
        fontWeight: 'bold',
        ...style 
      }}
      title={`Icon: ${icon}`}
    >
      {fallbackChar}
    </span>
  );
};

// Enhanced Icon component with fallback
export const Icon = ({ name, className = '', style = {}, fallback = true }) => {
  const iconClass = name.startsWith('bi-') ? name : `bi-${name}`;
  
  return (
    <>
      <i className={`bi ${iconClass} ${className}`} style={style}></i>
      {fallback && (
        <noscript>
          <FallbackIcon icon={iconClass} className={className} style={style} />
        </noscript>
      )}
    </>
  );
};

export default { checkBootstrapIcons, ICONS, FallbackIcon, Icon };