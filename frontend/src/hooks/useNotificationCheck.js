import { useEffect, useRef } from "react";

export default function useNotifCheck(reminders, weeklyTasks, currentUser) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (!currentUser) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const check = () => {
      if (
        typeof Notification === "undefined" ||
        Notification.permission !== "granted"
      )
        return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const timeNow = `${hh}:${mm}`;
      const dayNow = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][now.getDay()];
      (reminders || []).forEach((r) => {
        (r.timers || []).forEach((t) => {
          if (t.time === timeNow)
            new Notification(`⏰ ${r.habitName}`, {
              body: t.label || `Time for your ${r.habitName} routine!`,
            });
        });
      });
      (weeklyTasks || []).forEach((task) => {
        if (
          task.day === dayNow &&
          task.reminderTime === timeNow &&
          !task.doneThisWeek
        )
          new Notification(`📋 Weekly Task`, {
            body: `Don't forget: ${task.name}`,
          });
      });
    };
    timerRef.current = setInterval(check, 60000);
    return () => clearInterval(timerRef.current);
  }, [reminders, weeklyTasks, currentUser]);
}
