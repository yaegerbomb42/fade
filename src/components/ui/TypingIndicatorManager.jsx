import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

const TypingIndicatorManager = ({ database, activeChannel, children }) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const { isSignedIn, user, getGuestUserId } = useAuth();

  useEffect(() => {
    if (!database || !activeChannel) return;

    const channelId = activeChannel.id.replace(/[.#$[\]]/g, '_');
    const typingRef = ref(database, `typing/${channelId}`);

    // Listen for typing users
    const unsubscribe = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();
        const now = Date.now();
        
        // Filter out expired typing indicators (older than 3 seconds)
        const activeTypers = Object.entries(typingData)
          .filter(([userId, data]) => {
            return data.timestamp && (now - data.timestamp) < 3000;
          })
          .map(([userId, data]) => ({
            userId,
            username: data.username,
            isSignedIn: data.isSignedIn
          }));

        setTypingUsers(activeTypers);
      } else {
        setTypingUsers([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [database, activeChannel]);

  const updateTypingStatus = (isTyping) => {
    if (!database || !activeChannel) return;

    const channelId = activeChannel.id.replace(/[.#$[\]]/g, '_');
    const userId = isSignedIn ? user.username : getGuestUserId();
    const username = isSignedIn ? user.username : `Guest-${getGuestUserId().slice(-4)}`;
    const typingUserRef = ref(database, `typing/${channelId}/${userId}`);

    if (isTyping) {
      set(typingUserRef, {
        username,
        isSignedIn,
        timestamp: Date.now()
      });
    } else {
      set(typingUserRef, null);
    }
  };

  // Clean up typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!database || !activeChannel) return;

      const channelId = activeChannel.id.replace(/[.#$[\]]/g, '_');
      const typingRef = ref(database, `typing/${channelId}`);
      const now = Date.now();

      // Get current typing data and remove expired entries
      onValue(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          const typingData = snapshot.val();
          const updates = {};
          
          Object.entries(typingData).forEach(([userId, data]) => {
            if (!data.timestamp || (now - data.timestamp) >= 3000) {
              updates[userId] = null;
            }
          });

          if (Object.keys(updates).length > 0) {
            set(typingRef, { ...typingData, ...updates });
          }
        }
      }, { onlyOnce: true });
    }, 2000);

    return () => clearInterval(interval);
  }, [database, activeChannel]);

  return children({ typingUsers, updateTypingStatus });
};

export default TypingIndicatorManager;
