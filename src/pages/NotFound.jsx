import React from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-panel p-8 text-center max-w-md w-full fade-in">
        <div className="mb-6">
          <Icon name="AlertTriangle" size={64} className="text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">404</h1>
          <p className="text-text-secondary">Page not found in the void</p>
        </div>
        
        <p className="text-text-secondary mb-6">
          The page you're looking for has drifted away like a message bubble...
        </p>
        
        <Link
          to="/main-chat-interface"
          className="glass-button inline-flex items-center gap-2 px-6 py-3 bg-primary/30 text-text-primary font-medium hover:bg-primary/40 transition-all duration-300"
        >
          <Icon name="Home" size={18} />
          Return to Chat
        </Link>
      </div>
    </div>
  );
};

export default NotFound;