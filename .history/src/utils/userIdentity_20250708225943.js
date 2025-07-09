// src/utils/userIdentity.js
// Generate a semi-unique user ID based on browser characteristics
export const generateUserFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Fingerprint test', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.cookieEnabled,
    canvas.toDataURL()
  ].join('|');
  
  // Generate a hash-like ID from the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

export const getUserId = () => {
  let userId = localStorage.getItem('fade-user-id');
  if (!userId) {
    userId = generateUserFingerprint();
    localStorage.setItem('fade-user-id', userId);
  }
  return userId;
};

export const getUserReactionKey = (messageId) => {
  return `reaction_${getUserId()}_${messageId}`;
};
