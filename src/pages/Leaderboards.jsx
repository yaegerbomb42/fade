import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import Icon from '../components/AppIcon';
import FadeLogo from '../pages/main-chat-interface/components/FadeLogo';

// Enhanced individual leaderboard entry component
const EnhancedLeaderboardEntry = ({ user, index, category, value, maxValue }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈'; 
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColors = (rank) => {
    switch (rank) {
      case 1:
        return {
          bg: 'from-yellow-400 to-orange-500',
          border: 'border-yellow-400/60',
          glow: 'shadow-yellow-400/30'
        };
      case 2:
        return {
          bg: 'from-gray-300 to-gray-500',
          border: 'border-gray-400/60',
          glow: 'shadow-gray-400/30'
        };
      case 3:
        return {
          bg: 'from-amber-600 to-amber-800',
          border: 'border-amber-600/60',
          glow: 'shadow-amber-600/30'
        };
      default:
        return {
          bg: 'from-glass-surface to-glass-surface/80',
          border: 'border-glass-border',
          glow: 'shadow-glass-surface/20'
        };
    }
  };

  const getCategoryColors = (category) => {
    switch (category) {
      case 'messages':
        return {
          accent: 'from-blue-400 to-blue-600',
          progress: 'from-blue-400 to-blue-600',
          text: 'text-blue-400'
        };
      case 'likes':
        return {
          accent: 'from-pink-400 to-red-600',
          progress: 'from-pink-400 to-red-600',
          text: 'text-pink-400'
        };
      case 'xp':
        return {
          accent: 'from-purple-400 to-purple-600',
          progress: 'from-purple-400 to-purple-600',
          text: 'text-purple-400'
        };
      default:
        return {
          accent: 'from-primary to-secondary',
          progress: 'from-primary to-secondary',
          text: 'text-primary'
        };
    }
  };

  const rankColors = getRankColors(index + 1);
  const categoryColors = getCategoryColors(category);
  const isTopThree = index < 3;

  return (
    <div className={`group relative transition-all duration-500 hover:scale-[1.02] ${
      user.isPlaceholder ? 'opacity-60' : ''
    }`}>
      {/* Glow effect for top 3 */}
      {isTopThree && !user.isPlaceholder && (
        <div className={`absolute inset-0 bg-gradient-to-r ${rankColors.bg} opacity-20 rounded-2xl blur-xl transition-opacity duration-300 group-hover:opacity-30`}></div>
      )}
      
      <div className={`relative bg-glass-surface/60 backdrop-blur-lg border-2 ${
        isTopThree && !user.isPlaceholder ? rankColors.border : 'border-glass-border'
      } rounded-2xl p-6 transition-all duration-300 hover:bg-glass-surface/80 ${
        isTopThree && !user.isPlaceholder ? `shadow-xl ${rankColors.glow}` : 'shadow-lg hover:shadow-xl'
      }`}>
        
        <div className="flex items-center justify-between">
          {/* Left side - Rank and User Info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Rank Badge */}
            <div className={`relative flex items-center justify-center w-14 h-14 rounded-xl font-bold text-lg transition-transform duration-300 group-hover:scale-110 ${
              user.isPlaceholder 
                ? 'bg-glass-surface/40 text-text-secondary' 
                : isTopThree
                  ? `bg-gradient-to-br ${rankColors.bg} text-white shadow-lg`
                  : 'bg-glass-surface/60 text-white border border-glass-border'
            }`}>
              {user.isPlaceholder ? '?' : getRankIcon(index + 1)}
              {isTopThree && !user.isPlaceholder && (
                <div className={`absolute inset-0 bg-gradient-to-br ${rankColors.bg} rounded-xl blur opacity-40 -z-10`}></div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                  user.isPlaceholder 
                    ? 'bg-glass-surface/40 text-text-secondary' 
                    : `bg-gradient-to-br ${categoryColors.accent} text-white`
                }`}>
                  {user.isPlaceholder ? '?' : user.username.charAt(0).toUpperCase()}
                </div>
                
                {/* Username and Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold text-lg truncate ${
                      user.isPlaceholder ? 'text-text-secondary' : 'text-white'
                    }`}>
                      {user.username}
                    </span>
                    {!user.isPlaceholder && (
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.isPlaceholder 
                        ? 'bg-glass-surface/40 text-text-secondary' 
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm'
                    }`}>
                      Level {user.level || 1}
                    </span>
                    <span className={`text-sm ${user.isPlaceholder ? 'text-text-secondary' : 'text-text-secondary'}`}>
                      {user.xp || 0} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Value and Progress */}
          <div className="text-right ml-4">
            <div className={`text-2xl font-bold mb-2 ${
              user.isPlaceholder ? 'text-text-secondary' : 'text-white'
            }`}>
              {value.toLocaleString()}
            </div>
            
            {/* Progress bar */}
            <div className="w-24 h-2 bg-glass-surface/60 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 delay-300 ${
                  user.isPlaceholder 
                    ? 'bg-glass-surface/40 w-0' 
                    : `bg-gradient-to-r ${categoryColors.progress} shadow-lg`
                }`}
                style={{ 
                  width: user.isPlaceholder ? '0%' : `${Math.min(100, (value / Math.max(maxValue, 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Subtle animation line for top performers */}
        {!user.isPlaceholder && isTopThree && (
          <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${categoryColors.progress} rounded-b-2xl transition-all duration-1000 delay-500`}
               style={{ width: `${Math.min(100, (value / Math.max(maxValue, 1)) * 100)}%` }}>
          </div>
        )}
      </div>
    </div>
  );
};

