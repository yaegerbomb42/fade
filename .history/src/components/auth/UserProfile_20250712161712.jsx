import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

const UserProfile = ({ isOpen, onClose, profileUser, currentUser }) => {
  const { user: authUser } = useAuth();
  
  if (!isOpen || !profileUser) return null;

  const isOwnProfile = authUser && profileUser.username === authUser.username;
  const accountAge = profileUser.createdAt ? 
    Math.floor((Date.now() - new Date(profileUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const getStatusColor = (isOnline) => {
    return isOnline ? 'text-green-500' : 'text-gray-500';
  };

  const getStatusText = (isOnline, lastSeen) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    
    const timeDiff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Last seen just now';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">User Profile</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="X" className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {profileUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-text-primary mb-2">
              @{profileUser.username}
            </h3>
            
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${profileUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className={`text-sm font-medium ${getStatusColor(profileUser.isOnline)}`}>
                {getStatusText(profileUser.isOnline, profileUser.lastSeen)}
              </span>
            </div>

            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-bold">Level {profileUser.level || 1}</span>
              </div>
              <span className="text-text-secondary text-sm">{profileUser.xp || 0} XP</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 text-center bg-primary/10">
                <Icon name="message-circle" className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">
                  {profileUser.totalMessages || 0}
                </div>
                <div className="text-sm text-text-secondary">Messages</div>
              </div>

              <div className="glass-panel p-4 text-center bg-green-500/10">
                <Icon name="thumbs-up" className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">
                  {profileUser.totalLikes || 0}
                </div>
                <div className="text-sm text-text-secondary">Likes</div>
              </div>

              <div className="glass-panel p-4 text-center bg-red-500/10">
                <Icon name="thumbs-down" className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-400">
                  {profileUser.totalDislikes || 0}
                </div>
                <div className="text-sm text-text-secondary">Dislikes</div>
              </div>

              <div className="glass-panel p-4 text-center bg-secondary/10">
                <Icon name="Calendar" className="w-6 h-6 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary">
                  {accountAge}
                </div>
                <div className="text-sm text-text-secondary">Days</div>
              </div>
            </div>

            {profileUser.bio && (
              <div className="glass-panel p-4 bg-glass-surface/30">
                <h4 className="font-medium text-text-primary mb-2">Bio</h4>
                <p className="text-text-secondary text-sm">{profileUser.bio}</p>
              </div>
            )}

            <div className="glass-panel p-4 bg-glass-surface/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Account created:</span>
                <span className="font-medium text-text-primary">
                  {profileUser.createdAt ? 
                    new Date(profileUser.createdAt).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
            </div>

            {isOwnProfile ? (
              <div className="pt-4 border-t border-glass-border space-y-3">
                <h4 className="font-medium text-text-primary text-center">Profile Settings</h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('editProfile'));
                    }}
                    className="w-full glass-button py-2 px-4 hover:bg-glass-surface/60 text-text-primary font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Icon name="Edit" className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to sign out?')) {
                        window.dispatchEvent(new CustomEvent('signOut'));
                        onClose();
                      }
                    }}
                    className="w-full glass-button py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Icon name="LogOut" className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-glass-border">
                <p className="text-xs text-text-secondary text-center mb-3">
                  Report inappropriate behavior to help keep the community safe
                </p>
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('openReportModal', { 
                      detail: { username: profileUser.username } 
                    }));
                  }}
                  className="w-full glass-button py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Icon name="Flag" className="w-4 h-4" />
                  <span>Report User</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
