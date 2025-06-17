// src/components/ui/StatisticsPanel.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const StatisticsPanel = ({ activeChannel, messageCount }) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    messagesPerMinute: 0,
    userSessionTime: '00:00'
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [sessionStartTime] = useState(Date.now());

  // Update user session time and message stats
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate session time
      const sessionDuration = Date.now() - sessionStartTime;
      const minutes = Math.floor(sessionDuration / 60000);
      const seconds = Math.floor((sessionDuration % 60000) / 1000);
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Calculate messages per minute based on actual message count
      // We're using an arbitrary time window of 1 minute for this calculation
      const messagesPerMin = messageCount ? Math.ceil((messageCount / (sessionDuration / 60000))) : 0;
      
      setStats({
        totalMessages: messageCount || 0,
        messagesPerMinute: messagesPerMin,
        userSessionTime: formattedTime
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messageCount, sessionStartTime]);

  const StatItem = ({ icon, label, value, color = 'text-text-secondary' }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={16} className={color} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className={`text-sm font-data font-medium ${color}`}>
        {value}
      </span>
    </div>
  );

  // Calculate actual activity level
  const activityLevel = Math.min(5, Math.ceil(stats.messagesPerMinute / 2));

  return (
    <div className="fixed top-6 right-6 z-interface">
      <div className="glass-panel p-4 w-64 fade-in vibey-bg glow-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            <h3 className="text-sm font-heading font-semibold text-text-primary">
              Channel Stats
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass-button p-1 hover:bg-glass-highlight transition-all duration-300"
          >
            <Icon 
              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
              size={16} 
              className="text-text-secondary" 
            />
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-1 slide-up">
            {activeChannel && (
              <div className="mb-3 pb-3 border-b border-glass-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-text-primary">
                    # {activeChannel.name}
                  </span>
                </div>
              </div>
            )}

            <StatItem
              icon="MessageSquare"
              label="Total Messages"
              value={stats.totalMessages.toLocaleString()}
              color="text-primary"
            />

            <StatItem
              icon="Activity"
              label="Messages/Min"
              value={stats.messagesPerMinute}
              color="text-accent"
            />

            <StatItem
              icon="Clock"
              label="Your Session Time"
              value={stats.userSessionTime}
              color="text-success"
            />

            <div className="mt-4 pt-3 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Activity Level</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < activityLevel ? 'bg-success' : 'bg-glass-border'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPanel;