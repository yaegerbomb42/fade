// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from 'components/AppIcon';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, onChildChanged, off, push as firebasePush, runTransaction, onValue, serverTimestamp, onDisconnect } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';
import { getUserId } from '../../utils/userIdentity';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import TopVibesSection from 'components/ui/TopVibesSection';

const MainChatInterface = () => {
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
  const channelMessages = useRef({}); // Store messages per channel for continuity
  const [activeChannel, setActiveChannel] = useState({ id: 'vibes', name: 'Just Vibes' });
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [activityLevel, setActivityLevel] = useState(1);
  const [showTopVibes, setShowTopVibes] = useState(false);
  const [channelVibesHistory, setChannelVibesHistory] = useState({});
  const [activeUsers, setActiveUsers] = useState(1); // Start with 1 (current user)
  const activityTimeWindow = 30 * 1000; // 30 seconds
  const currentUserId = useRef(getUserId());
  const presenceRef = useRef(null);

  // Process messages from queue
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processQueue = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...rest] = prev;

        setMessages(msgs => {
          const exists = msgs.some(m => m.id === next.id);
          if (!exists && next && next.id && typeof next === 'object') {
            // Slower base speeds with better scaling
            const minDuration = 15; // Faster for high activity
            const maxDuration = 45; // Much slower for low activity
            const duration = maxDuration - ((activityLevel - 1) / 4) * (maxDuration - minDuration);
            
            // Ensure message has required properties with defaults
            const validatedMessage = {
              id: next.id,
              text: next.text || 'No content',
              author: next.author || 'Anonymous',
              timestamp: next.timestamp || new Date().toISOString(),
              reactions: next.reactions || { thumbsUp: 0, thumbsDown: 0 },
              isUserMessage: next.isUserMessage || false,
              userId: next.userId || null,
              animationDuration: `${duration}s`
            };
            
            msgs = [...msgs, validatedMessage];
            
            // Store current messages for this channel
            if (activeChannel && activeChannel.id) {
              channelMessages.current[activeChannel.id] = msgs;
            }
            
            setMessageTimestamps(t => [...t, Date.now()]);
          }
          return msgs;
        });

        return rest;
      });
    };

    // Process queue faster for quicker message appearance after sending
    const interval = setInterval(processQueue, Math.max(25, 100 - messageQueue.length * 15));
    return () => clearInterval(interval);
  }, [messageQueue.length, activityLevel]);

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
      
      // Estimate active users based on message frequency and unique authors
      const uniqueAuthors = new Set(messages.slice(-10).map(m => m.author)).size;
      const estimatedUsers = Math.max(1, Math.min(50, uniqueAuthors + Math.floor(messageRate / 3)));
      setActiveUsers(estimatedUsers);
      
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
  }, [messageTimestamps, activityTimeWindow]);

  // Initialize Firebase (only once)
  // Initialize Firebase app
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [database, setDatabase] = useState(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    setFirebaseApp(app);
    setDatabase(getDatabase(app));
  }, [firebaseConfig]); // firebaseConfig should be stable

  // Effect for handling Firebase message listeners based on activeChannel
  useEffect(() => {
    if (!database || !activeChannel || typeof activeChannel.id === 'undefined') {
      setMessages([]);
      setMessageQueue([]);
      return;
    }

    const messagesRef = ref(database, `channels/${activeChannel.id.replace(/[.#$[\]]/g, '_')}/messages`);
    
    // Restore messages for this channel if we have them
    const channelKey = activeChannel.id;
    if (channelMessages.current[channelKey]) {
      setMessages(channelMessages.current[channelKey]);
    } else {
      setMessages([]);
    }
    setMessageQueue([]);
    
    // More conservative cleanup: only remove IDs older than 24 hours AND not single characters
    // This prevents the "e" message from reappearing
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const currentIds = Array.from(permanentlyProcessedIds.current);
    currentIds.forEach(id => {
      // Only remove IDs that are clearly timestamps (long numbers) AND very old
      if (!isNaN(id) && id.length > 10 && parseInt(id) < twentyFourHoursAgo) {
        permanentlyProcessedIds.current.delete(id);
      }
      // Never remove single character IDs like "e" - keep them permanently blocked
    });

    const addListener = onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val();
      const id = snapshot.key;
      
      // Validate message data before processing
      if (!newMessage || !id || typeof newMessage !== 'object') {
        console.warn('Invalid message data:', { id, newMessage });
        return;
      }
      
      // ONLY check permanentlyProcessedIds - this is the source of truth
      if (!permanentlyProcessedIds.current.has(id)) {
        // Mark as permanently processed immediately when adding to queue
        permanentlyProcessedIds.current.add(id);
        setMessageQueue(q => [...q, { ...newMessage, id }]);
      }
    });

    const changeListener = onChildChanged(messagesRef, (snapshot) => {
      const updated = snapshot.val();
      const id = snapshot.key;
      
      // Validate update data
      if (!updated || !id || typeof updated !== 'object') {
        console.warn('Invalid update data:', { id, updated });
        return;
      }
      
      // Update reactions for messages currently in the stream, regardless of processed status
      setMessages(prev => {
        const messageExists = prev.some(m => m.id === id);
        if (messageExists) {
          const updatedMessages = prev.map(m => (m.id === id ? { ...m, reactions: updated.reactions || m.reactions } : m));
          
          // Update channel messages store
          if (activeChannel && activeChannel.id) {
            channelMessages.current[activeChannel.id] = updatedMessages;
          }
          
          return updatedMessages;
        } else {
          return prev;
        }
      });
    });

    return () => {
      off(messagesRef, 'child_added', addListener);
      off(messagesRef, 'child_changed', changeListener);
    };
  }, [activeChannel, database]);

  // Calculate top vibes from current messages AND persist history
  const topVibes = React.useMemo(() => {
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

    return {
      lastMinute: getTopVibeInPeriod(oneMinute),
      last10Minutes: getTopVibeInPeriod(tenMinutes),
      lastHour: getTopVibeInPeriod(oneHour)
    };
  }, [messages, channelVibesHistory, activeChannel]);

  // Update channel vibes history when messages expire
  useEffect(() => {
    if (!activeChannel) return;
    
    const updateHistory = () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      setChannelVibesHistory(prev => {
        const channelHistory = prev[activeChannel.id] || [];
        
        // Add current messages that are about to expire to history
        const expiredMessages = messages.filter(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          return now - msgTime > 30000; // Messages older than 30 seconds
        });
        
        // Combine with existing history and remove messages older than 1 hour
        const updatedHistory = [...channelHistory, ...expiredMessages]
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
    // Store current messages before switching
    if (activeChannel && activeChannel.id) {
      channelMessages.current[activeChannel.id] = messages;
    }
    
    setActiveChannel(channel);
    // Messages will be restored by the useEffect hook listening to activeChannel
    setShowWelcome(false);
  }, [activeChannel, messages]);

  const handleSendMessage = useCallback((messageData) => {
  if (!activeChannel || !activeChannel.id || !database) {
    console.error("SendMessage: No active channel or DB not init.");
    return;
  }

  const newMessagePayload = {
    ...messageData,
    reactions: { thumbsUp: 0, thumbsDown: 0 },
    isUserMessage: true,
    timestamp: new Date().toISOString(),
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
      const updatedMessages = prev.filter(m => m.id !== id);
      
      // Update channel messages store
      if (activeChannel && activeChannel.id) {
        channelMessages.current[activeChannel.id] = updatedMessages;
      }
      
      return updatedMessages;
    });
    // Permanently mark as processed so it never comes back
    permanentlyProcessedIds.current.add(id);
  }, [activeChannel]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recentTimestamps = messageTimestamps.filter(timestamp => now - timestamp < activityTimeWindow);
      const messageRate = recentTimestamps.length;
      // Map message rate to activity level (adjust this mapping as needed)
      setActivityLevel(Math.min(Math.ceil(messageRate / 2), 5)); // Example mapping: up to 10 messages in 30s -> level 5
    }, 1000); // Update activity level every second

    return () => clearInterval(interval);
  }, [messageTimestamps, activityTimeWindow]);

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
              channelUserCounts={{}} // TODO: Add real user count tracking
              className={activeChannel ? 'w-10 h-10' : ''}
            />
            {activeChannel && (
              <button
                onClick={() => setActiveChannel(null)}
                className="glass-button p-2 hover:bg-glass-highlight transition-colors"
                title="Minimize"
              >
                <Icon name="Minimize2" size={16} className="text-text-primary" />
              </button>
            )}
          </div>
          
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
                <TopVibesSection vibes={topVibes} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel
        activeChannel={activeChannel}
        messageCount={messages.length}
      />

      {/* Message Display Area - expanded vertically with higher top padding */}
      <div className="fixed inset-0 pointer-events-none z-messages pt-20 pb-16">
        {messages.map((message, index) => (
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
      {showWelcome && !activeChannel && (
        <div
          className="fixed inset-0 flex items-center justify-center z-interface"
          onClick={() => setShowWelcome(false)}
        >
          <div className="glass-panel p-8 text-center max-w-md fade-in vibey-bg glow-border pointer-events-auto">
            <Icon name="MessageCircle" size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">
              Welcome to FADE
            </h2>
            <p className="text-xs text-text-secondary">
              Tap to enter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainChatInterface;
