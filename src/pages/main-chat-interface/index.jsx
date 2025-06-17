// src/pages/main-chat-interface/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Icon from 'components/AppIcon';
import ChannelSelector from 'components/ui/ChannelSelector';
import StatisticsPanel from 'components/ui/StatisticsPanel';
import MessageInputPanel from 'components/ui/MessageInputPanel';

import AnimatedBackground from './components/AnimatedBackground';
import FadeLogo from './components/FadeLogo';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';

const MainChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Initialize with empty messages when channel is selected
  useEffect(() => {
    if (activeChannel) {
      setMessages([]);
    }
  }, [activeChannel]);

  const handleChannelChange = useCallback((channel) => {
    setActiveChannel(channel);
    setMessages([]); // Clear messages when switching channels
    setShowWelcome(false);
  }, []);

  const handleSendMessage = useCallback((messageData) => {
    const newMessage = {
      ...messageData,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
      isUserMessage: true
    };

    setMessages(prev => [...prev, newMessage]);
    setAllMessages(prev => [...prev, newMessage]);

    // Remove message after a longer time
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 90000); // Extend to 90 seconds to keep messages visible longer
  }, []);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Main Logo */}
      <div className="fixed top-0 left-0 w-full z-interface">
        <FadeLogo />
      </div>

      {/* Channel Selector - positioned below the logo */}
      <ChannelSelector 
        onChannelChange={handleChannelChange}
        activeChannel={activeChannel}
      />

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