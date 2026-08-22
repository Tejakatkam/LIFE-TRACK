import React from "react";

export default function Navigation({ tab, setTab }) {
  return (
    <nav className="nav">
      {[
        ["food", "Food"],
        ["schedule", "Schedule"],
        ["tracking", "Tracking"],
        ["reminders", "Reminders"],
        ["weekly", "Weekly"],
        ["profile", "Profile"]
      ].map(([value, label]) => (
        <button
          key={value}
          className={`nav-btn${tab === value ? " active" : ""}`}
          onClick={() => setTab(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
