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

// Clean up old reaction data to prevent localStorage bloat
export const cleanupOldReactions = () => {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('reaction_')) {
      try {
        // Extract message ID from key (assumes message ID is timestamp)
        const parts = key.split('_');
        const messageId = parts[parts.length - 1];
        
        // If message ID is a timestamp older than a week, remove it
        if (!isNaN(messageId) && parseInt(messageId) < oneWeekAgo) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // If we can't parse it, leave it alone
      }
    }
  });
};
