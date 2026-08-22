import React, { useState, useEffect } from "react";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";

import FoodTab from "./components/food/FoodTab";
import ScheduleTab from "./components/schedule/ScheduleTab";
import TrackingTab from "./components/tracking/TrackingTab";
import RemindersTab from "./components/reminders/RemindersTab";
import WeeklyTasksTab from "./components/weekly/WeeklyTasksTab";
import ProfileTab from "./components/profile/ProfileTab";
import useNotifCheck from "./hooks/useNotifiCheck";

import { apiRequest } from "./utils/api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("login"); // ✔ login vs register
  const [activeTab, setActiveTab] = useState("food");

  const [profile, setProfile] = useState({});

  useNotifCheck(currentUser);

  // 🔹 Auto-login
  useEffect(() => {
    const savedDark = localStorage.getItem("dark");
    document.documentElement.setAttribute("data-dark", savedDark !== null ? savedDark : "true");
    
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        setCurrentUser(data.user);
        setProfile(data.user);
      } catch {
        localStorage.removeItem("token");
      }
    })();
  }, []);

  if (!currentUser) {
    // Screen: Login
    if (screen === "login") {
      return (
        <Login
          onLogin={(user) => {
            setCurrentUser(user);
            setProfile(user);
            setScreen("app");
          }}
          goToRegister={() => setScreen("register")}
        />
      );
    }
    // Screen: Register
    if (screen === "register") {
      return (
        <Register
          onRegister={(user) => {
            setCurrentUser(user);
            setProfile(user);
            setScreen("app");
          }}
          goToLogin={() => setScreen("login")}
        />
      );
    }
    return null;
  }

  return (
    <div className="app">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Navigation tab={activeTab} setTab={setActiveTab} />

      <div className="content">
        {activeTab === "food" && <FoodTab currentUser={currentUser} />}
        {activeTab === "schedule" && <ScheduleTab currentUser={currentUser} />}
        {activeTab === "tracking" && <TrackingTab currentUser={currentUser} />}
        {activeTab === "reminders" && <RemindersTab currentUser={currentUser} />}
        {activeTab === "weekly" && <WeeklyTasksTab currentUser={currentUser} />}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            onSave={async (updated) => {
              const updatedProfile = await apiRequest("/api/auth/profile", "PUT", updated);
              const merged = { ...profile, ...updatedProfile };
              setProfile(merged);
              return merged;
            }}
            onLogout={() => {
              localStorage.removeItem("token");
              setCurrentUser(null);
              setScreen("login");
            }}
          />
        )}
      </div>
    </div>
  );
}
