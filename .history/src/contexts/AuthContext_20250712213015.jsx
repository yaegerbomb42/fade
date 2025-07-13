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

  // Test database connection on mount
  useEffect(() => {
    const testConnection = async () => {
      if (database) {
        try {
          // Try a simple read operation to test connection
          const testRef = ref(database, '.info/connected');
          const snapshot = await get(testRef);
          console.log('Database connection test:', snapshot.exists() ? 'Connected' : 'Not connected');
        } catch (error) {
          console.error('Database connection test failed:', error);
        }
      }
    };

    testConnection();
  }, [database]);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedAuth = localStorage.getItem('fade-auth');
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          
          // Check if user exists in local storage first
          const localUsers = JSON.parse(localStorage.getItem('fade-local-users') || '{}');
          if (localUsers[authData.username]) {
            const userData = localUsers[authData.username];
            setUser({ 
              ...userData,
              username: authData.username, 
              isSignedIn: true
            });
            setIsSignedIn(true);
          } else {
            // Default user data if not found locally
            setUser({ 
              username: authData.username, 
              isSignedIn: true,
              xp: 0,
              level: 1,
              totalMessages: 0,
              totalLikes: 0
            });
            setIsSignedIn(true);
          }
        }
      } catch (error) {
        localStorage.removeItem('fade-auth');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (username, password) => {
    if (!database) throw new Error('Database not initialized');

    // Simple validation
    if (username.length < 3) throw new Error('Username too short');
    if (password.length < 6) throw new Error('Password too short');

    try {
      // Add timeout for the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Account creation timed out')), 10000)
      );

      // Check if username already exists first
      const userRef = ref(database, `users/${username}`);
      const existingUser = await Promise.race([
        get(userRef),
        timeoutPromise
      ]);

      if (existingUser.exists()) {
        throw new Error('Username already taken');
      }

      // Create user account with minimal data
      const newUser = {
        username,
        password,
        createdAt: Date.now(),
        xp: 0,
        level: 1,
        totalMessages: 0,
        totalLikes: 0,
        isOnline: true
      };

      // Create the user with timeout
      await Promise.race([
        set(userRef, newUser),
        timeoutPromise
      ]);

      // Save auth locally
      localStorage.setItem('fade-auth', JSON.stringify({ username, password }));

      setUser({ ...newUser, isSignedIn: true });
      setIsSignedIn(true);

      return newUser;
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Fallback to local-only account creation if Firebase fails
      if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('permission')) {
        console.log('Firebase failed, creating local account');
        
        // Check local storage for existing users
        const localUsers = JSON.parse(localStorage.getItem('fade-local-users') || '{}');
        if (localUsers[username]) {
          throw new Error('Username already taken');
        }
        
        // Create local user
        const newUser = {
          username,
          password,
          createdAt: Date.now(),
          xp: 0,
          level: 1,
          totalMessages: 0,
          totalLikes: 0,
          isOnline: true,
          localOnly: true
        };
        
        // Save to local storage
        localUsers[username] = newUser;
        localStorage.setItem('fade-local-users', JSON.stringify(localUsers));
        localStorage.setItem('fade-auth', JSON.stringify({ username, password }));
        
        setUser({ ...newUser, isSignedIn: true });
        setIsSignedIn(true);
        
        return newUser;
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('Account creation is taking too long. Please check your connection and try again.');
      }
      if (error.message.includes('permission')) {
        throw new Error('Account creation failed. Please try again.');
      }
      throw error;
    }
  };

  const signIn = async (username, password) => {
    if (!database) throw new Error('Database not initialized');

    try {
      // Add timeout for the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timed out')), 8000)
      );

      const userRef = ref(database, `users/${username}`);
      const snapshot = await Promise.race([
        get(userRef),
        timeoutPromise
      ]);
      
      if (!snapshot.exists()) {
        // Check local storage as fallback
        const localUsers = JSON.parse(localStorage.getItem('fade-local-users') || '{}');
        if (localUsers[username]) {
          const userData = localUsers[username];
          if (userData.password !== password) {
            throw new Error('Invalid password');
          }
          
          // Save auth locally
          localStorage.setItem('fade-auth', JSON.stringify({ username, password }));
          
          const user = { ...userData, username, isSignedIn: true };
          setUser(user);
          setIsSignedIn(true);
          
          return user;
        }
        
        throw new Error('User not found');
      }

      const userData = snapshot.val();
      
      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      // Save auth locally
      localStorage.setItem('fade-auth', JSON.stringify({ username, password }));

      const user = { ...userData, username, isSignedIn: true };
      setUser(user);
      setIsSignedIn(true);

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Sign in is taking too long. Please check your connection and try again.');
      }
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
    if (!isSignedIn || !user || !database) {
      console.warn('Cannot update user stats: user not signed in or database not available');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error; // Re-throw to let caller handle
    }
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
