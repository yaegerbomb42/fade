// src/pages/main-chat-interface/components/MessageBubble.jsx
import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

const MessageBubble = ({ message, index, onReaction, activityLevel = 1 }) => {
  // Randomize starting and ending horizontal positions
  const [position, setPosition] = useState({
    top: Math.random() * 60 + 20, // 20% to 80% from top
    left: 100 + Math.random() * 20, // Start off-screen to the right (100% to 120%)
  });
  const [isVisible, setIsVisible] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('15s'); // Default duration
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

  // Calculate animation duration based on activity level
  // activityLevel is expected to be a number between 1 and 5
  // Higher activityLevel means faster animation (shorter duration)
  useEffect(() => {
    const minDuration = 10; // Minimum duration in seconds
    const maxDuration = 30; // Maximum duration in seconds
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
      className={`absolute max-w-xs pointer-events-auto ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} message-bubble`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        transition: `left ${animationDuration} linear, opacity 0.3s ease, transform 0.3s ease`,
        willChange: 'left, opacity, transform'
      }}
    >
      <div className={`glass-panel p-4 bg-gradient-to-br ${bubbleGradient} border-glass-border/50 hover:border-glass-highlight transition-all duration-300 group relative`}>
        {/* Reaction areas with larger click targets and visual feedback */}
        <div 
          className="absolute inset-0 w-1/2 h-full cursor-pointer hover:bg-glass-highlight/20 transition-colors"
          onClick={handleThumbsDown}
          title="Dislike"
        ></div>
        <div 
          className="absolute inset-0 left-1/2 w-1/2 h-full cursor-pointer hover:bg-glass-highlight/20 transition-colors"
          onClick={handleThumbsUp}
          title="Like"
        ></div>

        {/* Author */}
        <div className="flex items-center justify-between mb-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {message.author.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium text-text-primary">
              {message.author}
            </span>
          </div>
          <span className="text-xs text-text-secondary/70 font-data">
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Message Content */}
        <div className="text-sm text-text-primary leading-relaxed mb-3 pointer-events-none">
          {message.text}
        </div>

        {/* Reactions Indicators (visual only, not clickable) */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <div className={`glass-button px-2 py-1 text-xs flex items-center gap-1 transition-all duration-300 ${hasReacted.thumbsUp ? 'bg-success/30 text-success border-success/50' : 'text-text-secondary'}`}>
              <span>👍</span>
              <span className="font-data">{message.reactions.thumbsUp}</span>
            </div>
            
            <div className={`glass-button px-2 py-1 text-xs flex items-center gap-1 transition-all duration-300 ${hasReacted.thumbsDown ? 'bg-error/30 text-error border-error/50' : 'text-text-secondary'}`}>
              <span>👎</span>
              <span className="font-data">{message.reactions.thumbsDown}</span>
            </div>
          </div>

          {/* Drift indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Icon name="Wind" size={12} className="text-text-secondary/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;