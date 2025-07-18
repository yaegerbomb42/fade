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
  
  // Server-synchronized positioning - calculate current position based on message timestamp
  const calculateCurrentPosition = () => {
    // Use synchronized position calculation that matches the main interface
    if (message.currentPosition) {
      return {
        top: message.currentPosition.top,
        left: message.currentPosition.left
      };
    }
    
    // If message has stored position with spawn time, calculate current position using exact same algorithm as main interface
    if (message.position && message.position.spawnTime) {
      const now = Date.now();
      const messageAge = now - message.position.spawnTime;
      const maxAge = 240000; // 4 minutes max age for messages
      
      // If message is too old, it should be off-screen
      if (messageAge > maxAge) {
        return { top: message.position.top, left: -50, isExpired: true };
      }
      
      // Calculate progress through animation (0 = just spawned, 1 = fully traversed)
      const animationDuration = 180000; // 3 minutes base duration for maximum stability
      const progress = Math.min(messageAge / animationDuration, 1);
      
      // Smooth easing for natural movement - exact same as main interface
      const easeOut = (t) => 1 - Math.pow(1 - t, 2.5);
      const easedProgress = easeOut(progress);
      
      // Calculate current position - exact same as main interface
      const startX = 105;
      const endX = -30;
      const currentX = startX - (easedProgress * (startX - endX));
      
      return {
        top: message.position.top,
        left: currentX,
        progress: progress,
        isExpired: progress >= 1
      };
    }
    
    // For messages without position data, generate deterministic position using same algorithm as main interface
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const messageAge = now - messageTime;
    
    // Generate deterministic position using message timestamp (same as main interface)
    const timeSeed = Math.floor(messageTime / 1000); // Use seconds for stability
    const combinedSeed = (timeSeed + index) * 9301 + 49297;
    const pseudoRandom = (combinedSeed % 233280) / 233280;
    
    const lanes = 12;
    const laneHeight = 75 / lanes; // 75% usable height
    const topMargin = 12.5;
    const lane = Math.floor(pseudoRandom * lanes);
    const laneCenter = topMargin + lane * laneHeight + laneHeight / 2;
    const randomOffset = (pseudoRandom - 0.5) * 4; // Deterministic offset
    
    // Calculate progress and position
    const animationDuration = 180000; // 3 minutes
    const progress = Math.min(Math.max(0, messageAge / animationDuration), 1);
    const easeOut = (t) => 1 - Math.pow(1 - t, 2.5);
    const easedProgress = easeOut(progress);
    
    const startX = 105;
    const endX = -30;
    const currentX = startX - (easedProgress * (startX - endX));
    
    return {
      top: Math.max(15, Math.min(85, laneCenter + randomOffset)),
      left: currentX,
      progress: progress,
      isExpired: progress >= 1
    };
  };
  
  const [position, setPosition] = useState(calculateCurrentPosition);
  const [isVisible, setIsVisible] = useState(false);
  const [hasReacted, setHasReacted] = useState({ thumbsUp: false, thumbsDown: false });
  const [bubbleSize, setBubbleSize] = useState({ width: 'auto', height: 'auto' });

  // Calculate dynamic bubble size based on content
  const calculateBubbleSize = (text) => {
    const textLength = text.length;
    const lineCount = text.split('\n').length;
    
    // Base sizes - increased for better readability
    const minWidth = 180; // Increased minimum width for better readability
    const maxWidth = 500; // Increased maximum width for longer messages
    const baseHeight = 60; // Increased base height for better text spacing
    
    // Calculate width based on text length - more generous sizing
    const charBasedWidth = Math.min(maxWidth, minWidth + (textLength * 10));
    
    // Calculate height based on line count and estimated wrapping
    const estimatedLinesFromLength = Math.ceil(textLength / 25); // Better wrapping estimate
    const totalLines = Math.max(lineCount, estimatedLinesFromLength);
    const calculatedHeight = baseHeight + ((totalLines - 1) * 24); // Better line spacing
    
    return {
      width: `${charBasedWidth}px`,
      height: `${calculatedHeight}px`,
      scale: Math.min(1.4, 0.9 + (textLength / 140)) // Increased scale for better visibility
    };
  };

  // Update bubble size when message changes
  useEffect(() => {
    if (message && message.text) {
      const size = calculateBubbleSize(message.text);
      setBubbleSize(size);
    }
  }, [message.text]);

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

  // Render message content with mentions parsed
  const renderMessageContent = () => {
    const parts = parseMessageWithMentions(message.text);
    return parts.map((part, idx) => {
      if (part.type === 'mention') {
        return (
          <span key={idx} className="text-accent cursor-pointer hover:underline">
            {part.content}
          </span>
        );
      }
      return <span key={idx}>{part.content}</span>;
    });
  };

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



  // Update position when message.currentPosition changes or every 2 seconds for synchronization
  useEffect(() => {
    // Always use synchronized positioning - no local animation overrides
    const updatePosition = () => {
      const newPosition = calculateCurrentPosition();
      setPosition(newPosition);
      
      // If message is expired, trigger removal
      if (newPosition.isExpired) {
        setTimeout(() => {
          onRemove && onRemove(message.id);
        }, 1000); // Small delay to allow for smooth exit
      }
    };
    
    // Initial position update
    updatePosition();
    setIsVisible(true);
    
    // Update position every 2 seconds for smooth synchronized movement
    const positionInterval = setInterval(updatePosition, 2000);
    
    return () => {
      clearInterval(positionInterval);
    };
  }, [message, message.currentPosition]); // React to currentPosition changes from main interface



  const handleThumbsUp = async (e) => {
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
      
      // Update stats for message author
      if (message.authorData?.isSignedIn && updateUserStats) {
        await updateUserStats(0, 1, -1); // +1 like, -1 dislike
      }
    } else if (!hasReacted.thumbsUp) {
      // If no reaction yet, add like
      onReaction(reactionMessageId, 'thumbsUp', null);
      const newReaction = { thumbsUp: true, thumbsDown: false };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
      
      // Update stats for message author
      if (message.authorData?.isSignedIn && updateUserStats) {
        await updateUserStats(0, 1, 0); // +1 like
      }
    }
    // If already liked, do nothing (can't unlike)
  };

  const handleThumbsDown = async (e) => {
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
      
      // Update stats for message author
      if (message.authorData?.isSignedIn && updateUserStats) {
        await updateUserStats(0, -1, 1); // -1 like, +1 dislike
      }
    } else if (!hasReacted.thumbsDown) {
      // If no reaction yet, add dislike
      onReaction(reactionMessageId, 'thumbsDown', null);
      const newReaction = { thumbsUp: false, thumbsDown: true };
      setHasReacted(newReaction);
      localStorage.setItem(reactionKey, JSON.stringify(newReaction));
      
      // Update stats for message author
      if (message.authorData?.isSignedIn && updateUserStats) {
        await updateUserStats(0, 0, 1); // +1 dislike
      }
    }
    // If already disliked, do nothing (can't un-dislike)
  };

  return (
    <div
      className={`absolute pointer-events-auto message-bubble ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: bubbleSize.width,
        minWidth: '180px', // Increased minimum width
        maxWidth: '500px', // Increased maximum width
        transform: `scale(${bubbleSize.scale || 1})`,
        transition: 'left 2s ease-out, opacity 0.3s ease, transform 0.3s ease',
        willChange: 'left, opacity, transform',
        zIndex: 100 + index, // High z-index to ensure visibility
        position: 'fixed' // Ensure fixed positioning for screen flow
      }}
      onMouseEnter={() => {}} // No pause functionality needed with synchronized positioning
      onMouseLeave={() => {}} // No pause functionality needed with synchronized positioning
    >
      <div className={`vibey-card bg-gradient-to-br ${bubbleGradient} border border-glass-border/30 hover:border-glass-highlight/50 transition-all duration-300 group relative overflow-hidden`}>
        
        {/* Vibey background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Content container - increased padding for better readability */}
        <div className="relative z-10 p-3">
          
          {/* Header with author and time - improved spacing */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {(message.author || 'Anonymous').charAt(0).toUpperCase()}
                </span>
              </div>
              <span 
                className={`text-sm font-medium text-text-primary ${
                  message.authorData?.isSignedIn ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUserClick && message.authorData?.isSignedIn && message.authorData?.username) {
                    onUserClick(message.authorData.username);
                  }
                }}
                title={message.authorData?.isSignedIn ? 'View profile' : ''}
              >
                {message.author || 'Anonymous'}
              </span>
              {message.authorData?.isSignedIn && (
                <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded text-sm font-bold">
                  L{message.authorData.level || 1}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-text-secondary/60 font-mono">
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour12: true,
                  hour: 'numeric',
                  minute: '2-digit',
                }) : 'Unknown time'}
              </span>
            </div>
          </div>

          {/* Message Content - better text sizing and spacing */}
          <div className="text-base text-text-primary leading-relaxed mb-3" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap'
          }}>
            {renderMessageContent()}
          </div>

          {/* Reaction bar - larger, easier to click, always visible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className={`vibey-reaction-btn like-btn ${hasReacted.thumbsUp ? 'reacted-up' : 'unreacted'} px-3 py-2`}
                onClick={handleThumbsUp}
                title="Like this vibe"
              >
                <span className="text-lg">👍</span>
                <span className="text-sm font-mono ml-2">{message.reactions?.thumbsUp || 0}</span>
              </button>
              
              <button
                className={`vibey-reaction-btn dislike-btn ${hasReacted.thumbsDown ? 'reacted-down' : 'unreacted'} px-3 py-2`}
                onClick={handleThumbsDown}
                title="Not feeling this vibe"
              >
                <span className="text-lg">👎</span>
                <span className="text-sm font-mono ml-2">{message.reactions?.thumbsDown || 0}</span>
              </button>
            </div>
            
            {/* Report button - only show for signed-in users and not own messages */}
            {message.authorData?.isSignedIn && message.authorData.username !== (isSignedIn ? user?.username : null) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReportClick) {
                    onReportClick(message.authorData.username);
                  }
                }}
                className="text-text-secondary hover:text-red-400 transition-colors p-2"
                title="Report user"
              >
                <span className="text-sm">!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;