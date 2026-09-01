import React, { useState, useEffect } from "react";

export default function NotifBanner() {
  const [perm, setPerm] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check and auto-request permission if in default state
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPerm(p)).catch(() => {});
    }
  }, []);

  const request = async () => {
    if (typeof Notification !== "undefined") {
      const p = await Notification.requestPermission();
      setPerm(p);
    }
  };

  if (dismissed) return null;

  return (
    <div className={`notif-banner ${perm === "granted" ? "granted" : "pending"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        {perm === "granted" ? (
          <span>✓ &nbsp;<strong>Email & Browser Reminders Active</strong> — You'll receive email alerts and browser popups.</span>
        ) : (
          <span>📧 &nbsp;<strong>Email Reminders Active</strong> — Set habit timers to receive automated email notifications.</span>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {perm !== "granted" && typeof Notification !== "undefined" && (
          <button 
            className="edit-btn" 
            style={{ fontSize: "11px", padding: "4px 10px" }} 
            onClick={request}
          >
            Enable Browser Popups
          </button>
        )}
        <button 
          onClick={() => setDismissed(true)} 
          style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "14px" }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
