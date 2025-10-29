// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@unocss/reset/tailwind.css";
import "uno.css";

import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AlertProvider } from "./context/AlertContext.jsx";
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <AlertProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </AlertProvider>
  // </React.StrictMode>
);
