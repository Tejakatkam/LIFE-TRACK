import React, { useState, useEffect } from "react";

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const DEFAULT_HABITS = [
  { id: "skincare", name: "Skincare", icon: "✦" },
  { id: "diet", name: "Diet", icon: "◈" },
  { id: "steps", name: "Steps", icon: "◉" },
  { id: "water", name: "Water", icon: "◇" },
  { id: "sleep", name: "Sleep", icon: "☽" },
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates() {
  const t = new Date();
  const day = t.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(t);
  mon.setDate(t.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

export default function TrackingTab({ currentUser }) {
  const userId = currentUser?.id || currentUser?.username || "user";
  const todayStr = new Date().toISOString().split("T")[0];
  const weekDays = getWeekDates();

  const [trackData, setTrackData] = useState({});
  const [customHabits, setCustomHabits] = useState([]);
  const [removedHabits, setRemovedHabits] = useState([]);

  useEffect(() => {
    const td = lsGet(`track_${userId}`); setTrackData(td || {});
    const ch = lsGet(`customhabits_${userId}`); setCustomHabits(ch || []);
    const rh = lsGet(`removedhabits_${userId}`); setRemovedHabits(rh || []);
  }, [userId]);

  const isTracked = (habitId, dk) => !!trackData[`${dk}_${habitId}`];

  const toggleTrack = (habitId, dk) => {
    const key = `${dk}_${habitId}`;
    const updated = { ...trackData, [key]: !trackData[key] };
    setTrackData(updated);
    lsSet(`track_${userId}`, updated);
  };

  const visibleDefaults = DEFAULT_HABITS.filter(h => !removedHabits.includes(h.id));
  const allHabits = [...visibleDefaults, ...customHabits];

  const generateReport = () => {
    const lines = [
      "WEEKLY HABIT TRACKER",
      `${weekDays[0].toDateString()} — ${weekDays[6].toDateString()}`,
      "=".repeat(48), ""
    ];
    for (const h of allHabits) {
      const done = weekDays.filter(d => isTracked(h.id, d.toISOString().split("T")[0])).length;
      lines.push(`${h.icon || "◆"} ${h.name}: ${done}/7 days`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tracker-${weekDays[0].toISOString().split("T")[0]}.txt`;
    a.click();
    // Clear past week
    const nd = {};
    Object.entries(trackData).forEach(([k, v]) => { if (k.startsWith(todayStr)) nd[k] = v; });
    setTrackData(nd); lsSet(`track_${userId}`, nd);
    alert("Report downloaded. Past week data cleared.");
  };

  return (
    <>
      <div className="section-title">Weekly Overview</div>
      <div className="week-days">
        {weekDays.map((d, i) => (
          <div key={i} className="day-col">
            <div className="day-label">{DAYS_SHORT[i]}</div>
            <div className="day-date">{d.getDate()}</div>
          </div>
        ))}
      </div>

      {allHabits.map(h => (
        <div key={h.id} className="habit-track-row">
          <div className="habit-track-label">
            <span>{h.icon || "◆"}</span>
            <span>{h.name}</span>
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            {weekDays.map((d, i) => {
              const dk = d.toISOString().split("T")[0];
              const isT = dk === todayStr;
              const done = isTracked(h.id, dk);
              return (
                <div key={i} className={`track-cell${done ? " done" : ""}${isT ? " today-cell" : ""}`}
                  style={{ flex: 1 }} onClick={() => toggleTrack(h.id, dk)}>
                  {done ? "✓" : ""}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button className="pdf-btn" onClick={generateReport}>
        ↓ Download Weekly Report &amp; Reset
      </button>
    </>
  );
}
