// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from 'components/AppIcon';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, onChildChanged, off, push as firebasePush, runTransaction } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';

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
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const [activeChannel, setActiveChannel] = useState({ id: 'music', name: 'Music & Vibes' });
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [activityLevel, setActivityLevel] = useState(1);
  const [showTopVibes, setShowTopVibes] = useState(false);
  const activityTimeWindow = 30 * 1000; // 30 seconds
  const processedIds = useRef(new Set());

  // Process messages from queue
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processQueue = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...rest] = prev;

        setMessages(msgs => {
          const exists = msgs.some(m => m.id === next.id);
          if (!exists) {
            const minDuration = 4;
            const maxDuration = 15;
            const duration = maxDuration - ((activityLevel - 1) / 4) * (maxDuration - minDuration);
            msgs = [...msgs, { ...next, animationDuration: `${duration}s` }];
            setMessageTimestamps(t => [...t, Date.now()]);
          }
          return msgs;
        });

        return rest;
      });
    };

    const interval = setInterval(processQueue, Math.max(50, 200 - messageQueue.length * 20));
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
      
      // Update message speeds based on channel activity level
      const minDuration = 3; // Minimum duration in seconds (high activity)
      const maxDuration = 12; // Maximum duration in seconds (low activity)
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
      processedIds.current.clear();
      return;
    }

    const messagesRef = ref(database, `channels/${activeChannel.id}/messages`);
    setMessages([]);
    setMessageQueue([]);
    processedIds.current.clear();

    const addListener = onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val();
      const id = snapshot.key;
      if (!processedIds.current.has(id)) {
        processedIds.current.add(id);
        setMessageQueue(q => [...q, { ...newMessage, id }]);
      }
    });

    const changeListener = onChildChanged(messagesRef, (snapshot) => {
      const updated = snapshot.val();
      const id = snapshot.key;
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
    });

    return () => {
      off(messagesRef, 'child_added', addListener);
      off(messagesRef, 'child_changed', changeListener);
    };
  }, [activeChannel, database]);

  // Calculate top vibes from current messages
  const topVibes = React.useMemo(() => {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const tenMinutes = 10 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    const getTopVibeInPeriod = (period) => {
      const cutoff = now - period;
      const periodMessages = messages.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= cutoff;
      });
      
      if (periodMessages.length === 0) return null;
      
      return periodMessages.reduce((best, msg) => {
        const score = (msg.reactions?.thumbsUp || 0) - (msg.reactions?.thumbsDown || 0);
        const bestScore = best ? (best.reactions?.thumbsUp || 0) - (best.reactions?.thumbsDown || 0) : -1;
        return score > bestScore ? msg : best;
      }, null);
    };

    return {
      lastMinute: getTopVibeInPeriod(oneMinute),
      last10Minutes: getTopVibeInPeriod(tenMinutes),
      lastHour: getTopVibeInPeriod(oneHour)
    };
  }, [messages]);

  const handleChannelChange = useCallback((channel) => {
    setActiveChannel(channel);
    // Messages will be cleared by the useEffect hook listening to activeChannel
    setShowWelcome(false);
  }, []);

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

  const messagesRef = ref(database, `channels/${activeChannel.id}/messages`);
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


  const handleReaction = useCallback((messageId, reactionType) => {
    if (!database || !activeChannel) return;
    const reactionRef = ref(database, `channels/${activeChannel.id}/messages/${messageId}/reactions/${reactionType}`);
    runTransaction(reactionRef, (current) => (current || 0) + 1);
  }, [database, activeChannel]);

  const handleRemoveMessage = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

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
      {/* Main Logo - centered and smaller */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-interface w-12 h-12">
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

      {/* Message Display Area - expanded vertically */}
      <div className="fixed inset-0 pointer-events-none z-messages pt-16 pb-16">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            activityLevel={activityLevel}
            message={message}
            index={index}
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
