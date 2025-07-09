// src/components/ui/ChannelSelector.jsx
import React, { useState } from 'react';
import Icon from '../AppIcon';

const ChannelSelector = ({ onChannelChange, activeChannel, channelUserCounts = {} }) => {
  const [customChannel, setCustomChannel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const defaultChannels = [
    { id: 'vibes', name: 'Just Vibes' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'movies', name: 'Movies' },
    { id: 'sports', name: 'Sports' },
    { id: 'family-friendly', name: 'Family Friendly' },
    { id: 'random-chat', name: 'Random Chat' },
    { id: 'just-chatting', name: 'Just Chatting' },
    { id: 'music', name: 'Music' },
    { id: 'late-night', name: 'Late Night' }
  ];

  const handleChannelSelect = (channel) => {
    onChannelChange(channel);
    setShowCustomInput(false);
    setCollapsed(true);
  };

  const handleCustomChannelSubmit = (e) => {
    e.preventDefault();
    if (customChannel.trim()) {
      const newChannel = {
        id: customChannel.toLowerCase().replace(/\s+/g, '-'),
        name: customChannel.trim()
      };
      onChannelChange(newChannel);
      setCustomChannel('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-interface">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="glass-button px-3 py-2 text-sm flex items-center gap-1"
        >
          <Icon name="Menu" size={16} />
          <span className="font-data">{activeChannel?.name || 'Select Channel'}</span>
        </button>
      ) : (
        <div className="glass-panel p-4 w-52 space-y-2 fade-in">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-text-primary mb-1 text-center">Choose Your Vibe</h3>
            <p className="text-xs text-text-secondary opacity-80 text-center">Join others doing the same thing</p>
          </div>
          {defaultChannels
            .map(channel => ({
              ...channel,
              userCount: channelUserCounts[channel.id] || 0
            }))
            .sort((a, b) => b.userCount - a.userCount) // Sort by user count descending
            .map((channel) => {
            return (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={`glass-button w-full px-3 py-2.5 text-sm flex items-center justify-between transition-all duration-300 ${activeChannel?.id === channel.id ? 'bg-primary/40 text-text-primary border-primary/50' : 'text-text-secondary hover:text-text-primary hover:bg-glass-highlight'}`}
              >
                <span className="font-medium">{channel.name}</span>
                {channel.userCount > 0 && (
                  <span className="text-xs opacity-70 font-mono bg-white/10 px-2 py-1 rounded-full">
                    {channel.userCount}
                  </span>
                )}
              </button>
            );
          })}

          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="glass-button w-full px-2 py-1 text-sm font-medium text-accent hover:text-accent/80 transition-all duration-300"
            >
              <Icon name="Plus" size={16} className="mr-1" />
              Custom
            </button>
          ) : (
            <form onSubmit={handleCustomChannelSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                placeholder="Channel name"
                className="glass-panel flex-1 px-2 py-1 text-sm bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all duration-300"
                autoFocus
                maxLength={20}
              />
              <button
                type="submit"
                className="glass-button px-2 py-1 text-success hover:bg-success/20 transition-all duration-300"
              >
                <Icon name="Check" size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomChannel('');
                }}
                className="glass-button px-2 py-1 text-error hover:bg-error/20 transition-all duration-300"
              >
                <Icon name="X" size={14} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default ChannelSelector;