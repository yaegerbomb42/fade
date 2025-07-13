import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const AuthModal = ({ isOpen, onClose, mode: initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please check your connection and try again.');
    }, 30000); // Increased to 30 seconds

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        console.log('Attempting to create account for:', username);
        await signUp(username, password);
        console.log('Account created successfully');
      } else {
        console.log('Attempting to sign in:', username);
        await signIn(username, password);
        console.log('Sign in successful');
      }
      
      clearTimeout(timeoutId);
      
      // Clear form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      
      // Close modal
      onClose();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Authentication error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-sm mx-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="X" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 glass-panel bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all rounded-lg text-sm"
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_-]+"
                title="Username can only contain letters, numbers, underscores, and hyphens"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 glass-panel bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all rounded-lg text-sm"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 glass-panel bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all rounded-lg text-sm"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className="glass-panel bg-red-500/20 border-red-500/30 p-2">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-2 px-4 bg-gradient-to-r from-primary to-secondary text-white font-medium hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-3 text-center">
            <p className="text-text-secondary text-sm">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={switchMode}
                disabled={loading}
                className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {mode === 'signin' && (
            <div className="mt-2 text-center">
              <button
                onClick={onClose}
                disabled={loading}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors disabled:opacity-50"
              >
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
