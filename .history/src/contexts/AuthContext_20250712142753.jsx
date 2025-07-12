import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, set, get, onValue, off, serverTimestamp, update } from 'firebase/database';
import { getUserId } from '../utils/userIdentity';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, database }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  const guestUserId = getUserId();

  useEffect(() => {
    if (!database) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    const checkExistingAuth = async () => {
      try {
        setLoading(true);
        const savedAuth = localStorage.getItem('fade-auth');
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          const userRef = ref(database, `users/${authData.username}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.password === authData.password) {
              setUser({
                ...userData,
                username: authData.username,
                isSignedIn: true
              });
              setIsSignedIn(true);
              
              // Update last login and set online status
              await update(ref(database, `users/${authData.username}`), {
                lastLogin: serverTimestamp(),
                isOnline: true,
                lastSeen: serverTimestamp()
              });
            } else {
              // Invalid saved auth, remove it
              localStorage.removeItem('fade-auth');
            }
          } else {
            // User doesn't exist, remove saved auth
            localStorage.removeItem('fade-auth');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, remove potentially corrupted auth data
        localStorage.removeItem('fade-auth');
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkExistingAuth();
  }, [database]);

  const signUp = async (username, password) => {
    if (!database) throw new Error('Database not initialized');

    // Validate username
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be 3-20 characters long');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if username exists
    const userRef = ref(database, `users/${username}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      throw new Error('Username already exists');
    }

    // Create user account
    const newUser = {
      username,
      password, // In production, this should be hashed
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isOnline: true,
      lastSeen: serverTimestamp(),
      xp: 0,
      level: 1,
      totalMessages: 0,
      totalLikes: 0,
      totalDislikes: 0,
      status: 'online',
      bio: '',
      reports: 0,
      bannedUntil: null,
      guestUserId: guestUserId // Link to guest sessions
    };

    await set(userRef, newUser);

    // Save auth to localStorage
    localStorage.setItem('fade-auth', JSON.stringify({ username, password }));

    setUser({ ...newUser, isSignedIn: true });
    setIsSignedIn(true);

    return newUser;
  };

  const signIn = async (username, password) => {
    if (!database) throw new Error('Database not initialized');

    try {
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = snapshot.val();
      
      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      // Check if user is banned
      if (userData.bannedUntil && new Date(userData.bannedUntil) > new Date()) {
        const banEndTime = new Date(userData.bannedUntil).toLocaleString();
        throw new Error(`Account is banned until ${banEndTime}`);
      }

      // Update login info
      await update(userRef, {
        lastLogin: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp()
      });

      // Save auth to localStorage
      localStorage.setItem('fade-auth', JSON.stringify({ username, password }));

      const updatedUser = { ...userData, username, isSignedIn: true };
      setUser(updatedUser);
      setIsSignedIn(true);

      return updatedUser;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (user && database) {
      // Set user offline
      await update(ref(database, `users/${user.username}`), {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
    }

    localStorage.removeItem('fade-auth');
    setUser(null);
    setIsSignedIn(false);
  };

  const updateUserXP = async (xpGain) => {
    if (!isSignedIn || !user || !database) return;

    const newXP = user.xp + xpGain;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    await update(ref(database, `users/${user.username}`), {
      xp: newXP,
      level: newLevel
    });

    setUser(prev => ({ ...prev, xp: newXP, level: newLevel }));
  };

  const updateUserStats = async (messagesSent = 0, likesReceived = 0, dislikesReceived = 0) => {
    if (!isSignedIn || !user || !database) return;

    const updates = {};
    if (messagesSent) {
      updates.totalMessages = (user.totalMessages || 0) + messagesSent;
      updates.xp = (user.xp || 0) + (messagesSent * 5); // 5 XP per message
    }
    if (likesReceived) {
      updates.totalLikes = (user.totalLikes || 0) + likesReceived;
      updates.xp = (user.xp || 0) + (likesReceived * 10); // 10 XP per like
    }
    if (dislikesReceived) {
      updates.totalDislikes = (user.totalDislikes || 0) + dislikesReceived;
    }

    if (updates.xp) {
      updates.level = Math.floor(updates.xp / 100) + 1;
    }

    await update(ref(database, `users/${user.username}`), updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  const reportUser = async (reportedUsername, reason) => {
    if (!database) throw new Error('Database not initialized');

    const reportRef = ref(database, `reports/${reportedUsername}/${Date.now()}`);
    await set(reportRef, {
      reportedBy: isSignedIn ? user.username : guestUserId,
      reason,
      timestamp: serverTimestamp()
    });

    // Increment user's report count
    const userRef = ref(database, `users/${reportedUsername}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const newReportCount = (userData.reports || 0) + 1;
      
      const updates = { reports: newReportCount };
      
      // Ban user if they have 5 or more reports
      if (newReportCount >= 5) {
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 1); // 1 day ban
        updates.bannedUntil = banUntil.toISOString();
        updates.isOnline = false;
      }
      
      await update(userRef, updates);
    }
  };

  const getGuestUserId = () => guestUserId;

  const value = {
    isSignedIn,
    user,
    loading,
    authChecked,
    signUp,
    signIn,
    signOut,
    updateUserXP,
    updateUserStats,
    reportUser,
    getGuestUserId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
