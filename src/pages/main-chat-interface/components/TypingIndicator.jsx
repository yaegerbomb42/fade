import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-interface fade-in">
      <div className="glass-panel px-4 py-3 bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-text-primary font-medium">
            Someone is typing in the void...
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;