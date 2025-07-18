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
    
    // Improved fallback positioning - always start from right side
    const lanes = 12; // Use 12 lanes like the highway system
    const laneHeight = 75 / lanes; // 75% usable height
    const topMargin = 12.5;
    const lane = index % lanes;
    const baseTop = topMargin + (lane * laneHeight) + (laneHeight / 2);
    const randomOffset = (Math.random() - 0.5) * 3; // Reduced offset for better lane discipline
    
    return {
      top: Math.max(15, Math.min(85, baseTop + randomOffset)), // Better bounds
      left: 105, // Start from right side of screen (just off visible area)
    };
  });
  const [isVisible, setIsVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('35s'); // Slower default duration
  const [hasReacted, setHasReacted] = useState({ thumbsUp: false, thumbsDown: false });
  const [flowSpeed, setFlowSpeed] = useState('message-flow');
  const [bubbleSize, setBubbleSize] = useState({ width: 'auto', height: 'auto' });

  // Calculate dynamic bubble size based on content
  const calculateBubbleSize = (text) => {
    const textLength = text.length;
    const lineCount = text.split('\n').length;
    
    // Base sizes
    const minWidth = 120; // Minimum width in pixels
    const maxWidth = 400; // Maximum width in pixels
    const baseHeight = 40; // Base height for single line
    
    // Calculate width based on text length
    const charBasedWidth = Math.min(maxWidth, minWidth + (textLength * 8));
    
    // Calculate height based on line count and estimated wrapping
    const estimatedLinesFromLength = Math.ceil(textLength / 30); // Rough estimate of wrapping
    const totalLines = Math.max(lineCount, estimatedLinesFromLength);
    const calculatedHeight = baseHeight + ((totalLines - 1) * 20);
    
    return {
      width: `${charBasedWidth}px`,
      height: `${calculatedHeight}px`,
      scale: Math.min(1.2, 0.8 + (textLength / 160)) // Scale factor based on content length
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

  // Calculate animation duration based on activity level with faster base speeds
  // activityLevel is expected to be a number between 1 and 5
  // Higher activityLevel means faster animation (shorter duration)
  useEffect(() => {
    // Clamp activityLevel between 1 and 5
    const clampedActivity = Math.min(Math.max(activityLevel, 1), 5);
    const minDuration = 8; // Faster minimum duration (was 15)
    const maxDuration = 20; // Faster maximum duration (was 45)
    
    // Content-based speed adjustment
    const messageLength = message.text ? message.text.length : 50;
    const lengthMultiplier = 1 + (messageLength / 400); // Reduced impact
    
    // Traffic-based speed adjustment
    const trafficMultiplier = totalMessages > 0 ? 1 + (totalMessages / 30) : 1;
    
    // Map activityLevel (1-5) to duration range inversely proportional to active messages count
    const baseDuration = maxDuration - ((clampedActivity - 1) / 4) * (maxDuration - minDuration);
    const adjustedDuration = baseDuration * lengthMultiplier * Math.min(trafficMultiplier, 1.5);
    
    setAnimationDuration(`${Math.min(adjustedDuration, 25)}s`); // Cap at 25 seconds (was 60)
  }, [activityLevel, totalMessages, message.text]);



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

    // Immediate show for better responsiveness - no sync delays
    setIsVisible(true);

    // Start movement immediately for right-to-left flow
    const finalLeft = -30; // Ensure complete exit off left side
    
    // Set initial position to right side if not already set
    setPosition(prev => {
      // If position is already valid (from constructor), keep top but ensure starts from right
      if (prev.left < 100) {
        return { ...prev, left: 105 }; // Reset to right side
      }
      return prev;
    });

    // Small delay to ensure position is set, then start animation
    const moveTimer = setTimeout(() => {
      setPosition(prev => {
        const newPosition = { ...prev, left: finalLeft };
        
        // Update parent tracking if callback provided
        if (message.onPositionUpdate) {
          message.onPositionUpdate(message.id, finalLeft);
        }
        
        return newPosition;
      });
    }, 50); // Very small delay just to ensure DOM update

    return () => {
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
      className={`absolute pointer-events-auto ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} message-bubble`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: bubbleSize.width,
        minWidth: '120px',
        maxWidth: '400px',
        transform: `scale(${bubbleSize.scale || 1})`,
        transition: message.isPersistent 
          ? 'opacity 0.3s ease, transform 0.3s ease' 
          : `left ${animationDuration} linear, opacity 0.3s ease, transform 0.3s ease`,
        willChange: message.isPersistent ? 'opacity, transform' : 'left, opacity, transform',
        zIndex: 10 + index // Ensure proper layering
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
              <span 
                className={`text-xs font-medium text-text-primary ${
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
                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 rounded text-xs font-bold">
                  L{message.authorData.level || 1}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary/60 font-mono">
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour12: true,
                  hour: 'numeric',
                  minute: '2-digit',
                }) : 'Unknown time'}
              </span>
            </div>
          </div>

          {/* Message Content - responsive wrapping with better margins */}
          <div className="text-sm text-text-primary leading-snug mb-2" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap'
          }}>
            {renderMessageContent()}
          </div>

          {/* Reaction bar - easier to click, always visible */}
          <div className="flex items-center justify-between">
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
            
            {/* Report button - only show for signed-in users and not own messages */}
            {message.authorData?.isSignedIn && message.authorData.username !== (isSignedIn ? user?.username : null) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReportClick) {
                    onReportClick(message.authorData.username);
                  }
                }}
                className="text-text-secondary hover:text-red-400 transition-colors p-1"
                title="Report user"
              >
                <span className="text-xs">!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;