// src/components/ui/ChannelSelector.jsx
import React, { useState } from 'react';
import Icon from '../AppIcon';

const ChannelSelector = ({ onChannelChange, activeChannel }) => {
  const [customChannel, setCustomChannel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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
    <div className="fixed top-36 left-1/2 transform -translate-x-1/2 z-interface">
      <div className="glass-panel px-6 py-4 fade-in vibey-bg">
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {defaultChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelSelect(channel)}
              className={`glass-button px-4 py-2 text-sm font-medium transition-all duration-300 ${activeChannel?.id === channel.id ? 'bg-primary/40 text-text-primary border-primary/50' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <div className="flex items-center gap-2">
                <span># {channel.name}</span>
                <span className="text-xs opacity-70 font-data">
                  {channel.users}
                </span>
              </div>
            </button>
          ))}
          
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="glass-button px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-all duration-300"
            >
              <Icon name="Plus" size={16} className="mr-1" />
              Custom
            </button>
          ) : (
            <form onSubmit={handleCustomChannelSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                placeholder="Channel name"
                className="glass-panel px-3 py-2 text-sm bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all duration-300"
                autoFocus
                maxLength={20}
              />
              <button
                type="submit"
                className="glass-button px-3 py-2 text-success hover:bg-success/20 transition-all duration-300"
              >
                <Icon name="Check" size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomChannel('');
                }}
                className="glass-button px-3 py-2 text-error hover:bg-error/20 transition-all duration-300"
              >
                <Icon name="X" size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelSelector;