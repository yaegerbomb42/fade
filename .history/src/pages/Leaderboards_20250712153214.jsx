import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import Icon from '../components/AppIcon';
import FadeLogo from '../pages/main-chat-interface/components/FadeLogo';

// Individual leaderboard entry component
const LeaderboardEntry = ({ user, index, category, value, maxValue, accent }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈'; 
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-400' : 'bg-gray-400';
  };

  const accentColors = {
    blue: {
      bg: 'from-blue-400 to-blue-600',
      progress: 'from-blue-400 to-blue-600',
      border: 'border-blue-400/50'
    },
    pink: {
      bg: 'from-pink-400 to-red-600', 
      progress: 'from-pink-400 to-red-600',
      border: 'border-pink-400/50'
    },
    purple: {
      bg: 'from-purple-400 to-purple-600',
      progress: 'from-purple-400 to-purple-600', 
      border: 'border-purple-400/50'
    }
  };

  const colors = accentColors[accent] || accentColors.blue;

  return (
    <div className={`backdrop-blur-sm rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] ${
      user.isPlaceholder 
        ? 'bg-white/5 border border-white/10' 
        : index === 0 
          ? `bg-gradient-to-r ${colors.bg}/20 border-2 ${colors.border} shadow-lg` 
          : 'bg-white/10 border border-white/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Rank */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            user.isPlaceholder 
              ? 'bg-gray-500/30 text-gray-400' 
              : index === 0 
                ? `bg-gradient-to-br ${colors.bg} text-white shadow-md` 
                : 'bg-white/20 text-white'
          }`}>
            {user.isPlaceholder ? '?' : getRankIcon(index + 1)}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                user.isPlaceholder 
                  ? 'bg-gray-500/30 text-gray-400' 
                  : `bg-gradient-to-br ${colors.bg} text-white`
              }`}>
                {user.isPlaceholder ? '?' : user.username.charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm font-medium ${user.isPlaceholder ? 'text-gray-400' : 'text-white'}`}>
                {user.isPlaceholder ? user.username : user.username}
              </span>
              {!user.isPlaceholder && (
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user.isOnline)}`}></div>
              )}
            </div>
            <div className={`text-xs ${user.isPlaceholder ? 'text-gray-500' : 'text-gray-300'}`}>
              Level {user.level || 1} • {user.xp || 0} XP
            </div>
          </div>
        </div>

        {/* Value */}
        <div className="text-right">
          <div className={`text-lg font-bold ${user.isPlaceholder ? 'text-gray-400' : 'text-white'}`}>
            {value.toLocaleString()}
          </div>
          {/* Progress bar */}
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                user.isPlaceholder 
                  ? 'bg-gray-500/30 w-0' 
                  : `bg-gradient-to-r ${colors.progress}`
              }`}
              style={{ 
                width: user.isPlaceholder ? '0%' : `${Math.min(100, (value / maxValue) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    console.log('Leaderboards useEffect triggered, database:', !!database);
    
    if (!database) {
      console.log('No database available, setting loading to false');
      setLoading(false);
      return;
    }

    const loadAllUsers = async () => {
      setLoading(true);
      console.log('Starting to load users...');
      
      try {
        const usersRef = ref(database, 'users');
        console.log('Created users ref, attempting to get data...');
        const snapshot = await get(usersRef);
        
        console.log('Snapshot exists:', snapshot.exists());
        
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
          
          console.log('Loaded users:', users.length);
          setAllUsers(users);
        } else {
          console.log('No users found in database');
          setAllUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setAllUsers([]);
      } finally {
        console.log('Finished loading, setting loading to false');
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
            <Icon name="ArrowLeft" className="w-6 h-6" />
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
                    <Icon name="MessageSquare" className="w-6 h-6 text-white" />
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
                    <Icon name="Heart" className="w-6 h-6 text-white" />
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
                    <Icon name="Zap" className="w-6 h-6 text-white" />
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
            <Icon name="MessageSquare" className="w-5 h-5 inline mr-2" />
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
