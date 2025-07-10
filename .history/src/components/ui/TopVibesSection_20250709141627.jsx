import React from 'react';
import Icon from '../AppIcon';

const TopVibesSection = ({ vibes }) => {
  const renderVibe = (label, vibe) => (
    <div className="flex justify-between items-center text-xs py-0.5" key={label}>
      <span className="text-text-secondary text-xs">{label}</span>
      {vibe ? (
        <span className="text-right truncate flex-1 ml-1 text-text-primary text-xs">
          {vibe.text.slice(0, 15)}...
          <span className="ml-1 text-success text-xs">👍 {vibe.reactions.thumbsUp}</span>
        </span>
      ) : (
        <span className="ml-1 text-text-secondary/50 text-xs">No vibes</span>
      )}
    </div>
  );

  return (
    <div className="glass-panel p-2 w-36">
      <div className="flex items-center gap-1 mb-1">
        <Icon name="Heart" size={10} className="text-accent" />
        <h4 className="text-xs font-medium text-text-secondary">Top Vibes</h4>
      </div>
      {renderVibe('1m', vibes.lastMinute)}
      {renderVibe('10m', vibes.last10Minutes)}
      {renderVibe('1h', vibes.lastHour)}
    </div>
  );
};

const TopVibersSection = ({ vibers }) => {
  const renderVriber = (label, vriber) => (
    <div className="flex justify-between items-center text-xs py-0.5" key={label}>
      <span className="text-text-secondary text-xs">{label}</span>
      {vriber ? (
        <div className="text-right truncate flex-1 ml-1">
          <span className="text-text-primary font-medium text-xs">{vriber.author.slice(0, 8)}</span>
          <span className="ml-1 text-accent text-xs">({vriber.count})</span>
        </div>
      ) : (
        <span className="ml-1 text-text-secondary/50 text-xs">No activity</span>
      )}
    </div>
  );

  return (
    <div className="glass-panel p-2 w-36">
      <div className="flex items-center gap-1 mb-1">
        <Icon name="Users" size={10} className="text-accent" />
        <h4 className="text-xs font-medium text-text-secondary">Top Vibers</h4>
      </div>
      {renderVriber('1m', vibers.lastMinute)}
      {renderVriber('10m', vibers.last10Minutes)}
      {renderVriber('1h', vibers.lastHour)}
    </div>
  );
};

export { TopVibesSection, TopVibersSection };
