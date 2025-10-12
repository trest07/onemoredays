// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import TopNav from "@/components/TopNav.jsx";
import AuthAwareBottomBar from "@/components/AuthAwareBottomBar.jsx";
import IosInstallPrompt from "@/components/IosInstallPrompt.jsx"; // 👈 iOS PWA banner

// Map
const MapView = lazy(() => import("@/rides/pages/map/MapView.jsx"));

// Settings
const SettingsHome    = lazy(() => import("@/features/settings/index.jsx"));
const ActivityHome    = lazy(() => import("@/features/activity/index.jsx"));
const ProfileSettings = lazy(() => import("@/features/settings/ProfileSettings.jsx"));
const AccountSettings = lazy(() => import("@/features/settings/AccountSettings.jsx"));

// Auth
const Login    = lazy(() => import("@/auth/Login.jsx"));
const Register = lazy(() => import("@/auth/Register.jsx"));
const Reset    = lazy(() => import("@/auth/Reset.jsx"));

// ✅ Pins
const AddPin  = lazy(() => import("@/rides/pages/AddPin.jsx"));
const MyPins  = lazy(() => import("@/rides/pages/MyPins.jsx"));

// ✅ Settings → Drops (replace deleted SettingsPage)
const MyDrops = lazy(() => import("@/rides/pages/settings/MyDrops.jsx"));

function Loading() {
  return <div className="w-full py-10 text-center text-gray-500">Loading…</div>;
}

export default function App() {
  return (
    <>
      <TopNav />
      <IosInstallPrompt /> {/* 👈 iOS install banner+modal */}

      <main className="pb-24">
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Map */}
            <Route path="/rides/map" element={<MapView />} />
            <Route path="/rides" element={<Navigate to="/rides/map" replace />} />

            {/* ✅ Pins */}
            <Route path="/pins/new" element={<AddPin />} />
            <Route path="/pins/mine" element={<MyPins />} />

            {/* Settings */}
            <Route path="/settings" element={<SettingsHome />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/account" element={<AccountSettings />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<Reset />} />

            {/* Activity */}
            <Route path="/activity" element={<ActivityHome />} />
            <Route path="/activity/drops" element={<MyDrops />} /> {/* 👈 uses existing MyDrops */}

            {/* Default & fallback */}
            <Route path="/" element={<Navigate to="/rides/map" replace />} />
            <Route path="*" element={<Navigate to="/rides/map" replace />} />
          </Routes>
        </Suspense>
      </main>

      <AuthAwareBottomBar />
    </>
  );
}
