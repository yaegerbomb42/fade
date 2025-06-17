import React, { useState, useEffect, useCallback } from 'react';

const BubbleAnimationManager = ({ messages, activeChannel }) => {
  const [bubbles, setBubbles] = useState([]);
  const [nextId, setNextId] = useState(1);

  const createBubble = useCallback((message) => {
    const bubble = {
      id: nextId,
      text: message.text,
      author: message.author,
      timestamp: message.timestamp,
      position: {
        top: Math.random() * 60 + 20, // 20% to 80% from top
        left: -20, // Start off-screen left
      },
      size: Math.random() * 0.2 + 0.9, // 0.9 to 1.1 scale (less variance)
      rotation: Math.random() * 10 - 5, // -5 to +5 degrees (minimal rotation)
      opacity: Math.random() * 0.2 + 0.8, // 0.8 to 1.0 opacity
      color: getRandomColor(),
      animationDuration: Math.random() * 5 + 30, // 30-35 seconds (slower animation)
    };
    
    setNextId(prev => prev + 1);
    return bubble;
  }, [nextId]);

  const getRandomColor = () => {
    const colors = [
      'from-primary/20 to-secondary/20',
      'from-secondary/20 to-accent/20',
      'from-accent/20 to-primary/20',
      'from-success/20 to-primary/20',
      'from-primary/20 to-success/20',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Add bubbles for user messages only - no ambient messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      // Only create bubble for user messages
      if (latestMessage.isUserMessage) {
        const newBubble = createBubble(latestMessage);
        
        setBubbles(prev => [...prev, newBubble]);

        // Remove bubble after animation completes
        setTimeout(() => {
          setBubbles(prev => prev.filter(bubble => bubble.id !== newBubble.id));
        }, newBubble.animationDuration * 1000);
      }
    }
  }, [messages, createBubble]);

  return (
    <div className="fixed inset-0 pointer-events-none z-bubbles overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute glass-panel p-4 max-w-xs bg-gradient-to-br ${bubble.color} border-glass-border/50 bubble-drift`}
          style={{
            top: `${bubble.position.top}%`,
            left: `${bubble.position.left}%`,
            transform: `scale(${bubble.size}) rotate(${bubble.rotation}deg)`,
            opacity: bubble.opacity,
            animationDuration: `${bubble.animationDuration}s`,
            animationDelay: '0s',
          }}
        >
          <div className="text-xs text-text-secondary mb-1 font-medium">
            {bubble.author}
          </div>
          <div className="text-sm text-text-primary leading-relaxed">
            {bubble.text}
          </div>
          <div className="text-xs text-text-secondary/70 mt-2 font-data">
            {bubble.timestamp.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BubbleAnimationManager;