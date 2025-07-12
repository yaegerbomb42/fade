import React, { useState, useEffect } from "react";
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import Routes from "./Routes";
import { AuthProvider } from "./contexts/AuthContext";

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

function App() {
  const [database, setDatabase] = useState(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    setDatabase(getDatabase(app));
  }, []);

  if (!database) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Initializing...</div>
      </div>
    );
  }

  return (
    <AuthProvider database={database}>
      <Routes />
    </AuthProvider>
  );
}

export default App;
