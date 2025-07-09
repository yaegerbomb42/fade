// src/components/ui/StatisticsPanel.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const StatisticsPanel = ({ activeChannel, messageCount, reactionStats = { totalLikes: 0, totalDislikes: 0, topMessages: [] } }) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    messagesPerMinute: 0,
    userSessionTime: '00:00',
    channelActivity: 1
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [channelStartTime, setChannelStartTime] = useState(Date.now());

  // Reset channel start time when channel changes
  useEffect(() => {
    if (activeChannel) {
      setChannelStartTime(Date.now());
    }
  }, [activeChannel]);

  // Update user session time and message stats
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate session time
      const sessionDuration = Date.now() - sessionStartTime;
      const minutes = Math.floor(sessionDuration / 60000);
      const seconds = Math.floor((sessionDuration % 60000) / 1000);
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Calculate channel activity based on messages in this channel session
      const channelDuration = (Date.now() - channelStartTime) / 60000; // in minutes
      const channelMessagesPerMin = channelDuration > 0 ? messageCount / channelDuration : 0;
      
      // Map channel activity to 1-5 scale based on realistic chat rates
      let channelActivity = 1;
      if (channelMessagesPerMin > 10) channelActivity = 5;
      else if (channelMessagesPerMin > 5) channelActivity = 4;
      else if (channelMessagesPerMin > 2) channelActivity = 3;
      else if (channelMessagesPerMin > 0.5) channelActivity = 2;
      
      setStats({
        totalMessages: messageCount || 0,
        messagesPerMinute: Math.round(channelMessagesPerMin * 10) / 10, // Round to 1 decimal
        userSessionTime: formattedTime,
        channelActivity: channelActivity
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messageCount, sessionStartTime, channelStartTime]);

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

  // Use channel activity from stats
  const activityLevel = stats.channelActivity;

  return (
    <div className="fixed top-6 right-6 z-interface">
      <div className="glass-panel p-4 w-48 fade-in vibey-bg glow-border">
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

            <div className="space-y-2">
              <StatItem
                icon="MessageSquare"
                label="Total Messages"
                value={stats.totalMessages.toLocaleString()}
                color="text-primary"
              />

              <StatItem
                icon="ThumbsUp"
                label="Total Likes"
                value={reactionStats.totalLikes}
                color="text-success"
              />

              <StatItem
                icon="ThumbsDown"
                label="Total Dislikes"
                value={reactionStats.totalDislikes}
                color="text-error"
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
            </div>

            <div className="mt-4 pt-3 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Channel Activity</span>
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
