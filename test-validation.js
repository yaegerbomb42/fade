// Test script to thoroughly validate FADE message persistence and synchronization
// This will help verify that the improvements work as expected

console.log('🧪 Starting FADE persistence system validation...');

// Simulate sending multiple messages with staggered timing
function createTestMessage(id, text, spawnTime) {
  return {
    id: `test_${id}_${Date.now()}`,
    text: text,
    author: 'TestUser',
    timestamp: new Date().toISOString(),
    position: {
      top: 25 + (id * 8), // Stagger vertically
      left: 105,
      spawnTime: spawnTime,
      lane: id % 10
    },
    originalPosition: {
      top: 25 + (id * 8),
      left: 105,
      spawnTime: spawnTime,
      lane: id % 10
    },
    persistedAt: Date.now(),
    reactions: { thumbsUp: 0, thumbsDown: 0 },
    createdAt: spawnTime,
    userId: 'test-user'
  };
}

// Test persistence workflow
const now = Date.now();
const messages = [
  createTestMessage(1, 'Message 1 - oldest', now - 30000), // 30 seconds ago
  createTestMessage(2, 'Message 2 - middle', now - 15000), // 15 seconds ago  
  createTestMessage(3, 'Message 3 - newest', now - 5000),  // 5 seconds ago
  createTestMessage(4, 'Message 4 - fresh', now - 1000),   // 1 second ago
];

const channelId = 'vibes';
const storageKey = `persistent_messages_${channelId}`;

// Store messages
localStorage.setItem(storageKey, JSON.stringify(messages));
localStorage.setItem(`last_message_update_${channelId}`, Date.now().toString());

console.log(`✅ Stored ${messages.length} test messages`);

// Test restoration logic (simulating what happens on page refresh)
const REGULAR_MESSAGE_FLOW_DURATION = 45000;
const stored = localStorage.getItem(storageKey);
if (stored) {
  const persistedMessages = JSON.parse(stored);
  console.log(`📖 Found ${persistedMessages.length} persisted messages`);
  
  const restoreTime = Date.now();
  
  const validMessages = persistedMessages.filter(msg => {
    const messageTime = msg.position?.spawnTime || msg.originalPosition?.spawnTime || new Date(msg.timestamp).getTime();
    const age = restoreTime - messageTime;
    const isValid = age < (REGULAR_MESSAGE_FLOW_DURATION + 5000); // Add 5 seconds grace period
    console.log(`  Message "${msg.text}": age=${Math.round(age/1000)}s, valid=${isValid}`);
    return isValid;
  });
  
  console.log(`✅ ${validMessages.length} messages are still valid for restoration`);
  
  // Test position calculation for each valid message
  validMessages.forEach(msg => {
    const positionData = msg.position || msg.originalPosition;
    if (positionData && positionData.spawnTime) {
      const messageAge = restoreTime - positionData.spawnTime;
      const progress = Math.min(Math.max(0, messageAge / REGULAR_MESSAGE_FLOW_DURATION), 1);
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      const easedProgress = easeOutQuart(progress);
      const startX = 105;
      const endX = -35;
      const currentX = startX - (easedProgress * (startX - endX));
      
      const currentPosition = {
        top: positionData.top,
        left: currentX,
        progress: progress,
        isExpired: progress >= 1
      };
      
      console.log(`  Position for "${msg.text}": left=${Math.round(currentX)}%, progress=${Math.round(progress*100)}%, expired=${currentPosition.isExpired}`);
    }
  });
  
  const visibleMessages = validMessages.filter(msg => {
    const positionData = msg.position || msg.originalPosition;
    if (positionData && positionData.spawnTime) {
      const messageAge = restoreTime - positionData.spawnTime;
      const progress = Math.min(Math.max(0, messageAge / REGULAR_MESSAGE_FLOW_DURATION), 1);
      return progress < 1; // Not expired
    }
    return false;
  });
  
  console.log(`🎯 ${visibleMessages.length} messages should be visible after restoration`);
  console.log('✅ Persistence validation complete!');
} else {
  console.log('❌ No stored messages found');
}

// Add this to browser console to test
export { createTestMessage };