// src/components/ui/ProfanityFilterToggle.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { getProfanityFilterSetting, setProfanityFilterSetting } from '../../utils/profanityFilter';

const ProfanityFilterToggle = () => {
  const [isEnabled, setIsEnabled] = useState(getProfanityFilterSetting());

  useEffect(() => {
    setProfanityFilterSetting(isEnabled);
  }, [isEnabled]);

  const toggleFilter = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="fixed top-4 left-4 z-interface" style={{ marginLeft: '200px' }}>
      <button
        onClick={toggleFilter}
        className={`glass-button px-3 py-2 text-sm flex items-center gap-2 transition-all duration-300 ${
          isEnabled ? 'bg-success/20 border-success/40' : 'bg-error/20 border-error/40'
        }`}
        title={isEnabled ? 'Content filter is ON - Click to disable' : 'Content filter is OFF - Click to enable'}
      >
        <Icon name="Shield" size={16} className={isEnabled ? 'text-success' : 'text-error'} />
        <span className="font-medium">{isEnabled ? 'Filter ON' : 'Filter OFF'}</span>
      </button>
    </div>
  );
};

export default ProfanityFilterToggle;
