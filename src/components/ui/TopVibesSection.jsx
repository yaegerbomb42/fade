import React from 'react';
import Icon from '../AppIcon';

const TopVibesSection = ({ vibes }) => {
  const renderVibe = (label, vibe) => (
    <div className="flex justify-between items-center text-xs py-1" key={label}>
      <span className="text-text-secondary">{label}</span>
      {vibe ? (
        <span className="text-right truncate flex-1 ml-2 text-text-primary">
          {vibe.text.slice(0, 20)}
          <span className="ml-1 text-success">👍 {vibe.reactions.thumbsUp}</span>
        </span>
      ) : (
        <span className="ml-2 text-text-secondary/50">No vibes</span>
      )}
    </div>
  );

  return (
    <div className="mt-4 pt-3 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Heart" size={14} className="text-accent" />
        <h4 className="text-xs font-medium text-text-secondary">Top Vibes</h4>
      </div>
      {renderVibe('1m', vibes.lastMinute)}
      {renderVibe('10m', vibes.last10Minutes)}
      {renderVibe('1h', vibes.lastHour)}
    </div>
  );
};

export default TopVibesSection;
