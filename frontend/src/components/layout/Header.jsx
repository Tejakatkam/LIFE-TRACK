import React from "react";

export default function Header({ activeTab, setActiveTab }) {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-dark", dark);
  }, [dark]);

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
          className={`icon-btn${activeTab === "profile" ? " active" : ""}`}
          onClick={() => setActiveTab("profile")}
          title="Profile"
          style={{ fontSize: 18 }}
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
