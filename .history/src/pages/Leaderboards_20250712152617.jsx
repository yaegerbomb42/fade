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
              xp: userData.xp || 0,
              level: userData.level || 1
            }));
          
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

  const getTopUsersByCategory = (category) => {
    let orderField = 'totalMessages';
    if (category === 'likes') orderField = 'totalLikes';
    else if (category === 'xp') orderField = 'xp';
    
    const realUsers = allUsers
      .sort((a, b) => (b[orderField] || 0) - (a[orderField] || 0))
      .slice(0, 5); // Show top 5 in each category

    // If no real users, show placeholder data
    if (realUsers.length === 0) {
      return getPlaceholderData().slice(0, 3);
    }

    // If less than 3 users, fill with placeholders to show at least 3 entries
    if (realUsers.length < 3) {
      const placeholders = getPlaceholderData().slice(realUsers.length, 3);
      return [...realUsers, ...placeholders];
    }

    return realUsers;
  };

  const getDisplayValue = (user, category) => {
    switch (category) {
      case 'likes':
        return user.totalLikes || 0;
      case 'xp':
        return user.xp || 0;
      default:
        return user.totalMessages || 0;
    }
  };

  const getDisplayLabel = (category) => {
    switch (category) {
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

        {/* Three Leaderboards Side by Side */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white mt-4">Loading leaderboards...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Messages Leaderboard */}
              <div className="backdrop-blur-md rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon name="message-square" className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">Top Messagers</h2>
                  <p className="text-blue-200 text-sm">Most active chatters</p>
                </div>
                
                <div className="space-y-3">
                  {getTopUsersByCategory('messages').map((user, index) => (
                    <LeaderboardEntry 
                      key={user.isPlaceholder ? `messages-placeholder-${index}` : `messages-${user.username}`}
                      user={user}
                      index={index}
                      category="messages"
                      value={getDisplayValue(user, 'messages')}
                      maxValue={Math.max(1, getDisplayValue(getTopUsersByCategory('messages')[0], 'messages'))}
                      accent="blue"
                    />
                  ))}
                </div>
              </div>

              {/* Likes Leaderboard */}
              <div className="backdrop-blur-md rounded-2xl p-6 bg-gradient-to-br from-pink-500/20 to-red-600/10 border border-pink-400/30">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon name="heart" className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">Most Liked</h2>
                  <p className="text-pink-200 text-sm">Community favorites</p>
                </div>
                
                <div className="space-y-3">
                  {getTopUsersByCategory('likes').map((user, index) => (
                    <LeaderboardEntry 
                      key={user.isPlaceholder ? `likes-placeholder-${index}` : `likes-${user.username}`}
                      user={user}
                      index={index}
                      category="likes"
                      value={getDisplayValue(user, 'likes')}
                      maxValue={Math.max(1, getDisplayValue(getTopUsersByCategory('likes')[0], 'likes'))}
                      accent="pink"
                    />
                  ))}
                </div>
              </div>

              {/* XP Leaderboard */}
              <div className="backdrop-blur-md rounded-2xl p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon name="zap" className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">Top Experience</h2>
                  <p className="text-purple-200 text-sm">Most experienced users</p>
                </div>
                
                <div className="space-y-3">
                  {getTopUsersByCategory('xp').map((user, index) => (
                    <LeaderboardEntry 
                      key={user.isPlaceholder ? `xp-placeholder-${index}` : `xp-${user.username}`}
                      user={user}
                      index={index}
                      category="xp"
                      value={getDisplayValue(user, 'xp')}
                      maxValue={Math.max(1, getDisplayValue(getTopUsersByCategory('xp')[0], 'xp'))}
                      accent="purple"
                    />
                  ))}
                </div>
              </div>
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
