import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const MessageInputPanel = ({ onSendMessage, activeChannel, isTyping, onTypingChange }) => {
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    const savedNickname = localStorage.getItem('fade-nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setShowNicknameInput(false);
    }
  }, []);

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      localStorage.setItem('fade-nickname', nickname.trim());
      setShowNicknameInput(false);
      messageInputRef.current?.focus();
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && nickname.trim() && activeChannel) {
      onSendMessage({
        id: Date.now(),
        text: message.trim(),
        author: nickname.trim(),
        channel: activeChannel.id,
        timestamp: new Date()
      });
      setMessage('');
      onTypingChange(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
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
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-interface w-full max-w-md px-4">
        <form onSubmit={handleNicknameSubmit} className="glass-panel p-6 fade-in">
          <div className="text-center mb-4">
            <Icon name="User" size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
              Choose Your Identity
            </h3>
            <p className="text-sm text-text-secondary">
              Enter a nickname to join the conversation
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
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
                Enter the Void
              </div>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-interface w-full max-w-2xl px-4">
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
              localStorage.removeItem('fade-nickname');
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
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder={activeChannel ? `Send a message to #${activeChannel.name}...` : "Select a channel to start messaging..."}
              className="w-full glass-panel px-4 py-3 bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all duration-300 resize-none"
              rows="1"
              maxLength={500}
              disabled={!activeChannel}
            />
            
            {message.length > 400 && (
              <div className="absolute bottom-2 right-2 text-xs text-text-secondary font-data">
                {500 - message.length}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || !activeChannel}
            className="glass-button px-6 py-3 bg-gradient-to-r from-primary to-secondary text-text-primary font-medium hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <Icon name="Send" size={18} />
          </button>
        </form>

        {isTyping && (
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Typing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInputPanel;