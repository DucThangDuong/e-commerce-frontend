import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SignalRProvider } from "./untils/signalR";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <SignalRProvider>
        <App />
      </SignalRProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
