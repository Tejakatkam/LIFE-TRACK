import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import { fmt12 } from "../../utils/helpers";
import NotifBanner from "./NotifBanner";

export default function RemindersTab({ currentUser }) {
  const [reminders, setReminders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [newTime, setNewTime] = useState("08:00");
  const [newLabel, setNewLabel] = useState("");

  // ✅ FETCH REMINDERS FROM BACKEND
  useEffect(() => {
    if (!currentUser) return;

    const fetchReminders = async () => {
      try {
        const data = await apiRequest("/reminders");
        setReminders(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchReminders();
  }, [currentUser]);

  // ✅ ADD TIMER
  const addTimer = async (habitId, habitName, icon) => {
    if (!newTime) return;

    try {
      await apiRequest("/reminders", "POST", {
        habit_id: habitId,
        habit_name: habitName,
        icon,
        time: newTime,
        label: newLabel.trim(),
      });

      const updated = await apiRequest("/reminders");
      setReminders(updated);

      setNewLabel("");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ DELETE TIMER
  const delTimer = async (id) => {
    try {
      await apiRequest(`/reminders/${id}`, "DELETE");

      const updated = await apiRequest("/reminders");
      setReminders(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔄 GROUP TIMERS BY HABIT
  const grouped = reminders.reduce((acc, r) => {
    if (!acc[r.habit_id]) {
      acc[r.habit_id] = {
        habitName: r.habit_name,
        icon: r.icon,
        timers: [],
      };
    }
    acc[r.habit_id].timers.push(r);
    return acc;
  }, {});

  return (
    <>
      <NotifBanner />

      <div className="section-title">
        Habit Reminders <small>multiple timers per habit</small>
      </div>

      {Object.entries(grouped).map(([habitId, data]) => {
        const isOpen = openId === habitId;

        return (
          <div key={habitId} className="reminder-card">
            <div
              className="reminder-header"
              onClick={() => setOpenId(isOpen ? null : habitId)}
            >
              <div className="reminder-habit-icon">{data.icon}</div>
              <div className="reminder-habit-name">{data.habitName}</div>
              <div className="reminder-count">
                {data.timers.length} timer
                {data.timers.length !== 1 ? "s" : ""}
              </div>
              <span className={`reminder-chevron${isOpen ? " open" : ""}`}>
                ›
              </span>
            </div>

            {isOpen && (
              <div className="reminder-body">
                <div className="reminder-timers">
                  {data.timers.map((t) => (
                    <div key={t.id} className="reminder-timer">
                      <div className="timer-dot" />
                      <div className="timer-time">{fmt12(t.time)}</div>
                      {t.label && (
                        <div className="timer-label-txt">{t.label}</div>
                      )}
                      <button
                        className="del-timer-btn"
                        onClick={() => delTimer(t.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-timer-row">
                  <input
                    className="timer-time-inp"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />

                  <input
                    className="timer-lbl-inp"
                    placeholder='Label e.g. "Morning"'
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />

                  <button
                    className="add-timer-btn"
                    onClick={() => addTimer(habitId, data.habitName, data.icon)}
                  >
                    + Add Timer
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
