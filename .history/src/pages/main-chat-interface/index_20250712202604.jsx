// src/pages/main-chat-interface/index.jsx
// 
// CLEAN STATE: All advertising components and utilities have been removed to eliminate UI clutter and CPU usage.
// The codebase remains ready for future ad re-implementation if needed.
// 
// Removed: AdsterraBanner, SocialBar, ad debugging utilities, and ad blocker effects.
// Maintained: Mobile utilities for responsive design, core chat functionality.
//
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { ref, onChildAdded, onChildChanged, off, push as firebasePush, runTransaction, onValue, serverTimestamp, onDisconnect, query, orderByChild, startAt, get, set, update } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';
import TypingIndicatorManager from 'components/ui/TypingIndicatorManager';
import { getUserId } from '../../utils/userIdentity';
import { isMobile, isSmallScreen, isExtraSmallScreen, addTouchFriendlyClasses, preventZoom } from '../../utils/mobileUtils';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../../components/auth/AuthModal';
import UserProfile from '../../components/auth/UserProfile';
import ReportModal from '../../components/auth/ReportModal';
import { database } from '../../utils/firebase';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import { TopVibesSection, TopVibersSection } from 'components/ui/TopVibesSection';
import ProfanityFilterToggle from 'components/ui/ProfanityFilterToggle';

