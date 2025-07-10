// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, onChildChanged, off, push as firebasePush, runTransaction, onValue, serverTimestamp, onDisconnect, query, orderByChild, startAt, get } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';
import { getUserId } from '../../utils/userIdentity';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import { TopVibesSection, TopVibersSection } from 'components/ui/TopVibesSection';
import ProfanityFilterToggle from 'components/ui/ProfanityFilterToggle';

const MainChatInterface = () => {
  const { channelId: urlChannelId } = useParams();
  const navigate = useNavigate();
  
  const firebaseConfig = {
    apiKey: "AIzaSyAX1yMBRCUxfsArQWG5XzN4mx-sk4hgqu0",
    authDomain: "vibrant-bubble-chat.firebaseapp.com",
    databaseURL: "https://vibrant-bubble-chat-default-rtdb.firebaseio.com",
    projectId: "vibrant-bubble-chat",
    storageBucket: "vibrant-bubble-chat.appspot.com",
    messagingSenderId: "1084858947817",
    appId: "1:1084858947817:web:bc63c68c7192a742713878"
  };
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
  const [foreverStreamQueue, setForeverStreamQueue] = useState([]);
  const [foreverStreamIndex, setForeverStreamIndex] = useState(0);
  const [foreverStreamMessages, setForeverStreamMessages] = useState({});  // Change to object keyed by channel
  const FOREVER_STREAM_SYNC_KEY = 'forever-stream-sync';
  const FOREVER_STREAM_CYCLE_INTERVAL = 20000; // 20 seconds between messages (much slower)
  const MAX_FOREVER_STREAM_MESSAGES = 5000;
  const MAX_ACTIVE_MESSAGES = 8; // Even fewer messages on screen for smoother experience
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
    'forever-stream': { id: 'forever-stream', name: 'Forever Stream', special: true },
    'deep-thoughts': { id: 'deep-thoughts', name: 'Deep Thoughts' },
    'creative-zone': { id: 'creative-zone', name: 'Creative Zone' },
    'study-break': { id: 'study-break', name: 'Study Break' }
  };

  // Handle URL channel parameter
  useEffect(() => {
    if (urlChannelId && channelMap[urlChannelId]) {
      setActiveChannel(channelMap[urlChannelId]);
    }
  }, [urlChannelId]);

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

  // Collision detection and positioning logic
  const findAvailablePosition = useCallback((messageId, preferredLane = null) => {
    const lanes = 6;
    const laneHeight = 70 / lanes;
    const messageHeight = 8; // Approximate height percentage of a message bubble
    const minSpacing = 12; // Minimum vertical spacing between messages
    
    // Get current active positions
    const activePositions = Array.from(messagePositions.current.values());
    
    // Try preferred lane first, then others
    const lanesToTry = preferredLane !== null 
      ? [preferredLane, ...Array.from({length: lanes}, (_, i) => i).filter(i => i !== preferredLane)]
      : Array.from({length: lanes}, (_, i) => i);
    
    for (const lane of lanesToTry) {
      const baseTop = 20 + (lane * laneHeight);
      
      // Try different vertical positions within the lane
      const positions = [
        baseTop, // Center of lane
        baseTop - 3, // Slightly above center
        baseTop + 3, // Slightly below center
        baseTop - 6, // Further above
        baseTop + 6, // Further below
      ];
      
      for (const top of positions) {
        // Ensure position is within bounds
        if (top < 15 || top > 80) continue;
        
        // Check for collisions with existing messages
        const hasCollision = activePositions.some(pos => {
          const verticalDistance = Math.abs(pos.top - top);
          const horizontalOverlap = pos.left > 80; // Messages still in visible area
          return horizontalOverlap && verticalDistance < minSpacing;
        });
        
        if (!hasCollision) {
          const position = {
            lane,
            verticalOffset: top - baseTop,
            horizontalStart: 100 + Math.random() * 5, // Small random start variation
            top,
            left: 100 + Math.random() * 5
          };
          
          // Store position for collision tracking
          messagePositions.current.set(messageId, position);
          
          return position;
        }
      }
    }
    
    // If no collision-free position found, use a delayed position
    const fallbackLane = Math.floor(Math.random() * lanes);
    const baseTop = 20 + (fallbackLane * laneHeight);
    const position = {
      lane: fallbackLane,
      verticalOffset: 0,
      horizontalStart: 120 + Math.random() * 10, // Start further right to create delay
      top: baseTop,
      left: 120 + Math.random() * 10
    };
    
    messagePositions.current.set(messageId, position);
    return position;
  }, []);

  // Clean up message positions when messages are removed
  const removeMessagePosition = useCallback((messageId) => {
    messagePositions.current.delete(messageId);
  }, []);

  // Update message positions as they move
  const updateMessagePosition = useCallback((messageId, newLeft) => {
    const position = messagePositions.current.get(messageId);
    if (position) {
      messagePositions.current.set(messageId, { ...position, left: newLeft });
    }
  }, []);

  // Process messages from queue with dynamic spacing
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processQueue = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...rest] = prev;

        setMessages(msgs => {
          const exists = msgs.some(m => m.id === next.id);
          if (!exists && next && next.id && typeof next === 'object') {
            
            // Special handling for Forever Stream channel
            if (activeChannel?.id === 'forever-stream') {
              // Add to forever stream storage but don't duplicate in regular flow
              setForeverStreamMessages(prev => {
                // Check if message already exists in storage
                const alreadyStored = prev.some(stored => stored.id === next.id);
                if (alreadyStored) return prev;
                
                const updated = [...prev, next];
                // Maintain max message limit
                if (updated.length > MAX_FOREVER_STREAM_MESSAGES) {
                  return updated.slice(-MAX_FOREVER_STREAM_MESSAGES);
                }
                return updated;
              });
              
              // Only show if we have room for more active messages and it's not already active
              if (msgs.length >= MAX_ACTIVE_MESSAGES) {
                return msgs; // Don't add more if at capacity
              }
            }
            
            // Dynamic speed adjustment based on congestion
            const congestionLevel = Math.min(msgs.length / 10, 1); // 0-1 based on active messages
            const baseMinDuration = 15;
            const baseMaxDuration = 45;
            
            // Speed up when congested, slow down when sparse
            const minDuration = baseMinDuration * (1 - congestionLevel * 0.3); // Up to 30% faster
            const maxDuration = baseMaxDuration * (1 + congestionLevel * 0.2); // Up to 20% slower
            
            const duration = maxDuration - ((activityLevel - 1) / 4) * (maxDuration - minDuration);
            
            // Find optimal position with collision detection
            const position = findAvailablePosition(next.id, next.preferredLane);
            
            // Ensure message has required properties with defaults
            const validatedMessage = {
              id: next.id,
              text: next.text || 'No content',
              author: next.author || 'Anonymous',
              timestamp: next.timestamp || new Date().toISOString(),
              reactions: next.reactions || { thumbsUp: 0, thumbsDown: 0 },
              isUserMessage: next.isUserMessage || false,
              userId: next.userId || null,
              animationDuration: `${duration}s`,
              channelId: activeChannel?.id, // Track which channel this message belongs to
              position: position, // Use collision-detected position
              onPositionUpdate: updateMessagePosition, // Callback to update position
              onRemove: removeMessagePosition // Callback to clean up position
            };
            
            msgs = [...msgs, validatedMessage];
            setMessageTimestamps(t => [...t, Date.now()]);
          }
          return msgs;
        });

        return rest;
      });
    };

    // Dynamic queue processing speed based on congestion
    const queueLength = messageQueue.length;
    const baseInterval = 100;
    const processInterval = Math.max(25, baseInterval - queueLength * 10); // Faster processing when backed up
    
    const interval = setInterval(processQueue, processInterval);
    return () => clearInterval(interval);
  }, [messageQueue.length, activityLevel, activeChannel?.id, findAvailablePosition, updateMessagePosition, removeMessagePosition]);

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
  }, [firebaseConfig]); // firebaseConfig should be stable

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
    
    // Special cleanup for Forever Stream to maintain message limit
    if (activeChannel.id === 'forever-stream') {
      // Check message count and cleanup if needed
      const checkAndCleanup = async () => {
        try {
          const snapshot = await get(messagesRef);
          
          if (snapshot.exists()) {
            const messages = snapshot.val();
            const messageEntries = Object.entries(messages);
            
            if (messageEntries.length > MAX_FOREVER_STREAM_MESSAGES) {
              // Sort by timestamp and remove oldest messages
              const sorted = messageEntries.sort((a, b) => {
                const timeA = new Date(a[1].timestamp).getTime();
                const timeB = new Date(b[1].timestamp).getTime();
                return timeA - timeB;
              });
              
              const messagesToRemove = sorted.slice(0, messageEntries.length - MAX_FOREVER_STREAM_MESSAGES);
              
              // Remove old messages from database
              messagesToRemove.forEach(([messageId]) => {
                const messageToRemove = ref(database, `channels/${channelId}/messages/${messageId}`);
                messageToRemove.remove().catch(console.error);
              });
              
              console.log(`Forever Stream: Cleaned up ${messagesToRemove.length} old messages`);
            }
          }
        } catch (error) {
          console.error('Forever Stream cleanup error:', error);
        }
      };
      
      checkAndCleanup();
    }
    
    // Clear current state when switching channels
    setMessages([]);
    setMessageQueue([]);
    messagePositions.current.clear(); // Clear position tracking for new channel
    currentChannelRef.current = channelId;
    
    // Record when user joins - for tracking NEW messages
    const joinTimestamp = Date.now();
    
    // Load recent messages for regular channels (last 10 minutes)
    const loadRecentMessages = async () => {
      try {
        // For regular channels, load messages from the last 5 minutes instead of 10
        // This reduces the chance of disrupting the flow
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const recentMessagesQuery = query(
          messagesRef,
          orderByChild('timestamp'),
          startAt(fiveMinutesAgo)
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
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-8); // Only load last 8 messages to avoid overwhelming the flow
          
          // Add these existing messages to the queue with staggered timing
          messageArray.forEach((message, index) => {
            if (!permanentlyProcessedIds.current.has(message.id)) {
              permanentlyProcessedIds.current.add(message.id);
              setTimeout(() => {
                setMessageQueue(q => [...q, { 
                  ...message, 
                  channelId, 
                  isRecentMessage: true,
                  // Give recent messages some time to flow naturally
                  animationDuration: '25s'
                }]);
              }, index * 1500); // Stagger by 1.5 seconds each
            }
          });
          
          console.log(`Loaded ${messageArray.length} recent messages for #${activeChannel.name}`);
        }
      } catch (error) {
        console.error('Failed to load recent messages:', error);
      }
    };
     
     // Special handling for Forever Stream - load existing messages for cycling
    if (activeChannel.id === 'forever-stream') {
      const loadExistingMessages = async () => {
        try {
          const snapshot = await get(messagesRef);
          if (snapshot.exists()) {
            const messages = snapshot.val();
            const messageArray = Object.entries(messages)
              .map(([id, message]) => ({ ...message, id }))
              .filter(msg => msg.text && msg.text.trim() !== '' && 
                           msg.text !== 'No content' && 
                           msg.author && msg.author.trim() !== '' &&
                           msg.author !== 'Anonymous') // Filter out invalid messages
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .slice(-1000); // Load last 1000 valid messages for cycling
            
            setForeverStreamMessages(prev => ({
              ...prev,
              [channelId]: messageArray
            }));
            setForeverStreamIndex(0);
            console.log(`Forever Stream [${channelId}]: Loaded ${messageArray.length} valid messages for cycling`);
          }
        } catch (error) {
          console.error('Failed to load Forever Stream messages:', error);
        }
      };

      loadExistingMessages();
    } else {
      // For regular channels, load recent messages
      loadRecentMessages();
      
      // Clear forever stream data for this channel when not in forever stream
      setForeverStreamMessages(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      setForeverStreamIndex(0);
    }
    
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
    console.error("SendMessage: No active channel or DB not init.");
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
    ...messageData,
    reactions: { thumbsUp: 0, thumbsDown: 0 },
    isUserMessage: true,
    timestamp: new Date().toISOString(),
    position: messagePosition, // Server-determined position
    createdAt: Date.now(), // For precise timing synchronization
    userId: userId // Track who sent it
  };

  const messagesRef = ref(database, `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages`);
  firebasePush(messagesRef, newMessagePayload);
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
    
    // For Forever Stream messages, use the original message ID for reactions
    let actualMessageId = messageId;
    
    // Check if this is a forever stream cycle message
    if (messageId.includes('_cycle_')) {
      // Extract the original ID from the cycle ID
      const parts = messageId.split('_cycle_');
      actualMessageId = parts[0];
    }
    
    const channelPath = `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages/${actualMessageId}/reactions`;
    
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

  // Forever Stream global synchronization with persistent positioning
  const getGlobalForeverStreamState = () => {
    // Get a synchronized timestamp that all users share
    const FOREVER_STREAM_START_TIME = 1704067200000; // Fixed epoch timestamp (Jan 1, 2024)
    const now = Date.now();
    const elapsed = now - FOREVER_STREAM_START_TIME;
    const cycleNumber = Math.floor(elapsed / FOREVER_STREAM_CYCLE_INTERVAL);
    const nextCycleTime = FOREVER_STREAM_START_TIME + (cycleNumber + 1) * FOREVER_STREAM_CYCLE_INTERVAL;
    const timeUntilNext = nextCycleTime - now;
    
    // Calculate how far through the current cycle we are (0-1)
    const cycleProgress = (elapsed % FOREVER_STREAM_CYCLE_INTERVAL) / FOREVER_STREAM_CYCLE_INTERVAL;
    
    return { cycleNumber, timeUntilNext, nextCycleTime, cycleProgress };
  };

  // Calculate deterministic message position based on global timing
  const calculateMessagePosition = (messageId, cycleNumber, cycleProgress) => {
    // Use message ID as seed for consistent positioning across users
    const seed = messageId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (seed * 9301 + 49297) % 233280 / 233280; // Deterministic "random"
    
    const lanes = 6;
    const laneHeight = 70 / lanes;
    const lane = Math.floor(pseudoRandom * lanes);
    const baseTop = 20 + (lane * laneHeight);
    const verticalOffset = (pseudoRandom - 0.5) * 6;
    
    // Calculate horizontal position based on cycle progress
    // Messages start at 120% and move to -30% over the cycle duration
    const startX = 120;
    const endX = -30;
    const currentX = startX - (cycleProgress * (startX - endX));
    
    return {
      top: Math.max(25, Math.min(85, baseTop + verticalOffset)),
      left: currentX,
      lane,
      verticalOffset
    };
  };

  // Forever Stream cycling logic with persistent positioning
  useEffect(() => {
    const currentChannelMessages = foreverStreamMessages[activeChannel?.id] || [];
    if (activeChannel?.id !== 'forever-stream' || currentChannelMessages.length === 0) {
      return;
    }

    const updateForeverStream = () => {
      setMessages(current => {
        const { cycleNumber, cycleProgress } = getGlobalForeverStreamState();
        const activeMessages = [];
        
        // Calculate which messages should be active based on their cycle timing
        for (let i = 0; i < MAX_ACTIVE_MESSAGES && i < currentChannelMessages.length; i++) {
          const messageOffset = i * 2; // Increase spacing between messages
          const messageCycle = cycleNumber - messageOffset;
          
          if (messageCycle < 0) continue; // Message hasn't started yet
          
          const messageIndex = messageCycle % currentChannelMessages.length;
          const messageToAdd = currentChannelMessages[messageIndex];
          
          if (!messageToAdd) continue;
          
          // Validate message before adding to stream
          if (!messageToAdd.text || messageToAdd.text.trim() === '' ||
              messageToAdd.text === 'No content' ||
              !messageToAdd.author || messageToAdd.author.trim() === '' ||
              messageToAdd.author === 'Anonymous') {
            continue;
          }
          
          // Calculate the progress for this specific message with offset
          const messageProgress = (cycleProgress + (messageOffset * 0.1)) % 1;
          
          // Only show messages that are still visible (haven't completely exited)
          if (messageProgress > 0.9) continue; // Message has exited earlier
          
          const position = calculateMessagePosition(messageToAdd.id, messageCycle, messageProgress);
          const cycleId = `${messageToAdd.id}_cycle_${messageCycle}_${activeChannel.id}`;
          
          // Create a new instance of the message with synchronized positioning
          const cycledMessage = {
            ...messageToAdd,
            id: cycleId,
            originalId: messageToAdd.id,
            timestamp: new Date().toISOString(),
            position: position,
            channelId: activeChannel.id,
            animationDuration: `${FOREVER_STREAM_CYCLE_INTERVAL / 1000}s`, // Match cycle interval
            isPersistent: true // Mark as persistent for positioning
          };
          
          activeMessages.push(cycledMessage);
        }
        
        return activeMessages;
      });
    };

    // Update immediately
    updateForeverStream();
    
    // Update every 500ms for smoother but not choppy experience
    const updateInterval = setInterval(updateForeverStream, 500);

    return () => {
      clearInterval(updateInterval);
    };
  }, [activeChannel?.id, foreverStreamMessages]);

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

      {/* Message Display Area - increased padding to avoid FADE logo and credit */}
      <div className="fixed inset-0 pointer-events-none z-messages pt-28 pb-16">
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

      {/* Message Input Panel */}
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

      {/* Privacy Policy Link */}
      <div className="fixed bottom-4 right-4 z-interface">
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
