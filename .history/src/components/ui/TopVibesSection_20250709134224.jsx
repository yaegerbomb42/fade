import React from 'react';
import Icon from '../AppIcon';

const TopVibersSection = ({ vibers }) => {
  const renderVriber = (label, vriber) => (
    <div className="flex justify-between items-center text-xs py-1" key={label}>
      <span className="text-text-secondary">{label}</span>
      {vriber ? (
        <div className="text-right truncate flex-1 ml-2">
          <span className="text-text-primary font-medium">{vriber.author}</span>
          <span className="ml-1 text-accent">({vriber.count} messages)</span>
        </div>
      ) : (
        <span className="ml-2 text-text-secondary/50">No activity</span>
      )}
    </div>
  );

  return (
    <div className="mt-4 pt-3 border-t border-glass-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Users" size={14} className="text-accent" />
        <h4 className="text-xs font-medium text-text-secondary">Top Vibers</h4>
      </div>
      {renderVriber('1m', vibers.lastMinute)}
      {renderVriber('10m', vibers.last10Minutes)}
      {renderVriber('1h', vibers.lastHour)}
    </div>
  );
};

export default TopVibersSection;
