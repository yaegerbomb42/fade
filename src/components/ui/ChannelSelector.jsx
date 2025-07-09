// src/components/ui/ChannelSelector.jsx
import React, { useState } from 'react';
import Icon from '../AppIcon';

const ChannelSelector = ({ onChannelChange, activeChannel }) => {
  const [customChannel, setCustomChannel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const defaultChannels = [
    { id: 'general', name: 'General', users: 42 },
    { id: 'random', name: 'Random', users: 28 },
    { id: 'tech', name: 'Tech Talk', users: 15 },
    { id: 'gaming', name: 'Gaming', users: 67 },
    { id: 'music', name: 'Music', users: 23 }
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
        name: customChannel.trim(),
        users: Math.floor(Math.random() * 50) + 1
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
          <span className="font-data"># {activeChannel?.name}</span>
        </button>
      ) : (
        <div className="glass-panel p-3 w-40 space-y-2 fade-in">
          {defaultChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelSelect(channel)}
              className={`glass-button w-full px-2 py-1 text-sm flex justify-between items-center transition-all duration-300 ${activeChannel?.id === channel.id ? 'bg-primary/40 text-text-primary border-primary/50' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <span># {channel.name}</span>
              <span className="text-xs opacity-70 font-data">{channel.users}</span>
            </button>
          ))}

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