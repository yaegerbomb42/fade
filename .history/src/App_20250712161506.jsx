import React from "react";
import Routes from "./Routes";
import { AuthProvider } from "./contexts/AuthContext";
import { database } from "./utils/firebase";

function App() {
  return (
    <AuthProvider database={database}>
      <Routes />
    </AuthProvider>
  );
}

export default App;
