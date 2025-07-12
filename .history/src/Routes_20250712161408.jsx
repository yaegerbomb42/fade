import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import MainChatInterface from "pages/main-chat-interface";
import PrivacyPolicy from "pages/PrivacyPolicy";
import NotFound from "pages/NotFound";
import Leaderboards from "pages/Leaderboards";
import { database } from './utils/firebase';

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