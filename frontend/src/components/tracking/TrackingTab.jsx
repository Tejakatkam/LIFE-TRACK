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

  const generateReport = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/reports/weekly`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trackData, allHabits })
      });
      if (!res.ok) throw new Error("Failed to generate report");
      
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "LifeTrack - Weekly Report.pdf";
      a.click();

      // Rule #11: NO DATABASE RESET. NO HABIT RESET.
      alert("Weekly PDF Report downloaded.");
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF report. Ensure you are connected to the backend.");
    }
  };

  const [emailing, setEmailing] = useState(false);
  const emailReport = async () => {
    setEmailing(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/reports/email-weekly`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trackData, allHabits })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to email report");
      alert(data.message || "Weekly report sent to your email!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to send weekly report email.");
    } finally {
      setEmailing(false);
    }
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

      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button className="pdf-btn" style={{ flex: 1 }} onClick={generateReport}>
          📥 Download PDF Report
        </button>
        <button className="pdf-btn" style={{ flex: 1 }} onClick={emailReport} disabled={emailing}>
          {emailing ? "⏳ Sending Email..." : "📧 Email Weekly Report"}
        </button>
      </div>
    </>
  );
}
