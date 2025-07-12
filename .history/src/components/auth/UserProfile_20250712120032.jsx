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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {profileUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
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
              <span className="text-gray-600 text-sm">{profileUser.xp || 0} XP</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Icon name="message-circle" className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {profileUser.totalMessages || 0}
                </div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Icon name="thumbs-up" className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {profileUser.totalLikes || 0}
                </div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 text-center">
                <Icon name="thumbs-down" className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {profileUser.totalDislikes || 0}
                </div>
                <div className="text-sm text-gray-600">Dislikes</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Icon name="calendar" className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {accountAge}
                </div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
            </div>

            {profileUser.bio && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                <p className="text-gray-600 text-sm">{profileUser.bio}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Account created:</span>
                <span className="font-medium text-gray-900">
                  {profileUser.createdAt ? 
                    new Date(profileUser.createdAt).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-3">
                  Report inappropriate behavior to help keep the community safe
                </p>
                <button
                  onClick={() => {
                    // This will be handled by the parent component
                    onClose();
                    // Trigger report modal
                    window.dispatchEvent(new CustomEvent('openReportModal', { 
                      detail: { username: profileUser.username } 
                    }));
                  }}
                  className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <Icon name="flag" className="w-4 h-4" />
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
