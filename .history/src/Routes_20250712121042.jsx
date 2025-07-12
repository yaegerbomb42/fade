import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import MainChatInterface from "pages/main-chat-interface";
import PrivacyPolicy from "pages/PrivacyPolicy";
import NotFound from "pages/NotFound";
import Leaderboards from "pages/Leaderboards";
import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/" element={<MainChatInterface />} />
          <Route path="/channel/:channelId" element={<MainChatInterface />} />
          <Route path="/main-chat-interface" element={<MainChatInterface />} />
          <Route path="/leaderboards" element={<Leaderboards database={database} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;