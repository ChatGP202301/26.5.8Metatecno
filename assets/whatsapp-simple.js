/**
 * Simple WhatsApp Floating Button
 * Only shows WhatsApp icon and opens chat directly
 */

(function() {
  'use strict';

  // Configuration
  const whatsappNumber = '862372600785'; // +86 23 7260 0785
  const defaultMessage = 'Hello, I\'m interested in your products';

  // Create WhatsApp button
  function createWhatsAppButton() {
    const button = document.createElement('a');
    button.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.className = 'whatsapp-float-button';
    button.setAttribute('aria-label', 'Contact us on WhatsApp');
    
    button.innerHTML = `
      <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
        <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 7.933-2.127c2.42 1.37 5.173 2.127 8.067 2.127 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.467c-2.482 0-4.908-0.646-7.07-1.87l-0.507-0.292-4.713 1.262 1.262-4.669-0.292-0.508c-1.207-2.100-1.847-4.507-1.847-6.957 0-7.51 6.11-13.62 13.62-13.62s13.62 6.11 13.62 13.62-6.11 13.62-13.62 13.62zM21.305 19.26c-0.346-0.174-2.049-1.007-2.366-1.123-0.316-0.116-0.547-0.174-0.776 0.174s-0.893 1.123-1.094 1.347c-0.201 0.224-0.402 0.251-0.748 0.076-0.346-0.174-1.461-0.539-2.785-1.722-1.031-0.922-1.727-2.061-1.929-2.407-0.201-0.346-0.022-0.533 0.152-0.707 0.156-0.154 0.346-0.402 0.52-0.603 0.174-0.201 0.231-0.346 0.346-0.571 0.116-0.224 0.058-0.427-0.028-0.603s-0.776-1.87-1.063-2.565c-0.28-0.672-0.56-0.58-0.776-0.591-0.201-0.008-0.428-0.010-0.656-0.010s-0.603 0.085-0.92 0.427c-0.316 0.346-1.206 1.179-1.206 2.873s1.235 3.333 1.406 3.561c0.174 0.224 2.425 3.732 5.872 5.234 0.821 0.354 1.462 0.566 1.962 0.724 0.825 0.262 1.577 0.225 2.168 0.137 0.661-0.099 2.049-0.835 2.335-1.642 0.288-0.807 0.288-1.501 0.201-1.642-0.086-0.14-0.316-0.224-0.662-0.398z"/>
      </svg>
    `;
    
    return button;
  }

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .whatsapp-float-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }

    .whatsapp-float-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6);
    }

    .whatsapp-float-button:active {
      transform: scale(0.95);
    }

    @media (max-width: 768px) {
      .whatsapp-float-button {
        bottom: 80px;
        right: 15px;
        width: 56px;
        height: 56px;
      }
      
      .whatsapp-float-button svg {
        width: 28px;
        height: 28px;
      }
    }

    @media print {
      .whatsapp-float-button {
        display: none !important;
      }
    }
  `;

  // Initialize
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    document.head.appendChild(style);
    document.body.appendChild(createWhatsAppButton());
    
    console.log('WhatsApp button initialized');
  }

  init();

})();
