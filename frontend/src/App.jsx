import React, { useState, useEffect } from "react";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";

import FoodTab from "./components/food/FoodTab";
import RemindersTab from "./components/reminders/RemindersTab";
import WeeklyTasksTab from "./components/weekly/WeeklyTasksTab";
import ProfileTab from "./components/profile/ProfileTab";

import { apiRequest } from "./utils/api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("login"); // ✔ login vs register
  const [activeTab, setActiveTab] = useState("food");

  const [profile, setProfile] = useState({});
  const [reminders, setReminders] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);

  // 🔹 Auto-login
  useEffect(() => {
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
        {activeTab === "reminders" && (
          <RemindersTab
            reminders={reminders}
            setReminders={setReminders}
            currentUser={currentUser}
          />
        )}
        {activeTab === "weekly" && (
          <WeeklyTasksTab
            weeklyTasks={weeklyTasks}
            setWeeklyTasks={setWeeklyTasks}
            currentUser={currentUser}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            setProfile={setProfile}
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
