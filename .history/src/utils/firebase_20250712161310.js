import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAX1yMBRCUxfsArQWG5XzN4mx-sk4hgqu0",
  authDomain: "vibrant-bubble-chat.firebaseapp.com",
  databaseURL: "https://vibrant-bubble-chat-default-rtdb.firebaseio.com",
  projectId: "vibrant-bubble-chat",
  storageBucket: "vibrant-bubble-chat.appspot.com",
  messagingSenderId: "1084858947817",
  appId: "1:1084858947817:web:bc63c68c7192a742713878"
};

// Initialize Firebase app only if it hasn't been initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get the database instance
export const database = getDatabase(app);
export default app;
