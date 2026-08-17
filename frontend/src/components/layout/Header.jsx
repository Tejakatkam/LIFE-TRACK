import React from "react";

export default function Header({ dark, setDark, tab, setTab }) {
  return (
    <div className="header">
      <div className="header-logo">
        life<span>·</span>track
      </div>

      <div className="header-right">
        <button
          className="icon-btn"
          onClick={() => setDark(!dark)}
          title="Toggle theme"
        >
          {dark ? "☀" : "◑"}
        </button>

        <button
          className={`icon-btn${tab === "profile" ? " active" : ""}`}
          onClick={() => setTab("profile")}
          title="Profile"
          style={{ fontSize: 18 }}
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
