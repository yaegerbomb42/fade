// Simple test to add some data to Firebase for testing
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAX1yMBRCUxfsArQWG5XzN4mx-sk4hgqu0",
  authDomain: "vibrant-bubble-chat.firebaseapp.com",
  databaseURL: "https://vibrant-bubble-chat-default-rtdb.firebaseio.com",
  projectId: "vibrant-bubble-chat",
  storageBucket: "vibrant-bubble-chat.appspot.com",
  messagingSenderId: "1084858947817",
  appId: "1:1084858947817:web:bc63c68c7192a742713878"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Add test users
const testUsers = [
  {
    username: 'alice',
    password: 'password123',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    xp: 350,
    level: 4,
    totalMessages: 45,
    totalLikes: 28,
    totalDislikes: 3,
    isOnline: true,
    lastSeen: Date.now()
  },
  {
    username: 'bob',
    password: 'password123',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    xp: 520,
    level: 6,
    totalMessages: 67,
    totalLikes: 42,
    totalDislikes: 5,
    isOnline: false,
    lastSeen: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
  },
  {
    username: 'charlie',
    password: 'password123',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    xp: 180,
    level: 2,
    totalMessages: 23,
    totalLikes: 15,
    totalDislikes: 2,
    isOnline: true,
    lastSeen: Date.now()
  }
];

async function addTestData() {
  console.log('Adding test users...');
  
  for (const user of testUsers) {
    const userRef = ref(database, `users/${user.username}`);
    await set(userRef, user);
    console.log(`Added user: ${user.username}`);
  }
  
  console.log('Test data added successfully!');
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  addTestData().catch(console.error);
}

export { addTestData };
