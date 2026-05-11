/**
 * Metatecno Website Enhanced JavaScript
 * Provides interactive features, accessibility improvements, and performance optimizations
 */

(function() {
  'use strict';

  // ==================== Mobile Navigation ====================
  function initMobileNav() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    // Create mobile menu toggle button
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line class="line-1" x1="3" y1="6" x2="21" y2="6"></line>
        <line class="line-2" x1="3" y1="12" x2="21" y2="12"></line>
        <line class="line-3" x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

    const nav = header.querySelector('.nav');
    if (nav && window.innerWidth <= 960) {
      header.insertBefore(mobileToggle, nav);
      nav.classList.add('mobile-hidden');
      
      mobileToggle.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('mobile-hidden');
        this.classList.toggle('active');
      });
    }
  }

  // ==================== Smooth Scroll ====================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ==================== Lazy Loading Enhancement ====================
  function enhanceLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              img.removeAttribute('data-srcset');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // ==================== Scroll Progress Indicator ====================
  function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    }, { passive: true });
  }

  // ==================== Header Scroll Behavior ====================
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset;
          
          if (currentScroll > 100) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }

          if (currentScroll > lastScroll && currentScroll > 200) {
            header.classList.add('hidden');
          } else {
            header.classList.remove('hidden');
          }

          lastScroll = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==================== Language Selector Enhancement ====================
  function enhanceLanguageSelector() {
    const langDetails = document.querySelector('.language');
    if (!langDetails) return;

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!langDetails.contains(e.target) && langDetails.hasAttribute('open')) {
        langDetails.removeAttribute('open');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && langDetails.hasAttribute('open')) {
        langDetails.removeAttribute('open');
        langDetails.querySelector('summary').focus();
      }
    });
  }

  // ==================== Contact Form Enhancement ====================
  function enhanceContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // Simulate form submission (replace with actual endpoint)
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.textContent = 'Thank you! Your message has been sent successfully.';
        form.insertBefore(successMsg, form.firstChild);
        
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        setTimeout(() => successMsg.remove(), 5000);
      }, 1500);
    });

    // Input validation feedback
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', function() {
        if (!this.validity.valid) {
          this.classList.add('invalid');
        } else {
          this.classList.remove('invalid');
        }
      });

      field.addEventListener('input', function() {
        if (this.classList.contains('invalid') && this.validity.valid) {
          this.classList.remove('invalid');
        }
      });
    });
  }

  // ==================== Animate on Scroll ====================
  function initAnimateOnScroll() {
    if ('IntersectionObserver' in window) {
      const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            animateObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      document.querySelectorAll('.media-card, .section-head, .feature-grid article').forEach(el => {
        el.classList.add('animate-on-scroll');
        animateObserver.observe(el);
      });
    }
  }

  // ==================== Image Gallery Lightbox ====================
  function initImageGallery() {
    const productCards = document.querySelectorAll('.product-card img, .workshop img, .equipment img');
    
    productCards.forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', function() {
        openLightbox(this);
      });
    });
  }

  function openLightbox(img) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <img src="${img.src}" alt="${img.alt}">
      </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => lightbox.classList.add('active'), 10);

    const close = () => {
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.remove();
        document.body.style.overflow = '';
      }, 300);
    };

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // ==================== Dark Mode Toggle ====================
  function initDarkMode() {
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
    darkModeToggle.innerHTML = `
      <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;

    const header = document.querySelector('.site-header');
    if (header) {
      header.appendChild(darkModeToggle);
    }

    // Check for saved preference or system preference
    const darkModePreference = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (darkModePreference === 'enabled' || (!darkModePreference && systemPrefersDark)) {
      document.documentElement.classList.add('dark-mode');
    }

    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      const isDark = document.documentElement.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    });
  }

  // ==================== Performance Monitoring ====================
  function monitorPerformance() {
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.loadTime > 2500) {
              console.warn('Slow resource detected:', entry.name, entry.loadTime);
            }
          }
        });
        perfObserver.observe({ entryTypes: ['resource', 'navigation'] });
      } catch (e) {
        console.log('Performance monitoring not supported');
      }
    }
  }

  // ==================== Accessibility Enhancements ====================
  function enhanceAccessibility() {
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content ID if not exists
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }

    // Focus visible for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  // ==================== Initialize All ====================
  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initMobileNav();
    initSmoothScroll();
    enhanceLazyLoading();
    initScrollProgress();
    initHeaderScroll();
    enhanceLanguageSelector();
    enhanceContactForm();
    initAnimateOnScroll();
    initImageGallery();
    initDarkMode();
    enhanceAccessibility();
    monitorPerformance();

    console.log('Metatecno website enhanced and ready!');
  }

  // Start initialization
  init();

})();
