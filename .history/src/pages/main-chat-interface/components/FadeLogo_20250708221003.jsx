// src/pages/main-chat-interface/components/FadeLogo.jsx
import React, { useState, useEffect } from 'react';

const FadeLogo = () => {
  const [showSlogan, setShowSlogan] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlogan(false);
    }, 5000); // Hide after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="fade-logo-container logo-small">
      <div className="c">
        <div className="l">F</div>
        <div className="l">A</div>
        <div className="l">D</div>
        <div className="l">E</div>
      </div>
      {showSlogan && (
        <div className="d text-xs transition-opacity duration-500 ease-out">
          Here now, gone forever
        </div>
      )}
    </section>
  );
};
export default FadeLogo;