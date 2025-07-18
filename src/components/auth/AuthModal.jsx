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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, passed: [], failed: [] });
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = [
      { test: /.{8,}/, message: 'At least 8 characters' },
      { test: /[A-Z]/, message: 'Uppercase letter' },
      { test: /[a-z]/, message: 'Lowercase letter' },
      { test: /[0-9]/, message: 'Number' },
      { test: /[^A-Za-z0-9]/, message: 'Special character' }
    ];
    
    const passed = checks.filter(check => check.test.test(password));
    const failed = checks.filter(check => !check.test.test(password));
    
    return {
      score: passed.length,
      passed: passed.map(check => check.message),
      failed: failed.map(check => check.message)
    };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (mode === 'signup' && password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, passed: [], failed: [] });
    }
  }, [password, mode]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setLoading(false);
      setLoadingMessage('');
      setPasswordStrength({ score: 0, passed: [], failed: [] });
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Enhanced validation
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (passwordStrength.score < 3) {
        setError('Password must meet at least 3 security requirements');
        setLoading(false);
        return;
      }
      
      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        setLoading(false);
        return;
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError('Username can only contain letters, numbers, underscores, and hyphens');
        setLoading(false);
        return;
      }
    }

    // Set a maximum loading time to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setLoadingMessage('');
      setError('Operation is taking too long. Please try again.');
    }, 15000);

    try {
      if (mode === 'signup') {
        setLoadingMessage('Creating your account...');
        
        // Add a small delay to show the loading message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await signUp(username, password);
        setLoadingMessage('Account created successfully!');
      } else {
        setLoadingMessage('Signing you in...');
        
        // Add a small delay to show the loading message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await signIn(username, password);
        setLoadingMessage('Welcome back!');
      }
      
      // Clear the timeout since operation completed
      clearTimeout(loadingTimeout);
      
      // Clear form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setLoadingMessage('');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      clearTimeout(loadingTimeout);
      setLoadingMessage('');
      
      // Enhanced error messages
      let errorMessage = err.message || 'An error occurred during authentication';
      
      if (errorMessage.includes('username-already-exists')) {
        errorMessage = 'This username is already taken. Please choose another.';
      } else if (errorMessage.includes('invalid-credentials')) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setLoadingMessage('');
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
                autoComplete="username"
              />
              {mode === 'signup' && username && (
                <div className="mt-1 text-xs">
                  {username.length < 3 ? (
                    <span className="text-red-400">Username too short (min 3 characters)</span>
                  ) : !/^[a-zA-Z0-9_-]+$/.test(username) ? (
                    <span className="text-red-400">Only letters, numbers, _, and - allowed</span>
                  ) : (
                    <span className="text-green-400">✓ Valid username</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 glass-panel bg-glass-surface/80 border-glass-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 transition-all rounded-lg text-sm"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} className="w-4 h-4" />
                </button>
              </div>
              
              {/* Password strength indicator for signup */}
              {mode === 'signup' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1 bg-glass-surface rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 4 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-400' :
                      passwordStrength.score <= 4 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {passwordStrength.score <= 2 ? 'Weak' :
                       passwordStrength.score <= 4 ? 'Good' :
                       'Strong'}
                    </span>
                  </div>
                  
                  {passwordStrength.failed.length > 0 && (
                    <div className="text-xs text-text-secondary">
                      <span>Add: </span>
                      {passwordStrength.failed.map((req, index) => (
                        <span key={req} className="text-red-400">
                          {req}{index < passwordStrength.failed.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <div className="mt-1 text-xs">
                    {password === confirmPassword ? (
                      <span className="text-green-400">✓ Passwords match</span>
                    ) : (
                      <span className="text-red-400">Passwords don't match</span>
                    )}
                  </div>
                )}
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
                  <span>{loadingMessage || (mode === 'signin' ? 'Signing In...' : 'Creating Account...')}</span>
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
