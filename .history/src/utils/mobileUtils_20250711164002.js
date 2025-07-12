// src/utils/mobileUtils.js
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

export const getViewportDimensions = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
};

export const isSmallScreen = () => {
  const { width } = getViewportDimensions();
  return width < 768;
};

export const isExtraSmallScreen = () => {
  const { width } = getViewportDimensions();
  return width < 480;
};

export const hasNotch = () => {
  // Check for devices with notches/safe areas
  return CSS.supports('padding-bottom: env(safe-area-inset-bottom)');
};

export const preventZoom = () => {
  // Prevent zoom on input focus for iOS
  if (isIOS()) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }
};

export const addTouchFriendlyClasses = () => {
  if (isMobile()) {
    document.body.classList.add('mobile-device');
  }
  if (isIOS()) {
    document.body.classList.add('ios-device');
  }
  if (isAndroid()) {
    document.body.classList.add('android-device');
  }
  if (hasNotch()) {
    document.body.classList.add('has-notch');
  }
};
