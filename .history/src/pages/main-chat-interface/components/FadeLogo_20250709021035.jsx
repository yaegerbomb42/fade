// src/pages/main-chat-interface/components/FadeLogo.jsx
import React, { useState, useEffect } from 'react';

const FadeLogo = () => {
  const [showSlogan, setShowSlogan] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Start fading out after 3 seconds, complete fade by 5 seconds
    const fadeTimer = setTimeout(() => {
      setShowSlogan(false);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <section className="fade-logo-container logo-small">
      <div className="c">
        <div className="l">F</div>
        <div className="l">A</div>
        <div className="l">D</div>
        <div className="l">E</div>
      </div>
      {isInitialLoad && (
        <div className={`slogan-container ${showSlogan ? 'visible' : 'fading'}`}>
          <div className="slogan-text">
            here now, gone forever
          </div>
        </div>
      )}
      
      {/* Made by @yaeger credit */}
      <div className={`credit-container ${showSlogan ? 'visible' : 'fading'}`}>
        <div className="credit-text">
          made by @yaeger
        </div>
      </div>
    </section>
  );
};

export default FadeLogo;