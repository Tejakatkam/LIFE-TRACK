import React, { useState, useEffect } from "react";
import { fmt12 } from "../../utils/helpers";
import NotifBanner from "./NotifBanner";

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const DEFAULT_HABITS = [
  { id: "skincare", name: "Skincare", icon: "✦" },
  { id: "diet", name: "Diet", icon: "◈" },
  { id: "steps", name: "Steps", icon: "◉" },
  { id: "water", name: "Water", icon: "◇" },
  { id: "sleep", name: "Sleep", icon: "☽" },
];

export default function RemindersTab({ currentUser }) {
  const userId = currentUser?.id || currentUser?.username || "user";
  const [reminders, setReminders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [newTime, setNewTime] = useState("08:00");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    const stored = lsGet(`reminders_${userId}`);
    if (stored) {
      setReminders(stored);
    } else {
      // Load custom + removed habits to build full list
      const custom = lsGet(`customhabits_${userId}`) || [];
      const removed = lsGet(`removedhabits_${userId}`) || [];
      const allH = [...DEFAULT_HABITS.filter(h => !removed.includes(h.id)), ...custom];
      const init = allH.map(h => ({ id: h.id, habitName: h.name, icon: h.icon || "◆", timers: [] }));
      setReminders(init);
      lsSet(`reminders_${userId}`, init);
    }
  }, [userId]);

  const save = async (updated) => {
    setReminders(updated);
    lsSet(`reminders_${userId}`, updated);
    
    // Sync to backend so email scheduler works
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      if (!token) return;

      // Collect all flat timers
      const allTimers = [];
      updated.forEach(r => {
        (r.timers || []).forEach(t => {
          allTimers.push({
            habit_id: r.id,
            habit_name: r.habitName,
            icon: r.icon,
            time: t.time,
            label: t.label || ""
          });
        });
      });

      // We send a batch replace to a new sync route, or just loop post.
      // Since backend only has add/delete, we can just fetch all, delete all, and re-add.
      // But for now, let's just let the user know they need a sync route, or implement one quickly.
      await fetch(`${BASE_URL}/api/reminders/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ reminders: allTimers })
      });
    } catch(e) { console.error("Sync error", e); }
  };

  const addTimer = (habitId) => {
    if (!newTime) return;
    const updated = reminders.map(r =>
      r.id !== habitId ? r : {
        ...r,
        timers: [...(r.timers || []), { id: Date.now(), time: newTime, label: newLabel.trim() }]
      }
    );
    save(updated);
    setNewLabel("");
  };

  const delTimer = (habitId, timerId) => {
    const updated = reminders.map(r =>
      r.id !== habitId ? r : { ...r, timers: (r.timers || []).filter(t => t.id !== timerId) }
    );
    save(updated);
  };

  return (
    <>
      <NotifBanner />
      <div className="section-title">Habit Reminders <small>multiple timers per habit</small></div>

      {reminders.length === 0 && (
        <div className="empty">No habits found. Add habits from the Schedule tab first.</div>
      )}

      {reminders.map(r => {
        const isOpen = openId === r.id;
        return (
          <div key={r.id} className="reminder-card">
            <div className="reminder-header" onClick={() => setOpenId(isOpen ? null : r.id)}>
              <div className="reminder-habit-icon">{r.icon}</div>
              <div className="reminder-habit-name">{r.habitName}</div>
              <div className="reminder-count">{(r.timers || []).length} timer{(r.timers || []).length !== 1 ? "s" : ""}</div>
              <span className={`reminder-chevron${isOpen ? " open" : ""}`}>›</span>
            </div>

            {isOpen && (
              <div className="reminder-body">
                <div className="reminder-timers">
                  {(r.timers || []).length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--text2)", padding: "4px 0" }}>No timers yet. Add one below.</div>
                  )}
                  {(r.timers || []).map(t => (
                    <div key={t.id} className="reminder-timer">
                      <div className="timer-dot" />
                      <div className="timer-time">{fmt12(t.time)}</div>
                      {t.label && <div className="timer-label-txt">{t.label}</div>}
                      <button className="del-timer-btn" onClick={() => delTimer(r.id, t.id)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="add-timer-row">
                  <input className="timer-time-inp" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                  <input className="timer-lbl-inp" placeholder='Label e.g. "Morning"' value={newLabel}
                    onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addTimer(r.id)} />
                  <button className="add-timer-btn" onClick={() => addTimer(r.id)}>+ Add Timer</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
