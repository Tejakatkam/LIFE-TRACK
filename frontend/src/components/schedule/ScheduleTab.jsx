import React, { useState, useEffect } from "react";

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const DEFAULT_HABITS = [
  { id: "skincare", name: "Skincare", icon: "✦", sub: "Morning & night routine", type: "toggle" },
  { id: "diet", name: "Diet", icon: "◈", sub: "Proper diet, balanced meal today", type: "toggle" },
  { id: "steps", name: "Steps", icon: "◉", sub: "Daily step goal", type: "steps" },
  { id: "water", name: "Water", icon: "◇", sub: "8 glasses of water", type: "toggle" },
  { id: "sleep", name: "Sleep", icon: "☽", sub: "7-9 hours of sleep", type: "toggle" },
];

const HABIT_ICONS = ["◆","★","♡","☀","◈","✦","◉","◇","◑","⬡","⟡","◎","❋","⊕","☽","⚡","✿","◐","⬟","⊛"];

const aiDescCss = `
.plus-habit-btn { display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--accent);color:var(--bg);border:none;border-radius:20px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;white-space:nowrap; }
.plus-habit-btn:hover { background:var(--accent2); }
.add-habit-panel { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:18px;animation:slideIn 0.25s ease; }
.habit-icon-grid { display:flex;flex-wrap:wrap;gap:8px;margin-top:6px; }
.habit-icon-opt { width:36px;height:36px;border:1px solid var(--border);border-radius:9px;background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all 0.15s; }
.habit-icon-opt:hover { border-color:var(--accent2); }
.habit-icon-opt.sel { background:var(--accent);border-color:var(--accent); }
.ai-desc-btn { padding:7px 14px;background:none;border:1px solid var(--accent);border-radius:8px;font-family:'Jost',sans-serif;font-size:12px;color:var(--accent);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;white-space:nowrap; }
.ai-desc-btn:hover { background:var(--accent);color:var(--bg); }
.ai-desc-btn:disabled { opacity:0.5;cursor:not-allowed; }
.del-habit-btn { width:22px;height:22px;border-radius:50%;background:none;border:1px solid var(--border);cursor:pointer;font-size:13px;color:var(--text3);display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0; }
.del-habit-btn:hover { background:var(--red-bg);border-color:var(--red);color:var(--red); }
`;