const Leaderboards = ({ database }) => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true to show loading initially
  const [selectedCategory, setSelectedCategory] = useState('messages'); // Add category selection

  // Create placeholder data when no real data exists
  const getPlaceholderData = () => [
    { username: 'Be the first!', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true },
    { username: 'Start chatting', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true },
    { username: 'Join the fun', totalMessages: 0, totalLikes: 0, xp: 0, level: 1, isPlaceholder: true }
  ];

  useEffect(() => {
    // Show placeholder data immediately
    setAllUsers(getPlaceholderData());
    setLoading(false); // Stop loading since we have placeholder data
    
    if (!database) {
      return;
    }

    const loadAllUsers = async () => {
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
        }
      } catch (error) {
        // Keep placeholder data on error
      }
    };

    // Load real data after showing placeholder
    setTimeout(loadAllUsers, 500);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 top-0 group bg-glass-surface/60 backdrop-blur-lg border border-glass-border rounded-2xl p-4 hover:bg-glass-surface/80 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Icon name="ArrowLeft" className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
          </button>
          
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <FadeLogo className="w-20 h-20 md:w-28 md:h-28" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl -z-10"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            Leaderboards
          </h1>
          <p className="text-blue-200/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Discover the top performers in the Fade community and climb the ranks
          </p>
        </div>

        {/* Category Selection */}
        <div className="flex justify-center mb-12">
          <div className="bg-glass-surface/40 backdrop-blur-lg border border-glass-border rounded-2xl p-2 shadow-lg">
            <div className="flex space-x-2">
              {[
                { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
                { id: 'likes', label: 'Likes', icon: 'Heart' },
                { id: 'xp', label: 'Experience', icon: 'Zap' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105'
                      : 'text-white/70 hover:text-white hover:bg-glass-surface/60'
                  }`}
                >
                  <Icon name={category.icon} className="w-4 h-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Single Leaderboard Display */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-glass-surface/60 backdrop-blur-lg border border-glass-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center border-b border-glass-border">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                selectedCategory === 'messages' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                selectedCategory === 'likes' ? 'bg-gradient-to-br from-pink-400 to-red-600' :
                'bg-gradient-to-br from-purple-400 to-purple-600'
              }`}>
                <Icon 
                  name={
                    selectedCategory === 'messages' ? 'MessageSquare' :
                    selectedCategory === 'likes' ? 'Heart' : 'Zap'
                  } 
                  className="w-8 h-8 text-white" 
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {selectedCategory === 'messages' ? 'Top Messagers' :
                 selectedCategory === 'likes' ? 'Most Liked' :
                 'Top Experience'}
              </h2>
              <p className={`text-lg ${
                selectedCategory === 'messages' ? 'text-blue-200' :
                selectedCategory === 'likes' ? 'text-pink-200' :
                'text-purple-200'
              }`}>
                {selectedCategory === 'messages' ? 'Most active chatters in the community' :
                 selectedCategory === 'likes' ? 'Community favorites with the most likes' :
                 'Most experienced users with highest XP'}
              </p>
            </div>

            {/* Leaderboard Entries */}
            <div className="p-8">
              <div className="space-y-6">
                {getTopUsersByCategory(selectedCategory).map((user, index) => (
                  <EnhancedLeaderboardEntry 
                    key={user.isPlaceholder ? `${selectedCategory}-placeholder-${index}` : `${selectedCategory}-${user.username}`}
                    user={user}
                    index={index}
                    category={selectedCategory}
                    value={getDisplayValue(user, selectedCategory)}
                    maxValue={Math.max(1, getDisplayValue(getTopUsersByCategory(selectedCategory)[0], selectedCategory))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-16 space-y-8">
          <button
            onClick={() => navigate('/')}
            className="group bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-lg border border-glass-border rounded-2xl px-12 py-4 text-white font-semibold transition-all duration-300 hover:from-primary/30 hover:to-secondary/30 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center space-x-3">
              <Icon name="MessageSquare" className="w-6 h-6 group-hover:animate-pulse" />
              <span>Back to Chat</span>
            </div>
          </button>

          <div className="text-center">
            <p className="text-white/60 text-lg">
              Made with ❤️ by <span className="text-white/80 font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Yaeger</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
