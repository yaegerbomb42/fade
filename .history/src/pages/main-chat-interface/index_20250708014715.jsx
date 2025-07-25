// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Icon from 'components/AppIcon';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, off, push as firebasePush } from 'firebase/database';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';

const MainChatInterface = () => {
  // TODO: Replace with your actual Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAX1yMBRCUxfsArQWG5XzN4mx-sk4hgqu0",
    authDomain: "vibrant-bubble-chat.firebaseapp.com",
    databaseURL: "https://aeueua-29dba-default-rtdb.firebaseio.com",
    projectId: "vibrant-bubble-chat",
    storageBucket: "vibrant-bubble-chat.appspot.com",
    messagingSenderId: "1084858947817",
    appId: "1:1084858947817:web:bc63c68c7192a742713878"
  };
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [messageQueue, setMessageQueue] = useState([]);
  const [activeChannel, setActiveChannel] = useState({ id: 'global', name: 'Global Chat' }); // Default to a global channel
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [activityLevel, setActivityLevel] = useState(1);
  const activityTimeWindow = 30 * 1000; // 30 seconds

  // Process messages from queue
  useEffect(() => {
    const processQueue = () => {
      if (messageQueue.length > 0) {
        const [nextMessage, ...remainingMessages] = messageQueue;
        
        // Check if message already exists
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === nextMessage.id);
          return exists ? prev : [...prev, nextMessage];
        });

        // Update activity level based on message rate
        setMessageTimestamps(prev => [...prev, Date.now()]);

        // Remove processed message from queue
        setMessageQueue(remainingMessages);
      }
    };

    // Adjust processing interval based on queue size
    const interval = setInterval(processQueue, Math.max(100, 1000 - (messageQueue.length * 50)));
    return () => clearInterval(interval);
  }, [messageQueue]);

  // Update activity level calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recentTimestamps = messageTimestamps.filter(timestamp => now - timestamp < activityTimeWindow);
      const messageRate = recentTimestamps.length;
      // Map message rate to activity level (1-5)
      const newActivityLevel = Math.min(Math.ceil(messageRate / 2), 5);
      setActivityLevel(newActivityLevel);
      
      // Update message speeds based on activity level
      const minDuration = 2; // Minimum duration in seconds (high activity)
      const maxDuration = 15; // Maximum duration in seconds (low activity)
      const duration = maxDuration - ((newActivityLevel - 1) / 4) * (maxDuration - minDuration);
      setMessages(prev => prev.map(msg => ({
        ...msg,
        animationDuration: `${duration}s`
      })));
    }, 1000);

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
  // Removed unnecessary useEffect hook

  useEffect(() => {
    if (!database) {
      setMessages([]);
      return;
    }

    // Listen to a single global messages path
    const messagesRef = ref(database, `messages`);
    setMessages([]);

      const listener = onChildAdded(messagesRef, (snapshot) => {
        const newMessage = snapshot.val();

        if (!firebaseApp) {
          console.error("Firebase not initialized yet!");
          return;
        }

        // Add new message to queue, ensuring no duplicates based on snapshot.key
        setMessageQueue(prev => {
          const messageId = snapshot.key;
          const existsInQueue = prev.some(msg => msg.id === messageId);
          if (existsInQueue) {
            return prev;
          }
          return [...prev, { ...newMessage, id: messageId }];
        });
      });

    return () => {
      off(messagesRef, 'child_added', listener);
    };
  }, [activeChannel, database, firebaseApp]);

  const handleSendMessage = useCallback((messageData) => {
    if (!database) {
      console.error("Database not initialized. Cannot send message.");
      return;
    }

    const newMessage = {
      ...messageData,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true,
      timestamp: new Date().toISOString(),
    };

    // Push messages to a global path
    const messagesRef = ref(database, `messages`);
    firebasePush(messagesRef, newMessage);
  }, [database]); // Rerun when database changes

  const [reactionStats, setReactionStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    topMessages: []
  });

  const handleReaction = useCallback((messageId, reactionType) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newReactions = {
          ...msg.reactions,
          [reactionType]: msg.reactions[reactionType] + 1
        };
        
        // Update reaction stats
        setReactionStats(prevStats => ({
          totalLikes: prevStats.totalLikes + (reactionType === 'thumbsUp' ? 1 : 0),
          totalDislikes: prevStats.totalDislikes + (reactionType === 'thumbsDown' ? 1 : 0),
          topMessages: [
            ...prevStats.topMessages.filter(m => m.id !== messageId),
            { ...msg, reactions: newReactions }
          ].sort((a, b) => (b.reactions.thumbsUp - b.reactions.thumbsDown) - (a.reactions.thumbsUp - a.reactions.thumbsDown))
          .slice(0, 5)
        }));

        return {
          ...msg,
          reactions: newReactions
        };
      }
      return msg;
    }));

    setAllMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          reactions: {
            ...msg.reactions,
            [reactionType]: msg.reactions[reactionType] + 1
          }
        };
      }
      return msg;
    }));
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
        <div className="flex items-center gap-2">
          {/* ChannelSelector is now always active for the global channel */}
          <ChannelSelector
            onChannelChange={() => {}} // No-op as channel is fixed
            activeChannel={activeChannel}
            className={'w-10 h-10'}
          />
          {/* Removed minimize button as channel selection is no longer dynamic */}
        </div>
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel
        activeChannel={activeChannel}
        messageCount={messages.length}
        allMessages={allMessages}
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
      {showWelcome && ( // Show welcome always, as there's no activeChannel to check
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