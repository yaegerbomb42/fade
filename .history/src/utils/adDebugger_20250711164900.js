// src/utils/adDebugger.js
export const debugAdIssues = () => {
  const debug = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    },
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'None',
    adBlocker: detectAdBlocker(),
    scripts: getAdScripts(),
    containers: getAdContainers(),
    networkErrors: getNetworkErrors(),
    console: getConsoleErrors()
  };

  console.group('🔍 Ad Debug Report');
  console.table(debug);
  console.groupEnd();

  return debug;
};

const detectAdBlocker = () => {
  try {
    // Simple ad blocker detection
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    document.body.appendChild(testAd);
    
    const detected = testAd.offsetHeight === 0;
    document.body.removeChild(testAd);
    
    return detected ? 'Likely blocked' : 'Not detected';
  } catch (e) {
    return 'Unknown';
  }
};

const getAdScripts = () => {
  const scripts = document.querySelectorAll('script[src*="profitableratecpm.com"]');
  return Array.from(scripts).map(script => ({
    src: script.src,
    loaded: script.readyState === 'complete' || script.readyState === 'loaded',
    async: script.async,
    hasError: script.onerror !== null
  }));
};

const getAdContainers = () => {
  const containers = [
    {
      id: 'container-58d94318819023c51d2375249b2d6604',
      type: 'Banner Ad'
    },
    {
      class: 'social-bar-container',
      type: 'Social Bar'
    }
  ];

  return containers.map(container => {
    const element = container.id 
      ? document.getElementById(container.id)
      : document.querySelector(`.${container.class}`);
    
    return {
      type: container.type,
      exists: !!element,
      hasContent: element ? element.innerHTML.trim().length > 0 : false,
      contentLength: element ? element.innerHTML.trim().length : 0,
      visible: element ? element.offsetHeight > 0 && element.offsetWidth > 0 : false,
      styles: element ? {
        display: window.getComputedStyle(element).display,
        visibility: window.getComputedStyle(element).visibility,
        opacity: window.getComputedStyle(element).opacity
      } : null
    };
  });
};

const getNetworkErrors = () => {
  return window.adNetworkErrors || [];
};

const getConsoleErrors = () => {
  // This would need to be set up to capture console errors
  return window.adConsoleErrors || [];
};

// Auto-debug on load
export const setupAdDebugging = () => {
  // Capture network errors
  window.adNetworkErrors = [];
  window.adConsoleErrors = [];

  // Override console.error to capture ad-related errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('profitableratecpm') || message.includes('adsterra') || message.includes('monetag')) {
      window.adConsoleErrors.push({
        timestamp: new Date().toISOString(),
        message: message
      });
    }
    originalError.apply(console, args);
  };

  // Monitor script loading
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && node.src && node.src.includes('profitableratecpm')) {
          console.log('🔍 Ad script detected:', node.src);
          
          node.addEventListener('load', () => {
            console.log('✅ Ad script loaded:', node.src);
            setTimeout(() => debugAdIssues(), 2000);
          });
          
          node.addEventListener('error', (e) => {
            console.error('❌ Ad script failed:', node.src, e);
            window.adNetworkErrors.push({
              timestamp: new Date().toISOString(),
              script: node.src,
              error: e.toString()
            });
          });
        }
      });
    });
  });

  observer.observe(document.head, { childList: true, subtree: true });

  // Debug after 5 seconds
  setTimeout(() => {
    debugAdIssues();
  }, 5000);
};
