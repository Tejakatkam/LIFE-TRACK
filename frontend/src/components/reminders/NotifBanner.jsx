import React, { useState } from "react";

export default function NotifBanner() {
  const [perm, setPerm] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  const request = async () => {
    const p = await Notification.requestPermission();
    setPerm(p);
  };

  if (perm === "granted")
    return (
      <div className="notif-banner granted">
        ✓ &nbsp;Notifications are active — you'll be reminded at your set times.
      </div>
    );

  if (perm === "denied")
    return (
      <div className="notif-banner denied">
        🔕 &nbsp;Notifications blocked in your browser settings. Enable them to
        receive reminders.
      </div>
    );

  return (
    <div className="notif-banner pending">
      🔔 &nbsp;Enable notifications to get reminded at your set times.
      <button onClick={request}>Enable</button>
    </div>
  );
}