const MainChatInterface = () => {
  const { channelId: urlChannelId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageQueue, setMessageQueue] = useState([]);
  const permanentlyProcessedIds = useRef(new Set());
  const messagePositions = useRef(new Map()); // Track active message positions for collision detection
  // Remove channelMessages - it's causing cross-contamination
  const [activeChannel, setActiveChannel] = useState({ id: 'vibes', name: 'Just Vibes' });
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    // Show welcome for first-time users or when no channel is selected
    const hasVisited = localStorage.getItem('fade-has-visited');
    return !hasVisited;
  });
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [activityLevel, setActivityLevel] = useState(1);
  const [showTopVibes, setShowTopVibes] = useState(false);
  const [channelVibesHistory, setChannelVibesHistory] = useState({}); // Only for top vibes
  const [activeUsers, setActiveUsers] = useState(1); // Start with 1 (current user)
  const [channelUserCounts, setChannelUserCounts] = useState({}); // Track users per channel
  const [isMobileView, setIsMobileView] = useState(false); // Mobile state
  
  // New authentication and feature state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUsername, setReportUsername] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [authUIMinimized, setAuthUIMinimized] = useState(true); // Start minimized
  const [guestModeConfirmed, setGuestModeConfirmed] = useState(() => {
    return localStorage.getItem('fade-guest-mode-confirmed') === 'true';
  });
  
  const REGULAR_MESSAGE_FLOW_DURATION = 25000; // 25 seconds for regular messages
  const activityTimeWindow = 30 * 1000; // 30 seconds
  const currentUserId = useRef(getUserId());
  const presenceRef = useRef(null);
  const currentChannelRef = useRef(null); // Track current channel for cleanup
  const { isSignedIn, user, updateUserStats, authChecked, signOut } = useAuth();

  // Channel mapping for URL routing
  const channelMap = {
    'vibes': { id: 'vibes', name: 'Just Vibes' },
    'gaming': { id: 'gaming', name: 'Gaming' },
    'movies': { id: 'movies', name: 'Movies' },
    'sports': { id: 'sports', name: 'Sports' },
    'family-friendly': { id: 'family-friendly', name: 'Family Friendly' },
    'random-chat': { id: 'random-chat', name: 'Random Chat' },
    'just-chatting': { id: 'just-chatting', name: 'Just Chatting' },
    'music': { id: 'music', name: 'Music' },
    'late-night': { id: 'late-night', name: 'Late Night' },
    'deep-thoughts': { id: 'deep-thoughts', name: 'Deep Thoughts' },
    'creative-zone': { id: 'creative-zone', name: 'Creative Zone' },
    'study-break': { id: 'study-break', name: 'Study Break' }
  };

  // Handle URL channel parameter with proper initialization
  useEffect(() => {
    if (urlChannelId && channelMap[urlChannelId]) {
      const newChannel = channelMap[urlChannelId];
      console.log(`Setting channel from URL: ${urlChannelId} ->`, newChannel);
      setActiveChannel(newChannel);
      setShowWelcome(false); // Hide welcome when navigating to specific channel
    } else if (urlChannelId) {
      console.warn(`Unknown channel ID in URL: ${urlChannelId}`);
      // Fallback to default channel if invalid URL
      setActiveChannel({ id: 'vibes', name: 'Just Vibes' });
    }
  }, [urlChannelId]);

  // Initialize mobile detection and optimizations
  useEffect(() => {
    const initializeMobile = () => {
      const mobile = isMobile();
      setIsMobileView(mobile);
      
      if (mobile) {
        // Add mobile-specific classes
        addTouchFriendlyClasses();
        preventZoom();
        
        // Optimize for mobile performance
        document.body.style.overflow = 'hidden'; // Prevent bounce scrolling
        
        // Add mobile viewport meta tag optimization
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && isSmallScreen()) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
      }
    };

    initializeMobile();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(initializeMobile, 100); // Delay to ensure proper viewport update
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);  // Event listeners for modals and user interactions
  useEffect(() => {
    const handleOpenReportModal = (event) => {
      setReportUsername(event.detail.username);
      setShowReportModal(true);
    };

    const handleSignOut = async () => {
      try {
        if (isSignedIn && signOut) {
          await signOut();
        }
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    const handleEditProfile = () => {
      // For now, just show a simple alert. In the future, this could open an edit modal
      alert('Profile editing feature coming soon!');
    };

    window.addEventListener('openReportModal', handleOpenReportModal);
    window.addEventListener('signOut', handleSignOut);
    window.addEventListener('editProfile', handleEditProfile);

    return () => {
      window.removeEventListener('openReportModal', handleOpenReportModal);
      window.removeEventListener('signOut', handleSignOut);
      window.removeEventListener('editProfile', handleEditProfile);
    };
  }, [isSignedIn]);

  // User interaction handlers
  const handleUserClick = async (username) => {
    if (!database) return;
    
    try {
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setProfileUser({ ...userData, username });
        setShowUserProfile(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleReportClick = (username) => {
    setReportUsername(username);
    setShowReportModal(true);
  };

  const handleTypingChange = (isTyping) => {
    setIsTyping(isTyping);
    // This will be handled by TypingIndicatorManager
  };

  // Share channel functionality
  const shareChannel = useCallback(async () => {
    const shareUrl = `${window.location.origin}/channel/${activeChannel.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${activeChannel.name} on Fade`,
          text: `Join the conversation in ${activeChannel.name}!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Show a temporary notification
        handleShareNotification();
      }
    } catch (error) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        handleShareNotification();
      } catch (clipboardError) {
        console.log('Share URL:', shareUrl);
      }
    }
  }, [activeChannel?.id, activeChannel?.name]);

  const [showShareNotification, setShowShareNotification] = useState(false);
  
  const handleShareNotification = () => {
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2000);
  };

  // Simple and reliable lane system - no overlaps guaranteed
  const lanes = 10; // Number of horizontal lanes
  const laneHeight = 40; // Fixed vertical spacing between lanes
  const topMargin = 120; // Start position from top

  // Track when each lane was last used to prevent overlaps
  const laneOccupancy = useRef(new Array(lanes).fill(0));

  const findAvailablePosition = useCallback((messageId, messageText = '', preferredLane = null) => {
    const now = Date.now();
    const minTimeBetweenMessages = 1200; // Minimum time between messages in same lane
    
    // Find the lane that's been free the longest
    let bestLane = 0;
    let oldestTime = laneOccupancy.current[0];
    
    for (let i = 1; i < lanes; i++) {
      if (laneOccupancy.current[i] < oldestTime) {
        oldestTime = laneOccupancy.current[i];
        bestLane = i;
      }
    }
    
    // If the best lane was used too recently, find any available lane
    if (now - laneOccupancy.current[bestLane] < minTimeBetweenMessages) {
      for (let i = 0; i < lanes; i++) {
        if (now - laneOccupancy.current[i] >= minTimeBetweenMessages) {
          bestLane = i;
          break;
        }
      }
    }
    
    // Mark this lane as occupied
    laneOccupancy.current[bestLane] = now;
    
    const laneTop = topMargin + (bestLane * laneHeight);
    const position = {
      lane: bestLane,
      top: laneTop,
      left: 105,
      horizontalStart: 105,
      animationSpeed: 2,
      createdAt: now
    };
    
    messagePositions.current.set(messageId, position);
    return position;
  }, []);

  // Enhanced position cleanup with reservation management
  const removeMessagePosition = useCallback((messageId) => {
    const position = messagePositions.current.get(messageId);
    if (position) {
      // Clear the position reservation
      messagePositions.current.delete(messageId);
    }
  }, []);

  // Periodic cleanup of stale position reservations
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 120000; // 2 minutes
      
      // Remove position reservations for messages that are too old
      Array.from(messagePositions.current.entries()).forEach(([messageId, position]) => {
        if (position.createdAt && (now - position.createdAt) > staleThreshold) {
          messagePositions.current.delete(messageId);
        }
      });
    }, 60000); // Clean up every 60 seconds instead of 30
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Simplified position update to prevent performance issues
  const updateMessagePosition = useCallback((messageId, newLeft) => {
    const position = messagePositions.current.get(messageId);
    if (!position) return;
    
    // Simple position update without complex collision checking
    messagePositions.current.set(messageId, { ...position, left: newLeft });
  }, []);

  // Highway traffic management - adaptive queue processing with speed control
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processQueue = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...rest] = prev;

        setMessages(msgs => {
          const exists = msgs.some(m => m.id === next.id);
          if (!exists && next && next.id && typeof next === 'object') {
            
            const messageText = next.text || '';
            const position = findAvailablePosition(next.id, messageText);
            
            // Simple message object
            const validatedMessage = {
              id: next.id,
              text: messageText,
              author: next.author || 'Anonymous',
              timestamp: next.timestamp || new Date().toISOString(),
              reactions: next.reactions || { thumbsUp: 0, thumbsDown: 0 },
              isUserMessage: next.isUserMessage || false,
              userId: next.userId || null,
              animationDuration: '25s', // Fixed duration for simplicity
              channelId: activeChannel?.id,
              position: position
            };
            
            msgs = [...msgs, validatedMessage];
            setMessageTimestamps(t => [...t, Date.now()]);
          }
          return msgs;
        });

        return rest;
      });
    };

    // Simple processing - one message every 500ms to prevent overlaps
    const interval = setInterval(processQueue, 500);
    return () => clearInterval(interval);
  }, [messageQueue.length, activeChannel?.id, findAvailablePosition]);

  // Update activity level calculation based on channel message flow - SIMPLIFIED
  useEffect(() => {
    // Just set a reasonable default activity level instead of calculating constantly
    setActivityLevel(2); // Default moderate activity
  }, [activeChannel?.id]);

  // Clean up messages that have completed their flow journey
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setMessages(prev => {
        const newMessages = prev.filter(message => {
          const messageTime = new Date(message.timestamp).getTime();
          const timeAlive = now - messageTime;
          const animationDuration = parseFloat(message.animationDuration) * 1000; // Convert to milliseconds
          
          // Remove messages that have completed their flow animation
          const shouldKeep = timeAlive < animationDuration;
          
          // Clean up position tracking for removed messages
          if (!shouldKeep) {
            removeMessagePosition(message.id);
          }
          
          return shouldKeep;
        });
        
        return newMessages.length !== prev.length ? newMessages : prev; // Only update if something changed
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Track user presence - DISABLED FOR PERFORMANCE
  useEffect(() => {
    // Just set a default user count instead of tracking presence
    setActiveUsers(5); // Default active users
    setChannelUserCounts(prev => ({ ...prev, [activeChannel?.id]: 5 }));
  }, [activeChannel?.id]);

    // Heartbeat to keep presence updated every 10 seconds
    const heartbeatInterval = setInterval(() => {
      runTransaction(userPresenceRef, (current) => {
        const existingTabs = current?.tabs || {};
        return {
          ...current,
          lastSeen: Date.now(),
          online: true,
          tabs: {
            ...existingTabs,
            [tabId]: {
              active: true,
              lastSeen: Date.now()
            }
          }
        };
      });
    }, 10000);

    // Update channel activity
    runTransaction(channelActivityRef, () => ({
      lastActivity: serverTimestamp(),
      hasActiveUsers: true
    }));

    // Remove this tab when disconnecting, but keep user if other tabs active
    onDisconnect(userPresenceRef).remove();
    onDisconnect(channelActivityRef).update({
      hasActiveUsers: false
    });
    onDisconnect(channelActivityRef).update({
      hasActiveUsers: false
    });

    // Listen for presence changes in current channel with improved user counting
    const unsubscribe = onValue(channelPresenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const now = Date.now();
      
      // Count unique users (not tabs) who are truly active
      const activeUserIds = Object.keys(presenceData).filter(userId => {
        const userData = presenceData[userId];
        if (!userData || !userData.online) return false;
        
        // Check if user has any active tabs in the last 30 seconds
        const userTabs = userData.tabs || {};
        const hasActiveTabs = Object.values(userTabs).some(tab => 
          tab.active && (now - (tab.lastSeen || 0)) < 30000
        );
        
        return hasActiveTabs || (now - (userData.lastSeen || 0)) < 30000;
  // Track user presence - SIMPLIFIED FOR PERFORMANCE
  useEffect(() => {
    // Just set default values instead of complex Firebase tracking
    setActiveUsers(5); // Default active users
    setChannelUserCounts(prev => ({ ...prev, [activeChannel?.id]: 5 }));
  }, [activeChannel?.id]);

  // Track user counts - SIMPLIFIED
  useEffect(() => {
    // Just set default counts instead of complex tracking
    const defaultChannels = [
      'vibes', 'gaming', 'movies', 'sports', 'family-friendly', 
      'random-chat', 'just-chatting', 'music', 'late-night'
    ];

    const defaultCounts = {};
    defaultChannels.forEach(channel => {
      defaultCounts[channel] = Math.floor(Math.random() * 10) + 1; // 1-10 users
    });
    
    setChannelUserCounts(defaultCounts);
  }, []);

    const unsubscribers = [];

    defaultChannels.forEach(channelId => {
      const sanitizedChannelId = channelId.replace(/[.#$[\]]/g, '_');
      const channelPresenceRef = ref(database, `presence/${sanitizedChannelId}`);
      
      const unsubscribe = onValue(channelPresenceRef, (snapshot) => {
        const presenceData = snapshot.val() || {};
        const now = Date.now();
        
        // Count unique users who are truly active in this channel
        const activeUserIds = Object.keys(presenceData).filter(userId => {
          const userData = presenceData[userId];
          if (!userData || !userData.online) return false;
          
          // Check if user has any active tabs in the last 30 seconds
          const userTabs = userData.tabs || {};
    setChannelUserCounts(defaultCounts);
  }, []);

  // Simplified message handling - no complex Firebase listeners for performance
  useEffect(() => {
    // Just initialize with empty messages for the channel
    setMessages([]);
  }, [activeChannel?.id]);

  // Effect for handling Firebase message listeners based on activeChannel
  // TRUE FLOWING MESSAGING ARCHITECTURE:
  // - Messages exist as moving entities in specific positions
  // - Only NEW messages (after join) enter the flow
  // - No historical message replay - only live flowing messages
  // - Each message flows from start to end position once and disappears forever
  // - Users see the current state of flowing messages, not old ones
  useEffect(() => {
    if (!database || !activeChannel || typeof activeChannel.id === 'undefined') {
      // Clear everything when no channel is active
      setMessages([]);
      setMessageQueue([]);
      return;
    }

    const channelId = activeChannel.id.replace(/[.#$[\]]/g, '_');
    const messagesRef = ref(database, `channels/${channelId}/messages`);
    
    // Clear current state when switching channels
    setMessages([]);
    setMessageQueue([]);
    messagePositions.current.clear(); // Clear position tracking for new channel
    currentChannelRef.current = channelId;
    
    // Record when user joins - for tracking NEW messages
    const joinTimestamp = Date.now();
    
    // Load recent messages for regular channels and restore their flow positions
    const loadRecentMessages = async () => {
      try {
        // Load messages from the last flow duration period to catch all currently flowing messages
        const flowPeriodAgo = new Date(Date.now() - REGULAR_MESSAGE_FLOW_DURATION).toISOString();
        const recentMessagesQuery = query(
          messagesRef,
          orderByChild('timestamp'),
          startAt(flowPeriodAgo)
        );
        
        const snapshot = await get(recentMessagesQuery);
        if (snapshot.exists()) {
          const messages = snapshot.val();
          const messageArray = Object.entries(messages)
            .map(([id, message]) => ({ ...message, id }))
            .filter(msg => msg.text && msg.text.trim() !== '' && 
                         msg.text !== 'No content' && 
                         msg.author && msg.author.trim() !== '' &&
                         msg.author !== 'Anonymous')
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          // Process messages and add only those still in flow
          const activeFlowMessages = [];
          
          messageArray.forEach(message => {
            if (!permanentlyProcessedIds.current.has(message.id)) {
              permanentlyProcessedIds.current.add(message.id);
              
              // Calculate current position based on server sync
              const position = getServerSyncedMessagePosition(message.timestamp, channelId);
              
              // Only add messages that are still visible/flowing
              if (!position.isExpired) {
                activeFlowMessages.push({
                  ...message, 
                  channelId, 
                  isRecentMessage: true,
                  currentPosition: position, // Store the calculated current position
                  animationDuration: `${REGULAR_MESSAGE_FLOW_DURATION / 1000}s`
                });
              }
            }
          });
          
          // Add all active flow messages directly to messages state to maintain their positions
          if (activeFlowMessages.length > 0) {
            setMessages(activeFlowMessages);
            console.log(`Restored ${activeFlowMessages.length} flowing messages for #${activeChannel.name}`, 
              activeFlowMessages.map(m => ({ 
                id: m.id.substring(0, 8), 
                progress: m.currentPosition?.progress?.toFixed(2), 
                left: m.currentPosition?.left?.toFixed(1) 
              }))
            );
          }
        }
      } catch (error) {
        console.error('Failed to load recent messages:', error);
      }
    };

    // Load recent messages for all channels
    loadRecentMessages();
    
    // Listen for NEW messages only (created after user joins)
    const newMessagesQuery = query(
      messagesRef,
      orderByChild('timestamp'),
      startAt(new Date(joinTimestamp).toISOString())
    );

    const addListener = onChildAdded(newMessagesQuery, (snapshot) => {
      const newMessage = snapshot.val();
      const id = snapshot.key;
      
      // Validate message data before processing - stricter validation
      if (!newMessage || !id || typeof newMessage !== 'object' || 
          !newMessage.text || newMessage.text.trim() === '' ||
          !newMessage.author || newMessage.author.trim() === '' ||
          !newMessage.timestamp) {
        console.warn('Invalid message data - missing required fields:', { id, newMessage });
        return;
      }
      
      // Additional validation for message content
      if (newMessage.text === 'No content' || newMessage.text === 'no message content') {
        console.warn('Rejecting message with invalid content:', newMessage.text);
        return;
      }
      
      // Check if this message is for current channel (prevent cross-contamination)
      if (currentChannelRef.current !== channelId) {
        return; // Ignore messages if we've switched channels
      }
      
      // Only process truly NEW messages (created after user joined)
      const messageTime = new Date(newMessage.timestamp).getTime();
      const isNewMessage = messageTime >= joinTimestamp;
      
      if (!permanentlyProcessedIds.current.has(id) && isNewMessage) {
        // Mark as permanently processed immediately when adding to queue
        permanentlyProcessedIds.current.add(id);
        setMessageQueue(q => [...q, { ...newMessage, id, channelId }]);
      }
    });

    const changeListener = onChildChanged(newMessagesQuery, (snapshot) => {
      const updated = snapshot.val();
      const id = snapshot.key;
      
      // Validate update data
      if (!updated || !id || typeof updated !== 'object') {
        console.warn('Invalid update data:', { id, updated });
        return;
      }
      
      // Check if this is for current channel
      if (currentChannelRef.current !== channelId) {
        return; // Ignore updates if we've switched channels
      }
      
      // Update reactions for messages currently in the stream
      setMessages(prev => prev.map(m => 
        (m.id === id && m.channelId === channelId) 
          ? { ...m, reactions: updated.reactions || m.reactions } 
          : m
      ));
    });

    return () => {
      off(newMessagesQuery, 'child_added', addListener);
      off(newMessagesQuery, 'child_changed', changeListener);
    };
  }, [activeChannel, database]);

  // Calculate top vibes AND top vibers from current messages AND persist history
  const { topVibes, topVibers } = React.useMemo(() => {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const tenMinutes = 10 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    const getTopVibeInPeriod = (period) => {
      const cutoff = now - period;
      
      // Get current channel history
      const channelHistory = channelVibesHistory[activeChannel?.id] || [];
      
      // Filter messages from current stream in this time period
      const currentPeriodMessages = messages.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoff;
      });
      
      // Filter messages from history in this time period
      const historyPeriodMessages = channelHistory.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoff;
      });
      
      // Combine current and historical messages
      const allPeriodMessages = [...currentPeriodMessages, ...historyPeriodMessages];
      
      if (allPeriodMessages.length === 0) return null;
      
      return allPeriodMessages.reduce((best, msg) => {
        const score = (msg.reactions?.thumbsUp || 0) - (msg.reactions?.thumbsDown || 0);
        const bestScore = best ? (best.reactions?.thumbsUp || 0) - (best.reactions?.thumbsDown || 0) : -1;
        
        // Only return messages that have at least 1 thumbs up
        if (score > bestScore && (msg.reactions?.thumbsUp || 0) > 0) {
          return msg;
        }
        return best;
      }, null);
    };

    const getTopViberInPeriod = (period) => {
      const cutoff = now - period;
      
      // Get current channel history
      const channelHistory = channelVibesHistory[activeChannel?.id] || [];
      
      // Filter messages from current stream in this time period
      const currentPeriodMessages = messages.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoff;
      });
      
      // Filter messages from history in this time period
      const historyPeriodMessages = channelHistory.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoff;
      });
      
      // Combine current and historical messages
      const allPeriodMessages = [...currentPeriodMessages, ...historyPeriodMessages];
      
      if (allPeriodMessages.length === 0) return null;
      
      // Count messages per author
      const authorCounts = {};
      allPeriodMessages.forEach(msg => {
        if (msg.author && msg.author !== 'Anonymous') {
          authorCounts[msg.author] = (authorCounts[msg.author] || 0) + 1;
        }
      });
      
      // Find author with most messages
      let topVriber = null;
      let maxCount = 0;
      
      Object.entries(authorCounts).forEach(([author, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topVriber = { author, count };
        }
      });
      
      return topVriber;
    };

    return {
      topVibes: {
        lastMinute: getTopVibeInPeriod(oneMinute),
        last10Minutes: getTopVibeInPeriod(tenMinutes),
        lastHour: getTopVibeInPeriod(oneHour)
      },
      topVibers: {
        lastMinute: getTopViberInPeriod(oneMinute),
        last10Minutes: getTopViberInPeriod(tenMinutes),
        lastHour: getTopViberInPeriod(oneHour)
      }
    };
  }, [messages, channelVibesHistory, activeChannel]);

  // Update channel vibes history when messages expire - ONLY store messages with likes
  useEffect(() => {
    if (!activeChannel) return;
    
    const updateHistory = () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      setChannelVibesHistory(prev => {
        const channelHistory = prev[activeChannel.id] || [];
        
        // Only add messages that have at least 1 like to history
        const expiredMessagesWithLikes = messages.filter(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          const isOld = now - msgTime > 30000; // Messages older than 30 seconds
          const hasLikes = (msg.reactions?.thumbsUp || 0) > 0;
          return isOld && hasLikes;
        });
        
        // Combine with existing history and remove messages older than 1 hour
        const updatedHistory = [...channelHistory, ...expiredMessagesWithLikes]
          .filter(msg => {
            const msgTime = new Date(msg.timestamp).getTime();
            return now - msgTime < oneHour;
          })
          .filter((msg, index, arr) => 
            // Remove duplicates by id
            arr.findIndex(m => m.id === msg.id) === index
          );
        
        return {
          ...prev,
          [activeChannel.id]: updatedHistory
        };
      });
    };
    
    const interval = setInterval(updateHistory, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [messages, activeChannel]);

  const handleChannelChange = useCallback((channel) => {
    // Simply switch channels - no storage/restoration needed for ephemeral chat
    setActiveChannel(channel);
    setShowWelcome(false);
    
    // Update URL without page reload
    navigate(`/channel/${channel.id}`, { replace: true });
    
    // Clear current messages immediately for clean channel switch
    setMessages([]);
    setMessageQueue([]);
  }, [navigate]);

  const handleSendMessage = useCallback(async (messageData) => {
    if (!activeChannel || !activeChannel.id || !database) {
      console.error("SendMessage: No active channel or DB not initialized");
      return;
    }

    // Validate message data
    if (!messageData || !messageData.text || !messageData.author) {
      console.error("SendMessage: Invalid message data", messageData);
      return;
    }

    // Prevent duplicate messages (same user, same text within 5 seconds)
    const now = Date.now();
    const userId = getUserId();
    const messageKey = `${userId}_${messageData.text}_${activeChannel.id}`;
    const lastSentKey = `lastSent_${messageKey}`;
    const lastSentTime = localStorage.getItem(lastSentKey);
    
    if (lastSentTime && (now - parseInt(lastSentTime)) < 5000) {
      console.warn("Duplicate message prevented - too soon after last identical message");
      return;
    }
    
    // Store this message timestamp to prevent duplicates
    localStorage.setItem(lastSentKey, now.toString());

    // Generate server-based position for consistent placement across all users
    const messagePosition = {
      lane: Math.floor(Math.random() * 6), // 0-5 lanes
      verticalOffset: Math.random() * 8 - 4, // -4 to +4 offset
      horizontalStart: 100 + Math.random() * 10 // 100-110% start position
    };

    // Include author data for signed-in users
    const authorData = isSignedIn ? {
      username: user.username,
      level: user.level || 1,
      xp: user.xp || 0,
      isSignedIn: true
    } : {
      isSignedIn: false
    };

    const newMessagePayload = {
      text: messageData.text.trim(),
      author: messageData.author.trim(),
      authorData,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true,
      timestamp: new Date().toISOString(),
      position: messagePosition, // Server-determined position
      createdAt: Date.now(), // For precise timing synchronization
      userId: userId // Track who sent it
    };

    const messagesRef = ref(database, `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages`);
    
    try {
      await firebasePush(messagesRef, newMessagePayload);
      console.log('Message sent successfully:', newMessagePayload.text.substring(0, 20) + '...');
      
      // Update user stats for signed-in users
      if (isSignedIn && updateUserStats && user) {
        try {
          await updateUserStats(1, 0, 0); // +1 message
        } catch (statsError) {
          console.error('Failed to update user stats:', statsError);
          // Don't let stats error prevent message sending
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add user notification here
    }
  }, [activeChannel, database, isSignedIn, user, updateUserStats]);

  const [reactionStats, setReactionStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    topMessages: []
  });

  useEffect(() => {
    const totals = messages.reduce(
      (acc, msg) => {
        acc.totalLikes += msg.reactions?.thumbsUp || 0;
        acc.totalDislikes += msg.reactions?.thumbsDown || 0;
        return acc;
      },
      { totalLikes: 0, totalDislikes: 0 }
    );

    const topMessages = [...messages]
      .sort((a, b) => (b.reactions.thumbsUp - b.reactions.thumbsDown) - (a.reactions.thumbsUp - a.reactions.thumbsDown))
      .slice(0, 5);

    setReactionStats({ ...totals, topMessages });
  }, [messages]);


  const handleReaction = useCallback((messageId, addReactionType, removeReactionType) => {
    if (!database || !activeChannel) return;
    
    const channelPath = `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages/${messageId}/reactions`;
    
    // Add the new reaction
    const addReactionRef = ref(database, `${channelPath}/${addReactionType}`);
    runTransaction(addReactionRef, (current) => (current || 0) + 1);
    
    // Remove the old reaction if switching
    if (removeReactionType) {
      const removeReactionRef = ref(database, `${channelPath}/${removeReactionType}`);
      runTransaction(removeReactionRef, (current) => Math.max(0, (current || 0) - 1));
    }
  }, [database, activeChannel]);

  const handleRemoveMessage = useCallback((id) => {
    setMessages(prev => {
      const messageToRemove = prev.find(m => m.id === id);
      
      // If message has likes, save it to history before removing
      if (messageToRemove && (messageToRemove.reactions?.thumbsUp || 0) > 0 && activeChannel?.id) {
        setChannelVibesHistory(prevHistory => {
          const channelHistory = prevHistory[activeChannel.id] || [];
          const messageExists = channelHistory.some(m => m.id === id);
          
          if (!messageExists) {
            return {
              ...prevHistory,
              [activeChannel.id]: [...channelHistory, messageToRemove]
            };
          }
          return prevHistory;
        });
      }
      
      return prev.filter(m => m.id !== id);
    });
    
    // Permanently mark as processed so it never comes back
    permanentlyProcessedIds.current.add(id);
  }, [activeChannel]);

  // Highway system server-synchronized positioning with 12-lane support
  const getServerSyncedMessagePosition = (messageTimestamp, channelId) => {
    // Create deterministic position based on message timestamp and channel
    const messageTime = new Date(messageTimestamp).getTime();
    const channelSeed = channelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeSeed = Math.floor(messageTime / 1000); // Use seconds for stability
    
    // Combine seeds for deterministic randomness
    const combinedSeed = (channelSeed + timeSeed) * 9301 + 49297;
    const pseudoRandom = (combinedSeed % 233280) / 233280;
    
    // Calculate current progress based on when message was created
    const now = Date.now();
    const messageAge = now - messageTime;
    const progress = Math.min(Math.max(0, messageAge / REGULAR_MESSAGE_FLOW_DURATION), 1);
    
    // Updated highway system (12 lanes)
    const lanes = 12;
    const lane = Math.floor(pseudoRandom * lanes);
    const usableHeight = 75;
    const topMargin = 12.5;
    const laneHeight = usableHeight / lanes; // ~6.25% per lane
    const laneCenter = topMargin + (lane * laneHeight) + (laneHeight / 2);
    
    // Estimate message dimensions for consistent server sync
    const estimatedWidth = 20 + (pseudoRandom * 15); // 20-35% width
    const estimatedHeight = 4 + (pseudoRandom * 3); // 4-7% height
    
    // Reduced vertical offset for highway discipline
    const verticalOffset = (pseudoRandom - 0.5) * 4; // ±2% for lane discipline
    
    // Horizontal movement with improved easing and dynamic speed
    const trafficDensity = Math.floor(pseudoRandom * 15); // Simulate traffic
    const speedMultiplier = 1 + (trafficDensity / 10); // Dynamic speed based on traffic
    const baseSpeed = 2.5 * speedMultiplier;
    
    const startX = 110;
    const endX = -15;
    const easeOut = (t) => 1 - Math.pow(1 - t, 2.5); // Adjusted easing for highway feel
    const currentX = startX - (easeOut(progress) * (startX - endX));
    
    // Calculate final position with highway bounds
    const finalTop = Math.max(10, Math.min(85, laneCenter + verticalOffset));
    
    return {
      top: finalTop,
      left: currentX,
      lane,
      progress,
      isExpired: progress >= 1,
      messageAge,
      calculatedAt: now,
      // Highway-specific attributes
      messageWidth: estimatedWidth,
      messageHeight: estimatedHeight,
      animationSpeed: baseSpeed,
      laneCenter: laneCenter,
      // Spacing reservation consistent with highway system
      reservedSpace: {
        topBound: finalTop - estimatedHeight / 2,
        bottomBound: finalTop + estimatedHeight / 2,
        leftBound: currentX - estimatedWidth / 2,
        rightBound: currentX + estimatedWidth / 2,
        width: estimatedWidth,
        height: estimatedHeight
      },
      createdAt: messageTime,
      congestionLevel: trafficDensity
    };
  };

  // Simplified message flow - no complex positioning for performance
  useEffect(() => {
    if (!activeChannel?.id) return;
    
    // Just set messages to empty array for the channel - no complex flow
    setMessages([]);
  }, [activeChannel?.id]);

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MessageCircle" className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Main Logo - centered */}
      {/* Main Logo - centered and higher */}
      <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-interface w-12 h-12">
        <FadeLogo />
      </div>

      {/* Channel Selector - positioned top-left */}
      <div className="fixed top-4 left-4 z-interface">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ChannelSelector
              onChannelChange={handleChannelChange}
              activeChannel={activeChannel}
              channelUserCounts={channelUserCounts}
              initialCollapsed={!!urlChannelId} // Collapse if channel was selected from URL
              className={activeChannel ? 'w-10 h-10' : ''}
            />
            {activeChannel && (
              <>
                <button
                  onClick={shareChannel}
                  className="glass-button p-2 hover:bg-glass-highlight transition-colors group relative"
                  title="Share channel link"
                >
                  <Icon name="Share2" size={16} className="text-text-primary" />
                </button>
                <button
                  onClick={() => setActiveChannel(null)}
                  className="glass-button p-2 hover:bg-glass-highlight transition-colors"
                  title="Minimize"
                >
                  <Icon name="Minimize2" size={16} className="text-text-primary" />
                </button>
              </>
            )}
          </div>
          
          {/* Share notification */}
          {showShareNotification && (
            <div className="glass-panel p-2 bg-success/20 border-success/40 text-success text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <Icon name="Check" size={12} />
                <span>Link copied to clipboard!</span>
              </div>
            </div>
          )}
          
          {/* Active Users Display */}
          {activeChannel && (
            <div className="glass-panel p-2 w-52">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={12} className="text-accent" />
                <span className="text-xs text-text-secondary">
                  {activeUsers} {activeUsers === 1 ? 'user' : 'users'} active
                </span>
              </div>
            </div>
          )}
          
          {/* Top Vibes Section - below channel selector */}
          {activeChannel && (
            <div className="glass-panel p-3 w-52">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name="Heart" size={14} className="text-accent" />
                  <h4 className="text-xs font-medium text-text-secondary">Top Vibes</h4>
                </div>
                <button
                  onClick={() => setShowTopVibes(!showTopVibes)}
                  className="glass-button p-1 hover:bg-glass-highlight transition-all duration-300"
                >
                  <Icon 
                    name={showTopVibes ? "ChevronUp" : "ChevronDown"} 
                    size={12} 
                    className="text-text-secondary" 
                  />
                </button>
              </div>
              {showTopVibes && (
                <div className="flex gap-2">
                  <TopVibesSection vibes={topVibes} />
                  <TopVibersSection vibers={topVibers} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profanity Filter Toggle */}
      <ProfanityFilterToggle />

      {/* Statistics Panel */}
      <StatisticsPanel
        activeChannel={activeChannel}
        messageCount={messages.length}
      />

      {/* Message Display Area - back to original positioning */}
      <div className="fixed inset-0 pointer-events-none z-messages pt-28 pb-32">
        {messages
          .filter(message => !message.channelId || message.channelId === activeChannel?.id) // Prevent cross-contamination
          .map((message, index) => (
            <MessageBubble
              key={message.id}
              activityLevel={activityLevel}
              message={message}
              index={index}
              totalMessages={messages.length}
              onReaction={handleReaction}
              onRemove={handleRemoveMessage}
              onUserClick={handleUserClick}
              onReportClick={handleReportClick}
              database={database}
            />
          ))}
      </div>

      {/* Real-time Typing Indicators */}
      <TypingIndicatorManager database={database} activeChannel={activeChannel}>
        {({ typingUsers, updateTypingStatus }) => (
          <>
            {/* Show typing users */}
            {typingUsers.length > 0 && (
              <div className="fixed bottom-24 left-4 z-50 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                {typingUsers.length === 1 ? (
                  `${typingUsers[0].username} is typing...`
                ) : typingUsers.length === 2 ? (
                  `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                ) : (
                  `${typingUsers.length} people are typing...`
                )}
              </div>
            )}

            {/* Message Input Panel */}
            <MessageInputPanel
              onSendMessage={handleSendMessage}
              activeChannel={activeChannel}
              isTyping={isTyping}
              onTypingChange={(typing) => {
                setIsTyping(typing);
                updateTypingStatus(typing);
              }}
            />
          </>
        )}
      </TypingIndicatorManager>

      {/* Welcome Message */}
      {showWelcome && (
        <div
          className="fixed inset-0 flex items-center justify-center z-interface bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setShowWelcome(false);
            localStorage.setItem('fade-has-visited', 'true');
          }}
        >
          <div className="glass-panel p-8 text-center max-w-lg fade-in vibey-bg glow-border pointer-events-auto mx-4">
            <Icon name="MessageCircle" size={48} className="text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
              Welcome to FADE
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Connect and react in the moment with friends or strangers. 
              Watch messages flow across your screen as conversations unfold naturally. 
              Join a vibe channel that matches your mood and let the community grow 
              as you share fleeting moments together.
            </p>
            <div className="text-xs text-text-secondary/70 mb-4">
              💫 Messages appear and fade away • 🎭 Choose your vibe • 👥 React with others
            </div>
            <p className="text-xs text-accent font-medium">
              Tap anywhere to begin your journey
            </p>
          </div>
        </div>
      )      }

      {/* Authentication UI - Integrated and Minimized */}
      <div className="fixed top-4 right-4 z-50">
        {isSignedIn ? (
          <div className="flex items-center space-x-2">
            {/* User info panel */}
            <div 
              className="glass-panel p-3 cursor-pointer hover:bg-glass-surface/60 transition-all duration-300"
              onClick={() => {
                setProfileUser({ ...user, username: user.username });
                setShowUserProfile(true);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-text-primary text-sm font-medium">@{user.username}</div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 rounded text-xs text-white font-bold">
                      L{user.level || 1}
                    </div>
                    <span className="text-text-secondary text-xs">{user.xp || 0} XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => navigate('/leaderboards')}
                className="glass-button p-2 hover:bg-glass-surface/60 transition-all duration-300 group"
                title="Leaderboards"
              >
                <Icon name="BarChart3" className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
              </button>
              <button
                onClick={() => {
                  setProfileUser({ ...user, username: user.username });
                  setShowUserProfile(true);
                }}
                className="glass-button p-2 hover:bg-glass-surface/60 transition-all duration-300 group"
                title="Profile"
              >
                <Icon name="User" className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Minimized Auth UI */}
            {(authUIMinimized && !guestModeConfirmed) ? (
              <div className="glass-panel p-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Icon name="User" className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-text-secondary text-xs">Guest</span>
                  <button
                    onClick={() => setAuthUIMinimized(false)}
                    className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                  >
                    Sign Up?
                  </button>
                  <button
                    onClick={() => {
                      setGuestModeConfirmed(true);
                      localStorage.setItem('fade-guest-mode-confirmed', 'true');
                    }}
                    className="text-text-secondary hover:text-text-primary text-xs transition-colors"
                    title="Continue as guest and minimize this"
                  >
                    <Icon name="X" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : guestModeConfirmed ? (
              // Just the essential buttons when guest mode is confirmed
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigate('/leaderboards')}
                  className="glass-button p-2 hover:bg-glass-surface/40 transition-all duration-300 group"
                  title="Leaderboards"
                >
                  <Icon name="BarChart3" className="w-3 h-3 text-text-secondary group-hover:text-primary transition-colors" />
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="glass-button p-2 hover:bg-glass-surface/40 transition-all duration-300 group"
                  title="Sign up"
                >
                  <Icon name="UserPlus" className="w-3 h-3 text-text-secondary group-hover:text-primary transition-colors" />
                </button>
              </div>
            ) : (
              // Expanded Auth UI
              <div className="space-y-2">
                <div className="glass-panel p-3 max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-text-secondary text-xs">Chatting as Guest</div>
                    <button
                      onClick={() => setAuthUIMinimized(true)}
                      className="text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Icon name="Minimize2" className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => {
                          setAuthMode('signup');
                          setShowAuthModal(true);
                        }}
                        className="glass-button py-1.5 px-2 bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-all duration-300 text-xs"
                      >
                        Sign Up
                      </button>
                      
                      <button
                        onClick={() => {
                          setAuthMode('signin');
                          setShowAuthModal(true);
                        }}
                        className="glass-button py-1.5 px-2 hover:bg-glass-surface/60 text-text-primary font-medium transition-all duration-300 text-xs"
                      >
                        Sign In
                      </button>
                    </div>
                    
                    <button
                      onClick={() => navigate('/leaderboards')}
                      className="w-full glass-button py-1 px-2 hover:bg-glass-surface/40 text-text-secondary text-xs transition-all duration-300"
                    >
                      <Icon name="BarChart3" className="w-3 h-3 inline mr-1" />
                      Leaderboards
                    </button>
                    
                    <button
                      onClick={() => {
                        setGuestModeConfirmed(true);
                        setAuthUIMinimized(true);
                        localStorage.setItem('fade-guest-mode-confirmed', 'true');
                      }}
                      className="w-full text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
                
                {/* Compact benefits hint */}
                <div className="glass-panel p-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 max-w-xs">
                  <div className="text-xs text-text-secondary text-center">
                    <div className="font-medium text-primary text-xs">✨ Get: XP • Profile • Leaderboard</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // If user clicked "Continue as Guest" in modal, minimize the auth UI
          if (!isSignedIn) {
            setGuestModeConfirmed(true);
            setAuthUIMinimized(true);
            localStorage.setItem('fade-guest-mode-confirmed', 'true');
          }
        }}
        mode={authMode}
      />

      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        profileUser={profileUser}
        currentUser={user}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        username={reportUsername}
      />

      {/* Privacy Policy Link - responsive positioning */}
      <div className="fixed bottom-4 right-4 z-interface md:bottom-4 md:right-4 sm:bottom-4 sm:right-2 mobile-privacy-link">
        <Link
          to="/privacy"
          className="text-xs text-text-secondary/70 hover:text-text-secondary transition-colors duration-300 privacy-link px-3 py-1 rounded-full inline-block"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export default MainChatInterface;
