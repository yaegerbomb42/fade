// src/pages/main-chat-interface/components/MessageBubble.jsx
import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

const MessageBubble = ({ message, index, onReaction, onRemove, activityLevel = 1, totalMessages = 0 }) => {
  // Much improved positioning to prevent overlap with better lane distribution
  const [position, setPosition] = useState(() => {
    // Use fibonacci-like spacing for better distribution
    const lanes = 6; // More lanes for better distribution
    const laneHeight = 80 / lanes; // Distribute across 80% of screen height
    const lane = index % lanes;
    const baseTop = 10 + (lane * laneHeight); // Start at 10% of screen
    const randomOffset = (Math.random() - 0.5) * 8; // Smaller random offset
    
    return {
      top: Math.max(5, Math.min(85, baseTop + randomOffset)), // Keep within bounds
      left: 100 + Math.random() * 15, // Start off-screen to the right
    };
  });
  const [isVisible, setIsVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('35s'); // Slower default duration
  const [hasReacted, setHasReacted] = useState({ thumbsUp: false, thumbsDown: false });
  const [flowSpeed, setFlowSpeed] = useState('message-flow');

  const gradients = [
    'from-primary/30 to-secondary/30',
    'from-secondary/30 to-accent/30',
    'from-accent/30 to-primary/30',
    'from-success/30 to-primary/30',
    'from-primary/30 to-success/30',
  ];

  const userGradients = [
    'from-primary/40 to-secondary/40',
    'from-secondary/40 to-accent/40',
    'from-accent/40 to-success/40',
  ];

  const bubbleGradient = message.isUserMessage 
    ? userGradients[index % userGradients.length]
    : gradients[index % gradients.length];

  // Calculate animation duration based on activity level with slower base speeds
  // activityLevel is expected to be a number between 1 and 5
  // Higher activityLevel means faster animation (shorter duration)
  useEffect(() => {
    const minDuration = 15; // Minimum duration in seconds (faster)
    const maxDuration = 45; // Maximum duration in seconds (much slower for low activity)
    // Map activityLevel (1-5) to duration range
    const duration = maxDuration - ((activityLevel - 1) / 4) * (maxDuration - minDuration);
    setAnimationDuration(`${duration}s`);
  }, [activityLevel]);


  useEffect(() => {
    // Show bubble with pop-in animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Determine message flow speed based on total messages
    setTimeout(() => {
      setPosition(prev => ({
        ...prev,
        left: -20 - Math.random() * 20 // Move to off-screen left (-20% to -40%)
      }));
    }, 50);

    return () => {
      clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    const durationMs = parseFloat(animationDuration) * 1000;
    const removeTimer = setTimeout(() => {
      onRemove && onRemove(message.id);
    }, durationMs);
    return () => clearTimeout(removeTimer);
  }, [animationDuration, message.id, onRemove]);

  const handleThumbsUp = (e) => {
    e.stopPropagation();
    if (!hasReacted.thumbsUp) {
      onReaction(message.id, 'thumbsUp');
      setHasReacted(prev => ({ ...prev, thumbsUp: true }));
    }
  };

  const handleThumbsDown = (e) => {
    e.stopPropagation();
    if (!hasReacted.thumbsDown) {
      onReaction(message.id, 'thumbsDown');
      setHasReacted(prev => ({ ...prev, thumbsDown: true }));
    }
  };

  return (
    <div
      className={`absolute max-w-sm pointer-events-auto ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} message-bubble`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        transition: `left ${animationDuration} linear, opacity 0.3s ease, transform 0.3s ease`,
        willChange: 'left, opacity, transform'
      }}
    >
      <div className={`vibey-card bg-gradient-to-br ${bubbleGradient} border border-glass-border/30 hover:border-glass-highlight/50 transition-all duration-300 group relative overflow-hidden`}>
        
        {/* Vibey background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content container */}
        <div className="relative z-10 p-3">
          
          {/* Header with author and time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {message.author.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-text-primary">
                {message.author}
              </span>
            </div>
            <span className="text-xs text-text-secondary/60 font-mono">
              {new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Message Content - more compact */}
          <div className="text-sm text-text-primary leading-snug mb-3 break-words">
            {message.text}
          </div>

          {/* Reaction bar - easier to click, always visible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                className={`vibey-reaction-btn ${hasReacted.thumbsUp ? 'reacted-up' : 'unreacted'}`}
                onClick={handleThumbsUp}
                title="Like this vibe"
              >
                <span className="text-sm">👍</span>
                <span className="text-xs font-mono ml-1">{message.reactions?.thumbsUp || 0}</span>
              </button>
              
              <button
                className={`vibey-reaction-btn ${hasReacted.thumbsDown ? 'reacted-down' : 'unreacted'}`}
                onClick={handleThumbsDown}
                title="Not feeling this vibe"
              >
                <span className="text-sm">👎</span>
                <span className="text-xs font-mono ml-1">{message.reactions?.thumbsDown || 0}</span>
              </button>
            </div>

            {/* Flow indicator */}
            <div className="opacity-20 group-hover:opacity-60 transition-opacity duration-300">
              <Icon name="Wind" size={10} className="text-text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;