function AddHabitPanel({ onAdd }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("◆");
  const [apiKey, setApiKey] = useState(lsGet("gemini_api_key") || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");

  const generateDesc = async () => {
    if (!name.trim()) { setAiErr("Enter a habit name first."); return; }
    if (!apiKey.trim()) { setAiErr("Enter your Gemini API key below."); return; }
    
    lsSet("gemini_api_key", apiKey.trim());
    setAiLoading(true); setAiErr("");
    
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Write a short, motivating description for a daily habit called "${name.trim()}". Max 10 words. No quotes. Just the description.` }]
          }],
          generationConfig: { maxOutputTokens: 80 }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setDesc(text.trim());
    } catch(err) { setAiErr(err.message || "Could not generate — check API key."); }
    setAiLoading(false);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ id: `custom_${Date.now()}`, name: name.trim(), sub: desc.trim() || name.trim(), icon, type: "toggle" });
    setName(""); setDesc(""); setIcon("◆");
  };

  return (
    <>
      <style>{aiDescCss}</style>
      <div className="add-habit-panel">
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 400, color: "var(--text)", marginBottom: 16, letterSpacing: "0.03em" }}>New Daily Habit</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 5 }}>Habit Name</div>
            <input className="inp" placeholder="e.g. Journaling, Reading, Meditation..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 5 }}>Icon</div>
            <div className="habit-icon-grid">
              {HABIT_ICONS.map(ic => (
                <div key={ic} className={`habit-icon-opt${icon === ic ? " sel" : ""}`} onClick={() => setIcon(ic)}>{ic}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 5 }}>Description</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea className="inp" placeholder="Write a short description, or generate with AI ✦" value={desc} onChange={e => setDesc(e.target.value)} style={{ resize: "vertical", minHeight: 56, flex: 1 }} />
              <button className="ai-desc-btn" onClick={generateDesc} disabled={aiLoading}>
                {aiLoading ? "…" : "✦"} {aiLoading ? "Thinking" : "AI"}
              </button>
            </div>
            <input 
              type="password" 
              className="inp" 
              placeholder="Enter Gemini API Key to use AI" 
              value={apiKey} 
              onChange={e => { setApiKey(e.target.value); lsSet("gemini_api_key", e.target.value); }} 
              style={{ marginTop: 8, fontSize: 12, padding: "6px 10px" }} 
            />
            {aiErr && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{aiErr}</div>}
          </div>
          <button className="add-btn" style={{ width: "100%" }} onClick={handleAdd}>+ Add Habit</button>
        </div>
      </div>
    </>
  );
}

export default function ScheduleTab({ currentUser }) {
  const userId = currentUser?.id || currentUser?.username || "user";
  const todayStr = new Date().toISOString().split("T")[0];

  const [wakeTime, setWakeTime] = useState("06:30");
  const [sleepTime, setSleepTime] = useState("22:30");
  const [trackData, setTrackData] = useState({});
  const [stepGoal, setStepGoal] = useState("10000");
  const [customHabits, setCustomHabits] = useState([]);
  const [removedHabits, setRemovedHabits] = useState([]);
  const [showAddHabit, setShowAddHabit] = useState(false);

  useEffect(() => {
    const sc = lsGet(`schedule_${userId}`);
    if (sc) { setWakeTime(sc.wake || "06:30"); setSleepTime(sc.sleep || "22:30"); }
    const td = lsGet(`track_${userId}`); setTrackData(td || {});
    const sg = lsGet(`stepgoal_${userId}`); if (sg) setStepGoal(sg);
    const ch = lsGet(`customhabits_${userId}`); setCustomHabits(ch || []);
    const rh = lsGet(`removedhabits_${userId}`); setRemovedHabits(rh || []);
  }, [userId]);

  const saveSchedule = (wake, sleep) => lsSet(`schedule_${userId}`, { wake, sleep });

  const toggleTrack = (habitId) => {
    const key = `${todayStr}_${habitId}`;
    const updated = { ...trackData, [key]: !trackData[key] };
    setTrackData(updated);
    lsSet(`track_${userId}`, updated);
  };

  const isTracked = (habitId) => !!trackData[`${todayStr}_${habitId}`];

  const visibleDefaults = DEFAULT_HABITS.filter(h => !removedHabits.includes(h.id));
  const allHabits = [...visibleDefaults, ...customHabits];

  const removeHabit = (h) => {
    const isDefault = DEFAULT_HABITS.find(d => d.id === h.id);
    if (isDefault) {
      const updated = [...removedHabits, h.id];
      setRemovedHabits(updated);
      lsSet(`removedhabits_${userId}`, updated);
    } else {
      const updated = customHabits.filter(c => c.id !== h.id);
      setCustomHabits(updated);
      lsSet(`customhabits_${userId}`, updated);
    }
  };

  const restoreHabit = (id) => {
    const updated = removedHabits.filter(r => r !== id);
    setRemovedHabits(updated);
    lsSet(`removedhabits_${userId}`, updated);
  };

  return (
    <>
      <style>{aiDescCss}</style>

      <div className="section-title">Daily Schedule</div>
      <div className="schedule-grid">
        <div className="schedule-card">
          <label>Wake Up</label>
          <input className="time-inp" type="time" value={wakeTime} onChange={e => { setWakeTime(e.target.value); saveSchedule(e.target.value, sleepTime); }} />
        </div>
        <div className="schedule-card">
          <label>Sleep Time</label>
          <input className="time-inp" type="time" value={sleepTime} onChange={e => { setSleepTime(e.target.value); saveSchedule(wakeTime, e.target.value); }} />
        </div>
      </div>

      <div className="divider" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Daily Habits</div>
        <button className="plus-habit-btn" onClick={() => setShowAddHabit(v => !v)}>
          {showAddHabit ? "✕ Cancel" : "+ Add Habit"}
        </button>
      </div>

      {showAddHabit && (
        <AddHabitPanel onAdd={habit => {
          const updated = [...customHabits, habit];
          setCustomHabits(updated);
          lsSet(`customhabits_${userId}`, updated);
          setShowAddHabit(false);
        }} />
      )}

      {/* Restore strip for removed defaults */}
      {removedHabits.length > 0 && (
        <div style={{ marginBottom: 12, fontSize: 11, color: "var(--text2)" }}>
          {removedHabits.length} habit{removedHabits.length > 1 ? "s" : ""} hidden —{" "}
          {DEFAULT_HABITS.filter(h => removedHabits.includes(h.id)).map(h => (
            <button key={h.id} onClick={() => restoreHabit(h.id)}
              style={{ marginLeft: 6, padding: "2px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 11, color: "var(--accent)", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              + restore {h.name}
            </button>
          ))}
        </div>
      )}

      {allHabits.map(h => (
        <div key={h.id} className="habit-row">
          <div className="habit-info">
            <div className="habit-icon">{h.icon || "◆"}</div>
            <div>
              <div className="habit-name">{h.name}</div>
              <div className="habit-sub">{h.sub}</div>
            </div>
          </div>
          <div className="habit-actions">
            {h.type === "steps" && (
              <input className="steps-goal-inp" type="number" value={stepGoal}
                onChange={e => { setStepGoal(e.target.value); lsSet(`stepgoal_${userId}`, e.target.value); }} placeholder="Goal" />
            )}
            <button className={`toggle${isTracked(h.id) ? " on" : ""}`} onClick={() => toggleTrack(h.id)} />
            <button className="del-habit-btn" onClick={() => removeHabit(h)} title="Remove habit">×</button>
          </div>
        </div>
      ))}
    </>
  );
}
