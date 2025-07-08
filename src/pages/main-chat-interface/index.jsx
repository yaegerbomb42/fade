// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Icon from 'components/AppIcon';
import firebase from 'firebase/app';
import 'firebase/database';
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
    databaseURL: "https://vibrant-bubble-chat-default-rtdb.firebaseio.com",
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
  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  }, [firebaseConfig]); // Added firebaseConfig to dependency array

  // Effect for handling Firebase message listeners based on activeChannel
  useEffect(() => {
    if (!activeChannel || !activeChannel.id) { // Check for activeChannel and activeChannel.id
      setMessages([]);
      return;
    }

    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
      console.error("Firebase not initialized yet!");
      return;
    }

    const messagesRef = firebase.database().ref(`channels/${activeChannel.id}/messages`); // Use activeChannel.id
    setMessages([]); // Clear messages when channel changes or initially loads

    const listener = messagesRef.on('child_added', (snapshot) => {
      const newMessage = snapshot.val();
      // It's good practice to include the message ID if you need to update/delete later
      setMessages(prev => [...prev, { ...newMessage, id: snapshot.key }]);
    });

    return () => {
      messagesRef.off('child_added', listener);
    };
  }, [activeChannel]); // Rerun when activeChannel changes

  const handleChannelChange = useCallback((channel) => {
    setActiveChannel(channel);
    // Messages will be cleared by the useEffect hook listening to activeChannel
    setShowWelcome(false);
  }, []);

  const handleSendMessage = useCallback((messageData) => {
    if (!activeChannel || !activeChannel.id) { // Check for activeChannel and activeChannel.id
      console.error("No active channel selected. Cannot send message.");
      return;
    }

    const newMessage = {
      ...messageData,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true, // Assuming this is still relevant
      timestamp: new Date().toISOString(),
    };

    firebase.database().ref(`channels/${activeChannel.id}/messages`).push(newMessage); // Use activeChannel.id
    // setAllMessages(prev => [...prev, newMessage]); // Consider if allMessages needs to be channel-specific
  }, [activeChannel]); // Rerun when activeChannel changes

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
};

export default MainChatInterface;