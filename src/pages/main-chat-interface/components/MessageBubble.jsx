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
  
  // Enhanced server-synchronized positioning for consistent "fade world" experience
  const calculateCurrentPosition = () => {
    // Priority 1: Use synchronized position from main interface if available
    if (message.currentPosition) {
      return {
        top: message.currentPosition.top,
        left: message.currentPosition.left,
        isExpired: message.currentPosition.isExpired
      };
    }
    
    // Priority 2: Calculate from stored position data (matches main interface exactly)
    const positionData = message.position || message.originalPosition;
    if (positionData && positionData.spawnTime) {
      const now = Date.now();
      const messageAge = now - positionData.spawnTime;
      const maxAge = 45000; // Match REGULAR_MESSAGE_FLOW_DURATION
      
      // If message is too old, it should be off-screen
      if (messageAge > maxAge) {
        return { top: positionData.top, left: -50, isExpired: true };
      }
      
      // Calculate progress through animation (0 = just spawned, 1 = fully traversed)
      const progress = Math.min(messageAge / 45000, 1); // 45 seconds duration
      
      // Enhanced easing for professional movement (matches main interface)
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4); // Smoother professional easing
      const easedProgress = easeOutQuart(progress);
      
      // Calculate current position (exact same coordinates as main interface)
      const startX = 105;
      const endX = -35;
      const currentX = startX - (easedProgress * (startX - endX));
      
      return {
        top: positionData.top,
        left: currentX,
        progress: progress,
        isExpired: progress >= 1
      };
    }
    
    // Priority 3: Generate deterministic position for messages without position data
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const messageAge = now - messageTime;
    
    // Generate deterministic position using message timestamp (matches main interface)
    const timeSeed = Math.floor(messageTime / 1000);
    const combinedSeed = (timeSeed + (index || 0)) * 9301 + 49297;
    const pseudoRandom = (combinedSeed % 233280) / 233280;
    
    const lanes = 10; // Match main interface lane count
    const laneHeight = 70 / lanes; // 70% usable height
    const topMargin = 15;
    const lane = Math.floor(pseudoRandom * lanes);
    const laneCenter = topMargin + lane * laneHeight + laneHeight / 2;
    const randomOffset = (pseudoRandom - 0.5) * 1.5; // Reduced for professional alignment
    
    // Calculate progress and position
    const progress = Math.min(Math.max(0, messageAge / 45000), 1);
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    const easedProgress = easeOutQuart(progress);
    
    const startX = 105;
    const endX = -35;
    const currentX = startX - (easedProgress * (startX - endX));
    
    return {
      top: Math.max(12, Math.min(83, laneCenter + randomOffset)), // Match main interface bounds
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
    
    // More compact base sizes for better screen usage
    const minWidth = 120; // Compact minimum width
    const maxWidth = 350; // Reasonable maximum width
    const baseHeight = 40; // Compact base height
    
    // Calculate width based on text length - more efficient sizing
    const charBasedWidth = Math.min(maxWidth, minWidth + (textLength * 8));
    
    // Calculate height based on line count and estimated wrapping
    const estimatedLinesFromLength = Math.ceil(textLength / 30); // Better wrapping estimate
    const totalLines = Math.max(lineCount, estimatedLinesFromLength);
    const calculatedHeight = baseHeight + ((totalLines - 1) * 20); // Better line spacing
    
    return {
      width: `${charBasedWidth}px`,
      height: `${calculatedHeight}px`,
      scale: Math.min(1.0, 0.8 + (textLength / 200)) // More reasonable scale
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



  // Enhanced position synchronization with optimized update intervals
  useEffect(() => {
    // Always use synchronized positioning - no local animation overrides
    const updatePosition = () => {
      const newPosition = calculateCurrentPosition();
      setPosition(newPosition);
      
      // If message is expired, trigger removal with slight delay for smooth exit
      if (newPosition.isExpired) {
        setTimeout(() => {
          onRemove && onRemove(message.id);
        }, 500); // Reduced delay for quicker cleanup
      }
    };
    
    // Initial position update
    updatePosition();
    setIsVisible(true);
    
    // Update position every 2 seconds for smooth synchronized movement and better performance
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
        minWidth: '120px', // Compact minimum width
        maxWidth: '350px', // Reasonable maximum width
        transform: `scale(${bubbleSize.scale || 1})`,
        transition: 'left 2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, transform 0.3s ease', // Enhanced smooth transitions
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
        
        {/* Content container - compact padding */}
        <div className="relative z-10 p-2">
          
          {/* Header with author and time - compact spacing */}
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
                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 py-0.5 rounded text-xs font-bold">
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

          {/* Message Content - compact text sizing and spacing */}
          <div className="text-sm text-text-primary leading-snug mb-2" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap'
          }}>
            {renderMessageContent()}
          </div>

          {/* Reaction bar - compact, easier to click */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                className={`vibey-reaction-btn like-btn ${hasReacted.thumbsUp ? 'reacted-up' : 'unreacted'} px-2 py-1`}
                onClick={handleThumbsUp}
                title="Like this vibe"
              >
                <span className="text-sm">👍</span>
                <span className="text-xs font-mono ml-1">{message.reactions?.thumbsUp || 0}</span>
              </button>
              
              <button
                className={`vibey-reaction-btn dislike-btn ${hasReacted.thumbsDown ? 'reacted-down' : 'unreacted'} px-2 py-1`}
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