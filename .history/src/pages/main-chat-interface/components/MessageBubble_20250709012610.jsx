// src/pages/main-chat-interface/components/MessageBubble.jsx
import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import { getUserReactionKey, getUserId, cleanupOldReactions } from '../../../utils/userIdentity';

const MessageBubble = ({ message, index, onReaction, onRemove, activityLevel = 1, totalMessages = 0 }) => {
  // Guard clause: don't render if message is invalid
  if (!message || !message.id) {
    return null;
  }
  
  // Much improved positioning to prevent overlap with better lane distribution
  const [position, setPosition] = useState(() => {
    // Use fibonacci-like spacing for better distribution
    const lanes = 6; // More lanes for better distribution
    const laneHeight = 75 / lanes; // Distribute across 75% of screen height (was 80%)
    const lane = index % lanes;
    const baseTop = 15 + (lane * laneHeight); // Start at 15% of screen (lower to avoid FADE logo)
    const randomOffset = (Math.random() - 0.5) * 8; // Smaller random offset
    
    return {
      top: Math.max(15, Math.min(85, baseTop + randomOffset)), // Keep within bounds, avoid logo area
      left: 100 + Math.random() * 15, // Start off-screen to the right
    };
  });
  const [isVisible, setIsVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('35s'); // Slower default duration
  const [hasReacted, setHasReacted] = useState({ thumbsUp: false, thumbsDown: false });
  const [flowSpeed, setFlowSpeed] = useState('message-flow');

  // Check if user has already reacted to this message
  useEffect(() => {
    const reactionKey = getUserReactionKey(message.id);
    const userReaction = localStorage.getItem(reactionKey);
    if (userReaction) {
      const reactionData = JSON.parse(userReaction);
      setHasReacted(reactionData);
    }
    
    // Cleanup old reactions occasionally (5% chance per message load)
    if (Math.random() < 0.05) {
      cleanupOldReactions();
    }
  }, [message.id]);

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
    }, 100 + (index % 5) * 50); // Stagger appearance slightly

    // Determine message flow speed and add slight staggering
    setTimeout(() => {
      setPosition(prev => ({
        ...prev,
        left: -25 - Math.random() * 15 // Move to off-screen left with variation
      }));
    }, 150 + (index % 3) * 100); // Stagger movement start

    return () => {
      clearTimeout(showTimer);
    };
  }, [index]);

  useEffect(() => {
    const durationMs = parseFloat(animationDuration) * 1000;
    const removeTimer = setTimeout(() => {
      onRemove && onRemove(message.id);
    }, durationMs);
    return () => clearTimeout(removeTimer);
  }, [animationDuration, message.id, onRemove]);

  const handleThumbsUp = (e) => {
    e.stopPropagation();
    const reactionKey = getUserReactionKey(message.id);
    
    if (hasReacted.thumbsDown) {
      // If user already disliked, switch to like
      onReaction(message.id, 'thumbsUp', 'thumbsDown'); // Add thumb up, remove thumb down
      const newReaction = { thumbsUp: true, thumbsDown: false };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    } else if (!hasReacted.thumbsUp) {
      // If no reaction yet, add like
      onReaction(message.id, 'thumbsUp', null);
      const newReaction = { thumbsUp: true, thumbsDown: false };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    }
    // If already liked, do nothing (can't unlike)
  };

  const handleThumbsDown = (e) => {
    e.stopPropagation();
    const reactionKey = getUserReactionKey(message.id);
    
    if (hasReacted.thumbsUp) {
      // If user already liked, switch to dislike
      onReaction(message.id, 'thumbsDown', 'thumbsUp'); // Add thumb down, remove thumb up
      const newReaction = { thumbsUp: false, thumbsDown: true };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    } else if (!hasReacted.thumbsDown) {
      // If no reaction yet, add dislike
      onReaction(message.id, 'thumbsDown', null);
      const newReaction = { thumbsUp: false, thumbsDown: true };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    }
    // If already disliked, do nothing (can't undislike)
  };

  return (
    <div
      className={`absolute max-w-xs pointer-events-auto ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} message-bubble`}
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
                  {(message.author || 'Anonymous').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-text-primary">
                {message.author || 'Anonymous'}
              </span>
            </div>
            <span className="text-xs text-text-secondary/60 font-mono">
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
              }) : 'Unknown time'}
            </span>
          </div>

          {/* Message Content - wrap at 40 characters */}
          <div className="text-sm text-text-primary leading-snug mb-3 break-words" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            width: '320px', // Fixed width to ensure consistent 40-char wrapping
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
            letterSpacing: '-0.01em'
          }}>
            {(() => {
              const text = message.text || 'No message content';
              // Break text into lines of approximately 40 characters
              const words = text.split(' ');
              const lines = [];
              let currentLine = '';
              
              for (const word of words) {
                if ((currentLine + ' ' + word).length <= 40) {
                  currentLine = currentLine ? currentLine + ' ' + word : word;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              return lines.join('\n');
            })()}
          </div>

          {/* Reaction bar - easier to click, always visible */}
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <button
                className={`vibey-reaction-btn like-btn ${hasReacted.thumbsUp ? 'reacted-up' : 'unreacted'}`}
                onClick={handleThumbsUp}
                title="Like this vibe"
              >
                <span className="text-sm">👍</span>
                <span className="text-xs font-mono ml-1">{message.reactions?.thumbsUp || 0}</span>
              </button>
              
              <button
                className={`vibey-reaction-btn dislike-btn ${hasReacted.thumbsDown ? 'reacted-down' : 'unreacted'}`}
                onClick={handleThumbsDown}
                title="Not feeling this vibe"
              >
                <span className="text-sm">👎</span>
                <span className="text-xs font-mono ml-1">{message.reactions?.thumbsDown || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;