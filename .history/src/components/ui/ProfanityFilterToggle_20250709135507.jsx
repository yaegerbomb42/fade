// src/components/ui/ProfanityFilterToggle.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { getProfanityFilterSetting, setProfanityFilterSetting } from '../../utils/profanityFilter';

const ProfanityFilterToggle = () => {
  const [isEnabled, setIsEnabled] = useState(getProfanityFilterSetting());
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setProfanityFilterSetting(isEnabled);
  }, [isEnabled]);

  const toggleFilter = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="fixed top-4 left-4 z-interface" style={{ marginLeft: '200px' }}>
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className={`glass-button px-3 py-2 text-sm flex items-center gap-2 transition-all duration-300 ${
            isEnabled ? 'bg-success/20 border-success/40' : 'bg-error/20 border-error/40'
          }`}
        >
          <Icon name="Shield" size={16} className={isEnabled ? 'text-success' : 'text-error'} />
          <span className="font-medium">{isEnabled ? 'Filter ON' : 'Filter OFF'}</span>
        </button>
      ) : (
        <div className="glass-panel p-4 fade-in min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary">Content Filter</h3>
            <button
              onClick={() => setCollapsed(true)}
              className="glass-button px-2 py-1 text-text-secondary hover:text-text-primary"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Filter profanity and inappropriate content from your view
            </p>
            
            <button
              onClick={toggleFilter}
              className={`w-full glass-button px-3 py-2 text-sm flex items-center justify-between transition-all duration-300 ${
                isEnabled 
                  ? 'bg-success/30 border-success/50 text-success' 
                  : 'bg-error/30 border-error/50 text-error'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={16} />
                <span className="font-medium">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isEnabled ? 'border-success bg-success' : 'border-error'
              }`}>
                {isEnabled && <Icon name="Check" size={10} className="text-white" />}
              </div>
            </button>
            
            <p className="text-xs text-text-secondary/70">
              {isEnabled 
                ? 'Bad words will be replaced with ****' 
                : 'All content will be shown as-is'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfanityFilterToggle;
