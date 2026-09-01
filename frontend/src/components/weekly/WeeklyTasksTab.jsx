import React, { useState, useEffect } from "react";
import { fmt12, currentDayName } from "../../utils/helpers";
import NotifBanner from "../reminders/NotifBanner";

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyTasksTab({ currentUser }) {
  const userId = currentUser?.id || currentUser?.username || "user";
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskDay, setTaskDay] = useState("Monday");
  const [taskTime, setTaskTime] = useState("09:00");
  const todayDay = currentDayName();

  useEffect(() => {
    const stored = lsGet(`weekly_${userId}`);
    setWeeklyTasks(stored || []);
  }, [userId]);

  const save = async (updated) => {
    setWeeklyTasks(updated);
    lsSet(`weekly_${userId}`, updated);

    // Sync to backend database so weekly email reminders work!
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${BASE_URL}/api/weekly/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tasks: updated })
      });
    } catch (e) {
      console.error("Weekly task sync error:", e);
    }
  };

  const addTask = () => {
    if (!taskName.trim()) return;
    save([...weeklyTasks, { id: Date.now(), name: taskName.trim(), day: taskDay, reminderTime: taskTime, doneThisWeek: false }]);
    setTaskName(""); setTaskDay("Monday"); setTaskTime("09:00");
  };

  const toggleDone = (id) => save(weeklyTasks.map(t => t.id === id ? { ...t, doneThisWeek: !t.doneThisWeek } : t));
  const delTask = (id) => save(weeklyTasks.filter(t => t.id !== id));

  const grouped = DAYS.reduce((acc, d) => { acc[d] = weeklyTasks.filter(t => t.day === d); return acc; }, {});

  return (
    <>
      <NotifBanner />
      <div className="section-title">Add Weekly Task</div>
      <div className="add-weekly-form">
        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field" style={{ flex: 2, minWidth: 140 }}>
            <label>Task name</label>
            <input className="inp" placeholder="e.g. Oil hair, Iron clothes..." value={taskName}
              onChange={e => setTaskName(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} />
          </div>
          <div className="form-field" style={{ flex: 1, minWidth: 90 }}>
            <label>Remind at</label>
            <input className="inp" type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 8 }}>Day of the week</div>
          <div className="day-selector">
            {DAYS.map(d => (
              <div key={d} className={`day-chip${taskDay === d ? " sel" : ""}`} onClick={() => setTaskDay(d)}>{d.slice(0, 3)}</div>
            ))}
          </div>
        </div>
        <button className="add-btn" style={{ width: "100%" }} onClick={addTask}>+ Add Task</button>
      </div>

      {weeklyTasks.length === 0 && <div className="empty">No weekly tasks yet</div>}

      {DAYS.map(day => {
        const tasks = grouped[day];
        if (!tasks.length) return null;
        const isToday = day === todayDay;
        return (
          <div key={day} style={{ marginBottom: 20 }}>
            <div className="today-section-label" style={{ color: isToday ? "var(--accent)" : "var(--text2)" }}>
              {day}
              {isToday && <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--accent)", color: "var(--bg)", borderRadius: 10 }}>Today</span>}
            </div>
            {tasks.map(task => (
              <div key={task.id} className="weekly-task">
                <div className={`task-check${task.doneThisWeek ? " done" : ""}`} onClick={() => toggleDone(task.id)}>
                  {task.doneThisWeek ? "✓" : ""}
                </div>
                <div className="weekly-task-info">
                  <div className={`weekly-task-name${task.doneThisWeek ? " struck" : ""}`}>{task.name}</div>
                  <div className="weekly-task-meta">
                    <span className={`day-badge${isToday ? " today-badge" : ""}`}>{day.slice(0, 3)}</span>
                    reminder {fmt12(task.reminderTime)}
                  </div>
                </div>
                <button className="del-btn" onClick={() => delTask(task.id)}>×</button>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
