import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import { getUserId } from '../../utils/userIdentity';

const MessageInputPanel = ({ onSendMessage, activeChannel, isTyping, onTypingChange }) => {
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [lastMessage, setLastMessage] = useState('');
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false); // Start minimized by default
  const messageInputRef = useRef(null);

  useEffect(() => {
    const savedNickname = localStorage.getItem('fade-nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setShowNicknameInput(false);
    }
    
    // Cleanup timers on unmount
    return () => {
      if (cooldownTimer) clearInterval(cooldownTimer);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [cooldownTimer, typingTimeout]);

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      localStorage.setItem('fade-nickname', nickname.trim());
      setShowNicknameInput(false);
      // Focus back to message input without disrupting the chat state
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  };

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    
    // Check character and line limits
    const lines = newMessage.split('\n');
    const maxLines = 4;
    const maxTotalChars = 160; // Total character limit
    
    // Limit total characters first
    if (newMessage.length > maxTotalChars) {
      return;
    }
    
    // Limit to 4 lines
    if (lines.length > maxLines) {
      return;
    }
    
    // Allow full input - display wrapping happens in MessageBubble
    setMessage(newMessage);
    
    if (!isTyping) {
      onTypingChange(true);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      onTypingChange(false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const emojiHotbar = [
    '😀', '😂', '🥰', '😎', '🤔', '😮', '😍', '🔥', '💯', '👍', 
    '👎', '❤️', '💔', '😭', '😡', '🤯', '🙄', '😴', '👀'
  ];

  const insertEmoji = (emoji) => {
    const currentMessage = message;
    const newMessage = currentMessage + emoji;
    
    // Check length limit
    if (newMessage.length <= 160) {
      setMessage(newMessage);
      messageInputRef.current?.focus();
    }
  };

  const insertMention = () => {
    const currentMessage = message;
    const newMessage = currentMessage + '@';
    
    // Check length limit
    if (newMessage.length <= 160) {
      setMessage(newMessage);
      messageInputRef.current?.focus();
    }
  };

  const startCooldownTimer = (seconds) => {
    if (cooldownTimer) clearInterval(cooldownTimer);
    
    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsReloading(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setCooldownTimer(timer);
  };

  const startReloadAnimation = () => {
    setIsReloading(true);
    setCooldownTime(2);
    startCooldownTimer(2);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !nickname.trim() || !activeChannel) {
      console.warn('Cannot send message: missing required fields', {
        hasMessage: !!message.trim(),
        hasNickname: !!nickname.trim(),
        hasActiveChannel: !!activeChannel
      });
      return;
    }
    
    // Check if already in cooldown/reload state
    if (cooldownTime > 0 || isReloading) {
      console.warn('Cannot send message: currently in cooldown');
      return;
    }
    
    try {
      // Send message
      onSendMessage({
        text: message.trim(),
        author: nickname.trim(),
        channel: activeChannel.id,
        timestamp: new Date().toISOString(), // Fix: Use ISO string instead of Date object
        userId: getUserId() // Add unique user ID to message
      });
      
      setLastMessage(message.trim());
      setLastMessageTime(Date.now());
      setMessage('');
      onTypingChange(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Always show reload animation after sending a message
      startReloadAnimation();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (showNicknameInput) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-interface w-full max-w-md px-4">
        <form onSubmit={handleNicknameSubmit} className="glass-panel p-6 fade-in">
          <div className="text-center mb-4">
            <Icon name="User" size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
              What's Your Vibe?
            </h3>
            <p className="text-sm text-text-secondary">
              Drop a name and join the flow
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your vibe name..."
              className="w-full glass-panel px-4 py-3 bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all duration-300 text-center"
              maxLength={20}
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-full glass-button px-6 py-3 bg-primary/30 text-text-primary font-medium hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                <Icon name="ArrowRight" size={18} />
                Get Faded
              </div>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-interface w-full max-w-2xl px-4">
      {/* Emoji Hotbar */}
      {showEmojiBar && (
        <div className="mb-2">
          <div className="glass-panel p-2 fade-in">
            <div className="flex flex-wrap gap-1 justify-center">
              {emojiHotbar.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => insertEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-base hover:bg-glass-surface/40 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isReloading}
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emoji Toggle Button & Mention Helper */}
      <div className="mb-2 flex justify-center gap-2">
        <button
          onClick={() => setShowEmojiBar(!showEmojiBar)}
          className="glass-button px-3 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
        >
          <Icon name="Smile" size={14} />
          {showEmojiBar ? 'Hide Emojis' : 'Show Emojis'}
        </button>
        
        <button
          onClick={() => insertMention('')}
          className="glass-button px-3 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
          title="Add @mention - type @ followed by a username to mention someone"
        >
          <Icon name="at-sign" size={14} />
          @mention
        </button>
      </div>

      {/* Chat Input Panel */}
      <div className="glass-panel p-4 fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Icon name="User" size={16} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary">{nickname}</span>
          </div>
          
          <button
            onClick={() => {
              setShowNicknameInput(true);
              // Don't remove the nickname from localStorage immediately
              // Only remove it when the user actually changes it
            }}
            className="glass-button px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-all duration-300"
          >
            <Icon name="Edit2" size={12} />
          </button>

          {activeChannel && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs text-text-secondary">
                # {activeChannel.name}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative overflow-hidden rounded-lg">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder={activeChannel ? `Send a message to #${activeChannel.name}...` : "Select a channel to start messaging..."}
              className={`w-full glass-panel px-4 py-3 bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all duration-300 resize-none relative z-10 ${
                isReloading ? 'animate-pulse' : ''
              }`}
              rows="1"
              disabled={!activeChannel || cooldownTime > 0 || isReloading}
            />
            
            {/* Sending animation overlay */}
            {isReloading && (
              <div className="sending-overlay"></div>
            )}
            
            {/* Character counter */}
            {message.length > 0 && !isReloading && (
              <div className="absolute bottom-2 right-2 text-xs text-text-secondary font-mono">
                {message.length}/160
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || !activeChannel || cooldownTime > 0 || isReloading}
            className={`glass-button px-6 py-3 bg-gradient-to-r from-primary to-secondary text-text-primary font-medium hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative`}
          >
            <div className={`relative ${isReloading ? 'send-glow' : ''}`}>
              <Icon name="Send" size={18} />
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInputPanel;