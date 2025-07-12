import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import Icon from '../components/AppIcon';
import FadeLogo from '../pages/main-chat-interface/components/FadeLogo';

const Leaderboards = ({ database }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages');
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
    
    return allUsers
      .filter(user => user[orderField] > 0)
      .sort((a, b) => (b[orderField] || 0) - (a[orderField] || 0))
      .slice(0, 20);
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="absolute left-4 top-8 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200"
            >
              <Icon name="arrow-left" className="w-6 h-6" />
            </button>
            <FadeLogo className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboards</h1>
          <p className="text-blue-200">Top performers in the Fade community</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white bg-opacity-10 rounded-xl p-1 backdrop-blur-sm">
            {[
              { key: 'messages', label: 'Messages', icon: 'message-circle' },
              { key: 'likes', label: 'Likes', icon: 'thumbs-up' },
              { key: 'xp', label: 'Experience', icon: 'star' }
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
          ) : getTopUsers().length === 0 ? (
            <div className="text-center py-12">
              <Icon name="users" className="w-16 h-16 text-white opacity-50 mx-auto mb-4" />
              <p className="text-white text-xl">No data available yet</p>
              <p className="text-blue-200">Be the first to make it on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getTopUsers().map((user, index) => (
                <div
                  key={user.username}
                  className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 transition-all duration-200 hover:bg-opacity-20 ${
                    index < 3 ? 'border-2 border-yellow-400 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-white bg-opacity-20'
                      }`}>
                        <span className="text-white font-bold">
                          {typeof getRankIcon(index + 1) === 'string' && getRankIcon(index + 1).startsWith('�') 
                            ? getRankIcon(index + 1) 
                            : <span className="text-sm">{getRankIcon(index + 1)}</span>
                          }
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-bold">@{user.username}</h3>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(user.isOnline)}`}></div>
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="text-blue-200">Level {user.level || 1}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-300">{user.xp || 0} XP</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {getDisplayValue(user).toLocaleString()}
                      </div>
                      <div className="text-blue-200 text-sm">
                        {getDisplayLabel()}
                      </div>
                    </div>
                  </div>

                  {/* Additional stats for top 3 */}
                  {index < 3 && (
                    <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-white font-bold">{user.totalMessages || 0}</div>
                          <div className="text-blue-200 text-xs">Messages</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{user.totalLikes || 0}</div>
                          <div className="text-blue-200 text-xs">Likes</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">
                            {user.createdAt ? 
                              Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                              : 0
                            }
                          </div>
                          <div className="text-blue-200 text-xs">Days</div>
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
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
