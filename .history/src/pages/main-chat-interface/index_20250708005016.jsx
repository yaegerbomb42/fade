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
  const [activeChannel, setActiveChannel] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [activityLevel, setActivityLevel] = useState(1);
  const activityTimeWindow = 30 * 1000; // 30 seconds

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
    // More robust check: ensure database exists, activeChannel exists, and activeChannel.id is present.
    if (!database || !activeChannel || typeof activeChannel.id === 'undefined') {
      setMessages([]); // Clear messages if we can't subscribe or conditions aren't met
      return;
    }
  }, [firebaseConfig]); // Added firebaseConfig to dependency array

  useEffect(() => {
    if (!database || !activeChannel || typeof activeChannel.id === 'undefined') {
      setMessages([]);
      return;
    }

    const messagesRef = ref(database, `channels/${activeChannel.id}/messages`);
    setMessages([]);

    const listener = onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val();

      if (!firebaseApp) {
        console.error("Firebase not initialized yet!");
        return;
      }

      setMessages(prev => [...prev, { ...newMessage, id: snapshot.key }]);
    });

    return () => {
      off(messagesRef, 'child_added', listener);
    };
  }, [activeChannel, database]);

  const handleChannelChange = useCallback((channel) => {
    setActiveChannel(channel);
    // Messages will be cleared by the useEffect hook listening to activeChannel
    setShowWelcome(false);
  }, []);

  const handleSendMessage = useCallback((messageData) => {
    if (!activeChannel || !activeChannel.id || !database) { // Check for activeChannel, activeChannel.id, and database
      console.error("No active channel selected or database not initialized. Cannot send message.");
      return;
    }

    const newMessage = {
      ...messageData,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true, // Assuming this is still relevant
      timestamp: new Date().toISOString(),
    };

    const messagesRef = ref(database, `channels/${activeChannel.id}/messages`);
    firebasePush(messagesRef, newMessage); // Use new firebasePush()
    // setAllMessages(prev => [...prev, newMessage]); // Consider if allMessages needs to be channel-specific
  }, [activeChannel, database]); // Rerun when activeChannel or database changes

  const handleReaction = useCallback((messageId, reactionType) => {
    setMessages(prev => prev.map(msg => {
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

      {/* Main Logo */}
      <div className="fixed top-0 left-0 w-full z-interface">
        <FadeLogo />
      </div>

      {/* Channel Selector - positioned below the logo */}
      <div className="relative z-behind-interface pt-20"> {/* Added relative positioning, lower z-index, and top padding */}
        <ChannelSelector
          onChannelChange={handleChannelChange}
          activeChannel={activeChannel}
        />
      </div>

      {/* Statistics Panel */}
      <StatisticsPanel
        activeChannel={activeChannel}
        messageCount={messages.length}
        allMessages={allMessages}
      />

      {/* Message Display Area */}
      <div className="fixed inset-0 pointer-events-none z-messages pt-32 pb-32">
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
      {showWelcome && !activeChannel && (
        <div
          className="fixed inset-0 flex items-center justify-center z-interface bg-black/40 backdrop-blur-md"
          onClick={() => setShowWelcome(false)}
        >
          <div className="glass-panel p-8 text-center max-w-md fade-in vibey-bg glow-border pointer-events-auto">
            <Icon name="MessageCircle" size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">
              Welcome to FADE
            </h2>
            <p className="text-xs text-text-secondary">
              Chats appear for a moment and then drift away forever. Tap to enter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainChatInterface;