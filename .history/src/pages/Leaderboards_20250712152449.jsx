import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import Icon from '../components/AppIcon';
import FadeLogo from '../pages/main-chat-interface/components/FadeLogo';

const Leaderboards = ({ database }) => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create placeholder data when no real data exists
  const getPlaceholderData = () => [
    { username: 'Be the first!', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true },
    { username: 'Start chatting', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true },
    { username: 'Join the fun', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true }
  ];

  useEffect(() => {
    if (!database) return;

    const loadAllUsers = async () => {
      setLoading(true);
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const users = Object.entries(snapshot.val())
            .map(([username, userData]) => ({
              username,
              ...userData,
              totalMessages: userData.totalMessages || 0,
              totalLikes: userData.totalLikes || 0,
              xp: userData.xp || 0
            }))
            .filter(user => user.totalMessages > 0 || user.totalLikes > 0 || user.xp > 0);
          
          setAllUsers(users);
        } else {
          setAllUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [database]);

  const getTopUsers = () => {
    let orderField = 'totalMessages';
    if (activeTab === 'likes') orderField = 'totalLikes';
    else if (activeTab === 'xp') orderField = 'xp';
    
    const realUsers = allUsers
      .sort((a, b) => (b[orderField] || 0) - (a[orderField] || 0))
      .slice(0, 10);

    // If no real users, show placeholder data
    if (realUsers.length === 0) {
      return getPlaceholderData();
    }

    // If less than 3 users, fill with placeholders to show at least 3 entries
    if (realUsers.length < 3) {
      const placeholders = getPlaceholderData().slice(realUsers.length);
      return [...realUsers, ...placeholders];
    }

    return realUsers;
  };

  const getDisplayValue = (user) => {
    switch (activeTab) {
      case 'likes':
        return user.totalLikes || 0;
      case 'xp':
        return user.xp || 0;
      default:
        return user.totalMessages || 0;
    }
  };

  const getDisplayLabel = () => {
    switch (activeTab) {
      case 'likes':
        return 'Likes';
      case 'xp':
        return 'XP';
      default:
        return 'Messages';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 top-0 glass-panel p-3 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-md rounded-xl"
          >
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-center mb-6">
            <FadeLogo className="w-20 h-20" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Leaderboards
          </h1>
          <p className="text-blue-200 text-lg">Top performers in the Fade community</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white bg-opacity-10 rounded-xl p-1 backdrop-blur-sm">
            {[
              { key: 'messages', label: 'Messages', icon: 'message-square' },
              { key: 'likes', label: 'Likes', icon: 'heart' },
              { key: 'xp', label: 'Experience', icon: 'zap' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'bg-white text-purple-900 shadow-lg'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Icon name={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white mt-4">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getTopUsers().map((user, index) => (
                <div
                  key={user.isPlaceholder ? `placeholder-${index}` : user.username}
                  className={`backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                    user.isPlaceholder 
                      ? 'bg-white/5 border border-white/10' 
                      : index < 3 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 shadow-xl' 
                        : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank Icon */}
                      <div className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-lg ${
                        user.isPlaceholder 
                          ? 'bg-gray-500/30 text-gray-400' 
                          : index < 3 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                            : 'bg-white/20 text-white'
                      }`}>
                        {user.isPlaceholder ? '?' : getRankIcon(index + 1)}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          user.isPlaceholder 
                            ? 'bg-gray-500/30 text-gray-400' 
                            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        }`}>
                          {user.isPlaceholder ? '?' : user.username.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-bold ${user.isPlaceholder ? 'text-gray-400' : 'text-white'}`}>
                              {user.isPlaceholder ? user.username : `@${user.username}`}
                            </h3>
                            {!user.isPlaceholder && (
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(user.isOnline)}`}></div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className={user.isPlaceholder ? 'text-gray-400' : 'text-blue-200'}>
                              Level {user.level || 1}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className={user.isPlaceholder ? 'text-gray-400' : 'text-gray-300'}>
                              {user.xp || 0} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${user.isPlaceholder ? 'text-gray-400' : 'text-white'}`}>
                        {getDisplayValue(user).toLocaleString()}
                      </div>
                      <div className={`text-sm ${user.isPlaceholder ? 'text-gray-500' : 'text-blue-200'}`}>
                        {getDisplayLabel()}
                      </div>
                      
                      {/* Progress bar for visual appeal */}
                      <div className="mt-2 w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            user.isPlaceholder 
                              ? 'bg-gray-500/30 w-0' 
                              : index < 3 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          }`}
                          style={{ 
                            width: user.isPlaceholder 
                              ? '0%' 
                              : `${Math.min(100, (getDisplayValue(user) / Math.max(getDisplayValue(getTopUsers()[0]), 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Additional stats for top 3 */}
                  {(index < 3 && !user.isPlaceholder) && (
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-white font-bold text-lg">{user.totalMessages || 0}</div>
                          <div className="text-blue-200 text-sm">Messages</div>
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">{user.totalLikes || 0}</div>
                          <div className="text-blue-200 text-sm">Likes</div>
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">
                            {user.createdAt ? 
                              Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                              : 0
                            }
                          </div>
                          <div className="text-blue-200 text-sm">Days</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Chat Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="glass-panel px-8 py-4 hover:bg-white/20 text-white font-medium transition-all duration-300 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Icon name="message-square" className="w-5 h-5 inline mr-2" />
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
