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
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, onChildChanged, off, push as firebasePush, runTransaction, onValue, serverTimestamp, onDisconnect, query, orderByChild, startAt, get } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';
import { getUserId } from '../../utils/userIdentity';
import { isMobile, isSmallScreen, isExtraSmallScreen, addTouchFriendlyClasses, preventZoom } from '../../utils/mobileUtils';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import { TopVibesSection, TopVibersSection } from 'components/ui/TopVibesSection';
import ProfanityFilterToggle from 'components/ui/ProfanityFilterToggle';

// Firebase configuration - moved outside component to prevent recreation
const firebaseConfig = {
  apiKey: "AIzaSyAX1yMBRCUxfsArQWG5XzN4mx-sk4hgqu0",
  authDomain: "vibrant-bubble-chat.firebaseapp.com",
  databaseURL: "https://vibrant-bubble-chat-default-rtdb.firebaseio.com",
  projectId: "vibrant-bubble-chat",
  storageBucket: "vibrant-bubble-chat.appspot.com",
  messagingSenderId: "1084858947817",
  appId: "1:1084858947817:web:bc63c68c7192a742713878"
};

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
  const REGULAR_MESSAGE_FLOW_DURATION = 25000; // 25 seconds for regular messages
  const activityTimeWindow = 30 * 1000; // 30 seconds
  const currentUserId = useRef(getUserId());
  const presenceRef = useRef(null);
  const currentChannelRef = useRef(null); // Track current channel for cleanup

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
  }, []);

  // Share channel functionality
  const shareChannel = async () => {
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
  };

  const [showShareNotification, setShowShareNotification] = useState(false);
  
  const handleShareNotification = () => {
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2000);
  };

  // Highway lane system with dynamic sizing and collision avoidance
  const findAvailablePosition = useCallback((messageId, messageText = '', preferredLane = null) => {
    const lanes = 12; // Increased to 12 lanes for better separation like highway lanes
    const usableHeight = 75; // Use 75% of screen height (10% top margin, 15% bottom margin)
    const topMargin = 12.5; // Start lanes at 12.5% from top
    const laneHeight = usableHeight / lanes; // ~6.25% per lane
    
    // Calculate message dimensions based on content
    const estimatedCharWidth = 0.6; // Approximate character width in viewport percentage
    const messageLength = messageText.length || 50; // Default estimate
    const messageWidth = Math.min(Math.max(messageLength * estimatedCharWidth, 15), 35); // 15-35% width
    const messageHeight = Math.ceil(messageLength / 60) * 3 + 2; // Multi-line height estimation
    
    // Dynamic spacing based on message size and traffic density
    const baseVerticalSpacing = Math.max(8, messageHeight + 2); // Minimum 8% or message height + 2%
    const baseHorizontalSpacing = Math.max(20, messageWidth + 5); // Minimum 20% or message width + 5%
    
    // Get current active positions with size information
    const activePositions = Array.from(messagePositions.current.values())
      .filter(pos => pos.left > -20) // Consider messages still approaching screen
      .map(pos => {
        const speed = pos.animationSpeed || 2;
        const projectedLeft = pos.left - (speed * 3); // Project 3 seconds ahead
        return {
          ...pos,
          projectedLeft,
          messageWidth: pos.messageWidth || 25, // Default width
          messageHeight: pos.messageHeight || 5, // Default height
          // Calculate collision bounds
          topBound: pos.top - (pos.messageHeight || 5) / 2,
          bottomBound: pos.top + (pos.messageHeight || 5) / 2,
          leftBound: Math.min(pos.left, projectedLeft) - (pos.messageWidth || 25) / 2,
          rightBound: Math.max(pos.left, projectedLeft) + (pos.messageWidth || 25) / 2
        };
      });
    
    // Traffic density analysis for speed adjustment
    const trafficDensity = activePositions.length;
    const congestionMultiplier = Math.min(1 + (trafficDensity / 8), 2.5); // Up to 2.5x speed increase
    
    // Try lanes systematically, starting with preferred lane
    const lanesToTry = preferredLane !== null 
      ? [preferredLane, ...Array.from({length: lanes}, (_, i) => i).filter(i => i !== preferredLane)]
      : Array.from({length: lanes}, (_, i) => i);
    
    for (const laneIndex of lanesToTry) {
      const laneCenter = topMargin + (laneIndex * laneHeight) + (laneHeight / 2);
      
      // Try multiple positions within each lane
      const lanePositions = [
        laneCenter, // Center of lane
        laneCenter - laneHeight * 0.25, // Upper quarter
        laneCenter + laneHeight * 0.25, // Lower quarter
        laneCenter - laneHeight * 0.4, // Near top
        laneCenter + laneHeight * 0.4, // Near bottom
      ];
      
      for (const candidateTop of lanePositions) {
        // Ensure position is within safe driving bounds
        if (candidateTop < 10 || candidateTop > 85) continue;
        
        // Calculate collision bounds for this candidate position
        const candidateTopBound = candidateTop - messageHeight / 2;
        const candidateBottomBound = candidateTop + messageHeight / 2;
        const candidateLeftBound = 105; // Start position
        const candidateRightBound = candidateLeftBound + messageWidth;
        
        // Check for highway collisions with all active traffic
        const wouldCollide = activePositions.some(traffic => {
          // Vertical overlap check
          const verticalOverlap = !(candidateBottomBound < traffic.topBound || 
                                   candidateTopBound > traffic.bottomBound);
          
          // Horizontal overlap check (considering movement)
          const horizontalOverlap = !(candidateRightBound < traffic.leftBound || 
                                     candidateLeftBound > traffic.rightBound);
          
          // Lane sharing check - allow multiple messages in same lane if well spaced
          const sameLane = Math.abs(traffic.top - candidateTop) < laneHeight;
          const tooCloseHorizontally = Math.abs(traffic.left - candidateLeftBound) < baseHorizontalSpacing;
          
          return (verticalOverlap && horizontalOverlap) || (sameLane && tooCloseHorizontally);
        });
        
        if (!wouldCollide) {
          // Found a clear lane position
          const finalTop = Math.max(10, Math.min(85, candidateTop));
          const startPosition = 105 + Math.random() * 5; // 105-110% start with slight randomization
          const animationSpeed = (2 + Math.random() * 0.5) * congestionMultiplier; // Dynamic speed
          
          const position = {
            lane: laneIndex,
            top: finalTop,
            left: startPosition,
            horizontalStart: startPosition,
            animationSpeed,
            messageWidth,
            messageHeight,
            createdAt: Date.now(),
            congestionLevel: trafficDensity,
            // Reserved space for this message
            reservedSpace: {
              topBound: finalTop - messageHeight / 2,
              bottomBound: finalTop + messageHeight / 2,
              leftBound: startPosition,
              rightBound: -15, // End position
              width: messageWidth,
              height: messageHeight
            }
          };
          
          // Register this position in traffic control
          messagePositions.current.set(messageId, position);
          
          console.log(`Lane assigned: ${laneIndex}, Speed: ${animationSpeed.toFixed(1)}x, Traffic: ${trafficDensity}`);
          return position;
        }
      }
    }
    
    // Traffic jam - use emergency overflow lane with delay
    const emergencyDelay = trafficDensity * 1.5; // 1.5 second delay per existing message
    const emergencyLane = Math.floor(Math.random() * lanes);
    const emergencyTop = topMargin + (emergencyLane * laneHeight) + (laneHeight / 2);
    const emergencySpeed = 3 * congestionMultiplier; // Faster to catch up
    
    const emergencyPosition = {
      lane: emergencyLane,
      top: Math.max(10, Math.min(85, emergencyTop)),
      left: 115 + emergencyDelay * 8, // Delayed start position
      horizontalStart: 115 + emergencyDelay * 8,
      animationSpeed: emergencySpeed,
      messageWidth,
      messageHeight,
      createdAt: Date.now(),
      congestionLevel: trafficDensity,
      isEmergencyLane: true,
      reservedSpace: {
        topBound: emergencyTop - messageHeight / 2,
        bottomBound: emergencyTop + messageHeight / 2,
        leftBound: 115 + emergencyDelay * 8,
        rightBound: -15,
        width: messageWidth,
        height: messageHeight
      }
    };
    
    messagePositions.current.set(messageId, emergencyPosition);
    console.log(`Emergency lane used: ${emergencyLane}, Delay: ${emergencyDelay}s, Speed: ${emergencySpeed.toFixed(1)}x`);
    return emergencyPosition;
  }, []);

  // Enhanced position cleanup with reservation management
  const removeMessagePosition = useCallback((messageId) => {
    const position = messagePositions.current.get(messageId);
    if (position) {
      // Clear the position reservation
      messagePositions.current.delete(messageId);
      
      // Optional: Log position cleanup for debugging
      console.log(`Position freed for message ${messageId.substring(0, 8)}: lane ${position.lane}`);
    }
  }, []);

  // Periodic cleanup of stale position reservations
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 1 minute
      
      // Remove position reservations for messages that are too old
      Array.from(messagePositions.current.entries()).forEach(([messageId, position]) => {
        if (position.createdAt && (now - position.createdAt) > staleThreshold) {
          messagePositions.current.delete(messageId);
        }
      });
    }, 30000); // Clean up every 30 seconds
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Enhanced position update with collision avoidance during animation
  const updateMessagePosition = useCallback((messageId, newLeft) => {
    const position = messagePositions.current.get(messageId);
    if (!position) return;
    
    // Update position and check for any real-time collisions
    const updatedPosition = { ...position, left: newLeft };
    
    // Check if this update would cause collision with other messages
    const otherPositions = Array.from(messagePositions.current.entries())
      .filter(([id, _]) => id !== messageId)
      .map(([_, pos]) => pos);
    
    const wouldCollide = otherPositions.some(otherPos => {
      const verticalDistance = Math.abs(otherPos.top - updatedPosition.top);
      const horizontalDistance = Math.abs(otherPos.left - newLeft);
      return verticalDistance < 12 && horizontalDistance < 20; // Collision threshold
    });
    
    if (!wouldCollide) {
      messagePositions.current.set(messageId, updatedPosition);
    } else {
      // If collision detected, slightly adjust vertical position
      const adjustment = (Math.random() - 0.5) * 6; // ±3% adjustment
      const adjustedPosition = {
        ...updatedPosition,
        top: Math.max(10, Math.min(85, updatedPosition.top + adjustment))
      };
      messagePositions.current.set(messageId, adjustedPosition);
    }
  }, []);

  // Process messages from queue with enhanced spacing control
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processQueue = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...rest] = prev;

        setMessages(msgs => {
          const exists = msgs.some(m => m.id === next.id);
          if (!exists && next && next.id && typeof next === 'object') {
            
            // Enhanced spacing based on current message density
            const activeMessageCount = msgs.length;
            const congestionLevel = Math.min(activeMessageCount / 12, 1); // 0-1 based on active messages
            
            // Adaptive duration based on congestion and activity
            const baseMinDuration = 18; // Slightly increased for better spacing
            const baseMaxDuration = 50; // Increased max for sparse periods
            
            // More aggressive speed adjustment for congestion control
            const minDuration = baseMinDuration * (1 - congestionLevel * 0.4); // Up to 40% faster
            const maxDuration = baseMaxDuration * (1 + congestionLevel * 0.3); // Up to 30% slower
            
            const duration = maxDuration - ((activityLevel - 1) / 4) * (maxDuration - minDuration);
            
            // Find optimal position with enhanced collision detection
            const position = findAvailablePosition(next.id, next.preferredLane);
            
            // Enhanced message validation and properties
            const validatedMessage = {
              id: next.id,
              text: next.text || 'No content',
              author: next.author || 'Anonymous',
              timestamp: next.timestamp || new Date().toISOString(),
              reactions: next.reactions || { thumbsUp: 0, thumbsDown: 0 },
              isUserMessage: next.isUserMessage || false,
              userId: next.userId || null,
              animationDuration: `${duration}s`,
              channelId: activeChannel?.id,
              position: position,
              onPositionUpdate: updateMessagePosition,
              onRemove: removeMessagePosition,
              spacingPriority: position.isDelayed ? 'low' : 'normal', // Priority for spacing
              reservedSpace: position.reservedSpace // Reserved collision area
            };
            
            msgs = [...msgs, validatedMessage];
            setMessageTimestamps(t => [...t, Date.now()]);
          }
          return msgs;
        });

        return rest;
      });
    };

    // Enhanced queue processing with intelligent spacing intervals
    const queueLength = messageQueue.length;
    const currentMessageCount = messages.length;
    
    // Base interval adjusted for both queue length and active message density
    const baseInterval = 150; // Slightly increased base for better spacing
    const congestionMultiplier = Math.max(0.3, 1 - (currentMessageCount / 15)); // Slow down when congested
    const queueMultiplier = Math.max(0.4, 1 - (queueLength / 8)); // Speed up when queue is long
    
    const processInterval = Math.floor(baseInterval * congestionMultiplier * queueMultiplier);
    
    const interval = setInterval(processQueue, Math.max(50, processInterval)); // Minimum 50ms
    return () => clearInterval(interval);
  }, [messageQueue.length, messages.length, activityLevel, activeChannel?.id, findAvailablePosition, updateMessagePosition, removeMessagePosition]);

  // Update activity level calculation based on channel message flow
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recentTimestamps = messageTimestamps.filter(timestamp => now - timestamp < activityTimeWindow);
      const messageRate = recentTimestamps.length;
      
      // Map message rate to activity level based on channel activity (1-5)
      let newActivityLevel = 1;
      if (messageRate > 15) newActivityLevel = 5; // Very active
      else if (messageRate > 10) newActivityLevel = 4; // Active
      else if (messageRate > 5) newActivityLevel = 3; // Moderate
      else if (messageRate > 2) newActivityLevel = 2; // Low activity
      
      setActivityLevel(newActivityLevel);
      
      // Update message speeds based on channel activity level with slower base speeds
      const minDuration = 15; // Minimum duration in seconds (high activity)
      const maxDuration = 45; // Maximum duration in seconds (low activity)
      const duration = maxDuration - ((newActivityLevel - 1) / 4) * (maxDuration - minDuration);
      
      // Only update if activity level actually changed to prevent unnecessary re-renders
      if (newActivityLevel !== activityLevel) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          animationDuration: `${duration}s`
        })));
      }
    }, 2000); // Check every 2 seconds for smoother updates

    return () => clearInterval(interval);
  }, [messageTimestamps, activityTimeWindow, activityLevel]);

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
        
        return newMessages;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [removeMessagePosition]);

  // Initialize Firebase (only once)
  // Initialize Firebase app
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [database, setDatabase] = useState(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    setFirebaseApp(app);
    setDatabase(getDatabase(app));
  }, []); // Empty dependency array - only initialize once

  // Track user presence for accurate active user count and channel activity detection
  useEffect(() => {
    if (!database || !activeChannel) return;

    const channelId = activeChannel.id.replace(/[.#$[\]]/g, '_');
    const userPresenceRef = ref(database, `presence/${channelId}/${currentUserId.current}`);
    const channelPresenceRef = ref(database, `presence/${channelId}`);
    const channelActivityRef = ref(database, `activity/${channelId}`);
    
    // Track this specific tab/session
    const tabId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Set user as online in current channel with tab tracking
    runTransaction(userPresenceRef, (current) => {
      const existingTabs = current?.tabs || {};
      return {
        online: true,
        lastSeen: Date.now(),
        channel: channelId,
        tabs: {
          ...existingTabs,
          [tabId]: {
            active: true,
            lastSeen: Date.now()
          }
        }
      };
    });

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
      });
      
      setActiveUsers(Math.max(1, activeUserIds.length));
    });

    // Store reference for cleanup
    presenceRef.current = userPresenceRef;

    return () => {
      unsubscribe();
      clearInterval(heartbeatInterval);
      
      // Simple cleanup - remove user presence on unmount
      runTransaction(userPresenceRef, () => null);
    };
  }, [database, activeChannel]);

  // Track user counts across all channels for sorting
  useEffect(() => {
    if (!database) return;

    const defaultChannels = [
      'vibes', 'gaming', 'movies', 'sports', 'family-friendly', 
      'random-chat', 'just-chatting', 'music', 'late-night'
    ];

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
          const hasActiveTabs = Object.values(userTabs).some(tab => 
            tab.active && (now - (tab.lastSeen || 0)) < 30000
          );
          
          return hasActiveTabs || (now - (userData.lastSeen || 0)) < 30000;
        });
        
        setChannelUserCounts(prev => ({
          ...prev,
          [channelId]: activeUserIds.length
        }));
      });
      
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [database]);

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

  const handleSendMessage = useCallback((messageData) => {
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

    const newMessagePayload = {
      text: messageData.text.trim(),
      author: messageData.author.trim(),
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true,
      timestamp: new Date().toISOString(),
      position: messagePosition, // Server-determined position
      createdAt: Date.now(), // For precise timing synchronization
      userId: userId // Track who sent it
    };

    const messagesRef = ref(database, `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages`);
    
    try {
      firebasePush(messagesRef, newMessagePayload);
      console.log('Message sent successfully:', newMessagePayload.text.substring(0, 20) + '...');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add user notification here
    }
  }, [activeChannel, database]);

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

  // Enhanced server-synchronized positioning with improved collision avoidance
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
    
    // Updated to match new lane system (8 lanes instead of 6)
    const lanes = 8;
    const lane = Math.floor(pseudoRandom * lanes);
    const laneHeight = 70 / lanes; // ~8.75% per lane
    const baseTop = 15 + (lane * laneHeight); // Start at 15% like in findAvailablePosition
    
    // Reduced vertical offset for better consistency
    const verticalOffset = (pseudoRandom - 0.5) * 6; // ±3% instead of ±4%
    
    // Horizontal movement with improved easing
    const startX = 110;
    const endX = -15; // Match the new system
    const easeOut = (t) => 1 - Math.pow(1 - t, 3); // Smooth ease out
    const currentX = startX - (easeOut(progress) * (startX - endX));
    
    // Calculate final position with better bounds
    const finalTop = Math.max(10, Math.min(85, baseTop + verticalOffset));
    
    return {
      top: finalTop,
      left: currentX,
      lane,
      progress,
      isExpired: progress >= 1,
      messageAge,
      calculatedAt: now,
      // Add spacing reservation for consistency with new system
      reservedSpace: {
        topBound: finalTop - 7.5, // Half of minimum spacing
        bottomBound: finalTop + 7.5,
        leftBound: currentX,
        rightBound: endX
      },
      animationSpeed: 2.5, // Standard speed
      createdAt: messageTime
    };
  };

  // Regular channel persistent message flow - continues after refresh
  useEffect(() => {
    if (!activeChannel?.id) {
      return;
    }

    let isActive = true;
    
    const updateRegularFlow = () => {
      if (!isActive) return;
      
      // Use the current messages state directly without dependencies to avoid interference
      setMessages(prevMessages => {
        const flowMessages = [];
        
        // Process all current messages for position updates
        prevMessages.forEach(message => {
          if (message.channelId === activeChannel.id && 
              message.text && 
              message.author &&
              message.timestamp) {
            
            // Use stored current position if available (for restored messages), otherwise calculate
            const position = message.currentPosition || getServerSyncedMessagePosition(message.timestamp, activeChannel.id);
            
            if (!position.isExpired) {
              flowMessages.push({
                ...message,
                position: position,
                animationDuration: `${REGULAR_MESSAGE_FLOW_DURATION / 1000}s`,
                isPersistent: true,
                // Clear currentPosition after first use to allow normal flow calculation
                currentPosition: undefined
              });
            }
          }
        });
        
        // Only update if there are meaningful changes
        const prevIds = new Set(prevMessages.map(m => m.id));
        const newIds = new Set(flowMessages.map(m => m.id));
        
        const hasChanges = prevMessages.length !== flowMessages.length ||
          flowMessages.some(msg => !prevIds.has(msg.id)) ||
          prevMessages.some(msg => !newIds.has(msg.id));
        
        return hasChanges ? flowMessages : prevMessages;
      });
    };

    // Initial update
    updateRegularFlow();
    
    // Update every 2 seconds for smooth positioning
    const flowInterval = setInterval(updateRegularFlow, 2000);

    return () => {
      isActive = false;
      clearInterval(flowInterval);
    };
  }, [activeChannel?.id]); // Remove messages dependency to prevent interference

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
            />
          ))}
      </div>

      {/* Typing Indicator */}
      {showTypingIndicator && (
        <TypingIndicator />
      )}

      {/* Message Input Panel - back to original position */}
      <MessageInputPanel
        onSendMessage={handleSendMessage}
        activeChannel={activeChannel}
        isTyping={isTyping}
        onTypingChange={setIsTyping}
      />

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
      )}



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
