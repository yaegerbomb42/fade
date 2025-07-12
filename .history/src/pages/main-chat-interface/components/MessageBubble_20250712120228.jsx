// src/pages/main-chat-interface/components/MessageBubble.jsx
import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import { getUserReactionKey, getUserId, cleanupOldReactions } from '../../../utils/userIdentity';
import { useAuth } from '../../../contexts/AuthContext';

const MessageBubble = ({ 
  message, 
  index, 
  onReaction, 
  onRemove, 
  activityLevel = 1, 
  totalMessages = 0,
  onUserClick,
  onReportClick,
  database 
}) => {
  const { isSignedIn, user, updateUserStats } = useAuth();
  
  // Guard clause: don't render if message is invalid
  if (!message || !message.id) {
    return null;
  }
  
  // Server-based positioning for consistent placement across all users
  const [position, setPosition] = useState(() => {
    // Use the collision-detected position from the parent
    if (message.position) {
      const { top, left } = message.position;
      return { top, left };
    }
    
    // Fallback for messages without positioning
    const lanes = 6;
    const laneHeight = 70 / lanes;
    const lane = index % lanes;
    const baseTop = 20 + (lane * laneHeight);
    const randomOffset = (Math.random() - 0.5) * 6;
    
    return {
      top: Math.max(25, Math.min(85, baseTop + randomOffset)),
      left: 100 + Math.random() * 10,
    };
  });
  const [isVisible, setIsVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('35s'); // Slower default duration
  const [hasReacted, setHasReacted] = useState({ thumbsUp: false, thumbsDown: false });
  const [flowSpeed, setFlowSpeed] = useState('message-flow');

  // Parse @mentions in message text
  const parseMessageWithMentions = (text) => {
    if (!text) return text;
    
    // Match @username patterns
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Add mention
      parts.push({
        type: 'mention',
        content: match[0],
        username: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const renderMessageContent = () => {
    const messageParts = parseMessageWithMentions(message.text);
    
    if (typeof messageParts === 'string') {
      return messageParts;
    }
    
    return messageParts.map((part, index) => {
      if (part.type === 'mention') {
        return (
          <span
            key={index}
            className="bg-blue-500 bg-opacity-20 text-blue-300 px-1 rounded cursor-pointer hover:bg-opacity-30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onUserClick) {
                onUserClick(part.username);
              }
            }}
          >
            {part.content}
          </span>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

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
    // For persistent messages, don't animate - just use the calculated position
    if (message.isPersistent && message.position) {
      setPosition({
        top: message.position.top,
        left: message.position.left
      });
      setIsVisible(true);
      return;
    }

    // Synchronized show timing based on server timestamp for regular messages
    const messageCreatedAt = message.createdAt || new Date(message.timestamp).getTime();
    const now = Date.now();
    const syncDelay = Math.max(0, messageCreatedAt - now + 200); // 200ms sync buffer
    
    // Show bubble with synchronized timing across all users
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, syncDelay);

    // Start movement with same synchronized timing for regular messages
    const moveTimer = setTimeout(() => {
      const finalLeft = -30; // Ensure complete exit off left side
      setPosition(prev => {
        const newPosition = { ...prev, left: finalLeft };
        
        // Update parent tracking if callback provided
        if (message.onPositionUpdate) {
          message.onPositionUpdate(message.id, finalLeft);
        }
        
        return newPosition;
      });
    }, syncDelay + 100);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(moveTimer);
    };
  }, [message]);

  useEffect(() => {
    const durationMs = parseFloat(animationDuration) * 1000;
    const removeTimer = setTimeout(() => {
      // Call parent cleanup callback if provided
      if (message.onRemove) {
        message.onRemove(message.id);
      }
      onRemove && onRemove(message.id);
    }, durationMs);
    return () => clearTimeout(removeTimer);
  }, [animationDuration, message.id, message.onRemove, onRemove]);

  const handleThumbsUp = (e) => {
    e.stopPropagation();
    
    // Use the message ID for reactions
    let reactionMessageId = message.id;
    const reactionKey = getUserReactionKey(reactionMessageId);
    
    if (hasReacted.thumbsDown) {
      // If user already disliked, switch to like
      onReaction(reactionMessageId, 'thumbsUp', 'thumbsDown'); // Add thumb up, remove thumb down
      const newReaction = { thumbsUp: true, thumbsDown: false };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    } else if (!hasReacted.thumbsUp) {
      // If no reaction yet, add like
      onReaction(reactionMessageId, 'thumbsUp', null);
      const newReaction = { thumbsUp: true, thumbsDown: false };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    }
    // If already liked, do nothing (can't unlike)
  };

  const handleThumbsDown = (e) => {
    e.stopPropagation();
    
    // Use the message ID for reactions
    let reactionMessageId = message.id;
    const reactionKey = getUserReactionKey(reactionMessageId);
    
    if (hasReacted.thumbsUp) {
      // If user already liked, switch to dislike
      onReaction(reactionMessageId, 'thumbsDown', 'thumbsUp'); // Add thumb down, remove thumb up
      const newReaction = { thumbsUp: false, thumbsDown: true };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    } else if (!hasReacted.thumbsDown) {
      // If no reaction yet, add dislike
      onReaction(reactionMessageId, 'thumbsDown', null);
      const newReaction = { thumbsUp: false, thumbsDown: true };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
    }
    // If already disliked, do nothing (can't un-dislike)
  };

  return (
    <div
      className={`absolute w-56 pointer-events-auto ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} message-bubble`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        transition: message.isPersistent ? 'opacity 0.3s ease, transform 0.3s ease' : `left ${animationDuration} linear, opacity 0.3s ease, transform 0.3s ease`,
        willChange: message.isPersistent ? 'opacity, transform' : 'left, opacity, transform'
      }}
    >
      <div className={`vibey-card bg-gradient-to-br ${bubbleGradient} border border-glass-border/30 hover:border-glass-highlight/50 transition-all duration-300 group relative overflow-hidden`}>
        
        {/* Vibey background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content container - reduced padding for compactness */}
        <div className="relative z-10 p-2">
          
          {/* Header with author and time - more compact */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
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

          {/* Message Content - responsive wrapping with better margins */}
          <div className="text-sm text-text-primary leading-snug mb-2" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap'
          }}>
            {message.text || 'No message content'}
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