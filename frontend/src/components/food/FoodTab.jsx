import React, { useState, useEffect } from "react";
import { todayKey, dateOffset, fmtDate, stepsBurned } from "../../utils/helpers";

function lsGet(k) {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

const WORKOUT_TYPES = [
  { id: "self", label: "Self / Custom Routine", icon: "✨" },
  { id: "gym", label: "Gym / Strength Training", icon: "🏋️" },
  { id: "running", label: "Running / Jogging", icon: "🏃" },
  { id: "walking", label: "Brisk Walking", icon: "🚶" },
  { id: "cycling", label: "Cycling / Biking", icon: "🚴" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "yoga", label: "Yoga / Stretching", icon: "🧘" },
  { id: "hiit", label: "HIIT / Circuit Training", icon: "⚡" },
  { id: "sports", label: "Sports (Badminton, Football, etc.)", icon: "🏸" },
];

export default function FoodTab({ currentUser }) {
  const [dayOffset, setDayOffset] = useState(0);
  const [foodLog, setFoodLog] = useState([]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [foodSteps, setFoodSteps] = useState("");

  // Food logging states
  const [foodMode, setFoodMode] = useState("manual"); // 'manual' | 'ai'
  const [fName, setFName] = useState("");
  const [fGrams, setFGrams] = useState("");
  const [fCal, setFCal] = useState("");
  
  const [foodAiQuery, setFoodAiQuery] = useState("");
  const [foodAiGrams, setFoodAiGrams] = useState("");
  const [foodAiLoading, setFoodAiLoading] = useState(false);
  const [foodAiResult, setFoodAiResult] = useState(null);
  const [foodAiErr, setFoodAiErr] = useState("");

  // Workout logging states
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutMode, setWorkoutMode] = useState("manual"); // 'manual' | 'ai'
  const [wType, setWType] = useState("Gym / Strength Training");
  const [wName, setWName] = useState("");
  const [wDuration, setWDuration] = useState("45");
  const [wCal, setWCal] = useState("");
  
  const [wAiType, setWAiType] = useState("Self / Custom Routine");
  const [wAiQuery, setWAiQuery] = useState("");
  const [wAiLoading, setWAiLoading] = useState(false);
  const [wAiResult, setWAiResult] = useState(null);
  const [wAiErr, setWAiErr] = useState("");

  const userId = currentUser?.id || currentUser?.username || "user";
  const viewDay = dayOffset === 0 ? todayKey() : dateOffset(dayOffset);
  const isToday = viewDay === todayKey();

  useEffect(() => {
    const fLog = lsGet(`food_${userId}_${viewDay}`);
    setFoodLog(fLog || []);
    const wLog = lsGet(`workout_${userId}_${viewDay}`);
    setWorkoutLog(wLog || []);
    const steps = lsGet(`steps_${userId}_${viewDay}`);
    setFoodSteps(steps !== null ? String(steps) : "");
  }, [userId, viewDay]);

  // Calorie Calculations
  const totalEaten = foodLog.reduce((s, f) => s + (Number(f.cal) || 0), 0);
  const stepCalBurned = stepsBurned(+foodSteps || 0);
  const workoutCalBurned = workoutLog.reduce((s, w) => s + (Number(w.cal) || 0), 0);
  const totalBurned = stepCalBurned + workoutCalBurned;
  const netCal = totalEaten - totalBurned;
  const isDeficit = netCal < 0;
  const isZero = netCal === 0;
  const netClass = isZero ? "zero" : isDeficit ? "deficit" : "surplus";

  // Food handlers
  const addFoodManual = () => {
    if (!fName || !fCal) return;
    const updated = [
      ...foodLog,
      {
        id: Date.now(),
        name: fName.trim(),
        grams: +fGrams || null,
        cal: Math.round(+fCal),
        source: "manual"
      }
    ];
    setFoodLog(updated);
    lsSet(`food_${userId}_${viewDay}`, updated);
    setFName(""); setFGrams(""); setFCal("");
  };

  const handleEstimateFoodAi = async () => {
    if (!foodAiQuery.trim()) {
      setFoodAiErr("Please enter the food name.");
      return;
    }
    if (!foodAiGrams || isNaN(foodAiGrams) || Number(foodAiGrams) <= 0) {
      setFoodAiErr("Please enter the amount in grams (e.g. 150).");
      return;
    }
    setFoodAiLoading(true);
    setFoodAiErr("");
    setFoodAiResult(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/user/estimate-food-calories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: foodAiQuery.trim(),
          grams: `${foodAiGrams.trim()}g`
        })
      });

      if (!res.ok) throw new Error("AI estimation service unavailable");
      const data = await res.json();
      setFoodAiResult(data);
    } catch (err) {
      setFoodAiErr(err.message || "Failed to estimate calories with AI");
    } finally {
      setFoodAiLoading(false);
    }
  };

  const addFoodFromAi = () => {
    if (!foodAiResult) return;
    const updated = [
      ...foodLog,
      {
        id: Date.now(),
        name: foodAiResult.name || foodAiQuery.trim(),
        grams: foodAiResult.portion || foodAiGrams.trim() || null,
        cal: Math.round(foodAiResult.calories || 200),
        source: "ai",
        macros: [foodAiResult.protein ? `P: ${foodAiResult.protein}` : null, foodAiResult.carbs ? `C: ${foodAiResult.carbs}` : null, foodAiResult.fat ? `F: ${foodAiResult.fat}` : null].filter(Boolean).join(" | ")
      }
    ];
    setFoodLog(updated);
    lsSet(`food_${userId}_${viewDay}`, updated);
    setFoodAiQuery("");
    setFoodAiGrams("");
    setFoodAiResult(null);
  };

  const delFood = (id) => {
    const updated = foodLog.filter(f => f.id !== id);
    setFoodLog(updated);
    lsSet(`food_${userId}_${viewDay}`, updated);
  };

  const updateFoodSteps = (val) => {
    setFoodSteps(val);
    lsSet(`steps_${userId}_${viewDay}`, val === "" ? 0 : +val);
  };

  // Workout handlers
  const addWorkoutManual = () => {
    const nameToUse = wName.trim() || wType;
    if (!wCal) return;
    const updated = [
      ...workoutLog,
      {
        id: Date.now(),
        type: wType,
        name: nameToUse,
        duration: +wDuration || 30,
        cal: Math.round(+wCal),
        source: "manual"
      }
    ];
    setWorkoutLog(updated);
    lsSet(`workout_${userId}_${viewDay}`, updated);
    setWName(""); setWCal(""); setWDuration("45");
    setShowAddWorkout(false);
  };

  const handleEstimateWorkoutAi = async () => {
    const isSelfMode = wAiType === "Self / Custom Routine";
    if (isSelfMode && !wAiQuery.trim()) {
      setWAiErr("Please describe your workout routine or choose an activity type.");
      return;
    }
    setWAiLoading(true);
    setWAiErr("");
    setWAiResult(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/user/estimate-workout-calories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          workout: wAiQuery.trim() || wAiType,
          duration: +wDuration || 45,
          type: wAiType
        })
      });

      if (!res.ok) throw new Error("AI workout service unavailable");
      const data = await res.json();
      setWAiResult(data);
    } catch (err) {
      setWAiErr(err.message || "Failed to estimate workout burn");
    } finally {
      setWAiLoading(false);
    }
  };

  const addWorkoutFromAi = () => {
    if (!wAiResult) return;
    const updated = [
      ...workoutLog,
      {
        id: Date.now(),
        type: wAiType,
        name: wAiResult.workoutName || wAiQuery.trim() || wAiType,
        duration: Number(wAiResult.duration || wDuration || 30),
        cal: Math.round(Number(wAiResult.caloriesBurned || 200)),
        source: "ai",
        intensity: wAiResult.intensity || "Moderate"
      }
    ];
    setWorkoutLog(updated);
    lsSet(`workout_${userId}_${viewDay}`, updated);
    setWAiQuery("");
    setWAiResult(null);
    setShowAddWorkout(false);
  };

  const delWorkout = (id) => {
    const updated = workoutLog.filter(w => w.id !== id);
    setWorkoutLog(updated);
    lsSet(`workout_${userId}_${viewDay}`, updated);
  };

  return (
    <>
      <style>{`
        .tab-mode-selector {
          display: flex;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 14px;
          gap: 4px;
        }
        .tab-mode-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text2);
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tab-mode-btn.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          font-weight: 600;
        }
        .ai-result-box {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          margin-top: 12px;
          animation: fadeIn 0.2s ease;
        }
        .workout-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          margin-top: 14px;
          margin-bottom: 24px;
        }
        .workout-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-top: 8px;
        }
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          background: rgba(197, 160, 115, 0.15);
          color: var(--accent);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* Date Navigation */}
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => setDayOffset(d => d - 1)}>‹</button>
        <div className="date-str">{fmtDate(viewDay)}</div>
        {dayOffset < 0 && (
          <button className="date-nav-btn" onClick={() => setDayOffset(d => d + 1)}>›</button>
        )}
      </div>

      {/* Calorie Summary Overview Card */}
      <div className="summary-card">
        <div className="cal-row">
          <div className="cal-chip">
            <div className="cal-chip-label">Consumed</div>
            <div className="cal-chip-val">{totalEaten}<span>kcal</span></div>
          </div>
          <div className="cal-chip">
            <div className="cal-chip-label">Total Burned</div>
            <div className="cal-chip-val green">−{totalBurned}<span>kcal</span></div>
          </div>
          <div className="cal-chip">
            <div className="cal-chip-label">Net Balance</div>
            <div className={`cal-chip-val ${netClass}`}>
              {isDeficit ? "−" : "+"}{Math.abs(netCal)}<span>kcal</span>
            </div>
          </div>
        </div>

        {/* Burned Breakdown Note */}
        {(stepCalBurned > 0 || workoutCalBurned > 0) && (
          <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", margin: "8px 0 2px" }}>
            Burned: {stepCalBurned} kcal (steps) + {workoutCalBurned} kcal (workouts)
          </div>
        )}

        <div className={`net-banner ${netClass}`} style={{ marginTop: 10 }}>
          <div>
            <div className={`net-label ${netClass}`}>
              {isZero ? "Perfectly balanced" : isDeficit ? "Calorie Deficit ↓" : "Calorie Surplus ↑"}
            </div>
            <div className="net-desc">
              {isZero ? "Calories in = calories out"
                : isDeficit ? `Burned ${Math.abs(netCal)} kcal more than consumed`
                : `Consumed ${netCal} kcal more than burned`}
            </div>
          </div>
          <div className={`net-num ${netClass}`}>{isDeficit ? "−" : "+"}{Math.abs(netCal)}</div>
        </div>
      </div>

      {/* Steps Today Card */}
      <div className="steps-card">
        <div className="steps-icon">◉</div>
        <div className="steps-content">
          <div className="steps-label">Walking Steps {isToday ? "today" : fmtDate(viewDay)}</div>
          <div className="steps-row">
            <input 
              className="steps-inp" 
              type="number" 
              placeholder="0" 
              value={foodSteps}
              onChange={e => updateFoodSteps(e.target.value)} 
              readOnly={!isToday} 
            />
            <span className="steps-burned">≈ {stepCalBurned} kcal burned</span>
          </div>
        </div>
      </div>

      {/* Workouts & Activity Section (Directly Below Steps) */}
      <div className="workout-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>
              Workouts & Exercise
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>
              Gym, Cardio, Sports & Active Burn ({workoutCalBurned} kcal burned)
            </div>
          </div>
          {isToday && (
            <button 
              className="add-btn" 
              style={{ padding: "6px 14px", fontSize: 12, borderRadius: 20 }}
              onClick={() => setShowAddWorkout(v => !v)}
            >
              {showAddWorkout ? "✕ Close" : "+ Add Workout"}
            </button>
          )}
        </div>

        {/* Add Workout Form with Dual Mode */}
        {showAddWorkout && isToday && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div className="tab-mode-selector">
              <button 
                className={`tab-mode-btn ${workoutMode === "manual" ? "active" : ""}`}
                onClick={() => setWorkoutMode("manual")}
              >
                ✏️ Manual Log
              </button>
              <button 
                className={`tab-mode-btn ${workoutMode === "ai" ? "active" : ""}`}
                onClick={() => setWorkoutMode("ai")}
              >
                ✦ AI Burn Predictor
              </button>
            </div>

            {workoutMode === "manual" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 10 }}>
                  <div className="form-field">
                    <label>Activity Type</label>
                    <select className="inp" value={wType} onChange={e => setWType(e.target.value)}>
                      {WORKOUT_TYPES.filter(t => t.id !== "self").map(t => (
                        <option key={t.id} value={t.label}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Duration (mins)</label>
                    <input className="inp" type="number" placeholder="45" value={wDuration} onChange={e => setWDuration(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Calories Burned</label>
                    <input className="inp" type="number" placeholder="e.g. 250" value={wCal} onChange={e => setWCal(e.target.value)} onKeyDown={e => e.key === "Enter" && addWorkoutManual()} />
                  </div>
                </div>
                <div className="form-field">
                  <label>Workout Note / Routine (Optional)</label>
                  <input className="inp" placeholder="e.g. Chest & Triceps / 5km Treadmill Run" value={wName} onChange={e => setWName(e.target.value)} onKeyDown={e => e.key === "Enter" && addWorkoutManual()} />
                </div>
                <button className="add-btn" style={{ width: "100%", marginTop: 4 }} onClick={addWorkoutManual}>
                  + Log Workout ({wCal || 0} kcal)
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 10 }}>
                  <div className="form-field">
                    <label>Activity Type</label>
                    <select className="inp" value={wAiType} onChange={e => setWAiType(e.target.value)}>
                      {WORKOUT_TYPES.map(t => (
                        <option key={t.id} value={t.label}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Duration (mins)</label>
                    <input className="inp" type="number" placeholder="60" value={wDuration} onChange={e => setWDuration(e.target.value)} />
                  </div>
                </div>

                <div className="form-field">
                  <label>
                    {wAiType === "Self / Custom Routine" 
                      ? "Describe Workout & Routine" 
                      : `Routine / Specific Details for ${wAiType} (Optional)`}
                  </label>
                  <textarea 
                    className="inp" 
                    placeholder={wAiType === "Self / Custom Routine"
                      ? 'e.g. "Heavy leg day squatting and lunges for 45 mins" or "30 mins HIIT kettlebell workout"'
                      : `e.g. "Steady pace on incline" or leave blank to estimate based on ${wAiType}`}
                    value={wAiQuery} 
                    onChange={e => setWAiQuery(e.target.value)}
                    style={{ minHeight: 50, resize: "vertical" }}
                  />
                </div>

                <button 
                  className="add-btn" 
                  style={{ width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} 
                  onClick={handleEstimateWorkoutAi}
                  disabled={wAiLoading}
                >
                  {wAiLoading ? "Analyzing Metabolic Burn..." : "✦ Predict Calorie Burn"}
                </button>

                {wAiErr && <div className="err">{wAiErr}</div>}

                {/* AI Workout Result Preview */}
                {wAiResult && (
                  <div className="ai-result-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                          {wAiResult.workoutName} <span className="ai-badge">✦ AI Calculated</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                          {wAiResult.duration} mins • Intensity: <strong>{wAiResult.intensity}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: "var(--green)" }}>
                        −{wAiResult.caloriesBurned} <span style={{ fontSize: 13, color: "var(--text2)" }}>kcal</span>
                      </div>
                    </div>
                    {wAiResult.explanation && (
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, fontStyle: "italic", borderTop: "1px dashed var(--border)", paddingTop: 6 }}>
                        💡 {wAiResult.explanation}
                      </div>
                    )}
                    <button className="add-btn" style={{ width: "100%", marginTop: 12 }} onClick={addWorkoutFromAi}>
                      ✓ Add {wAiResult.caloriesBurned} kcal Burn to Log
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Workout Log List */}
        {workoutLog.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: "8px 0" }}>
            No workouts logged {isToday ? "yet today" : "on this day"}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {workoutLog.map(w => (
              <div key={w.id} className="workout-item">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {w.name} {w.source === "ai" && <span className="ai-badge">✦ AI</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>
                      {w.duration ? `${w.duration} mins` : "Workout"} • {w.type || "Exercise"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>
                    −{w.cal} kcal
                  </div>
                  {isToday && (
                    <button className="del-btn" onClick={() => delWorkout(w.id)} title="Delete workout">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Food Section with Dual Modes */}
      {isToday && (
        <>
          <div className="section-title">Log Food & Nutrition</div>
          
          <div className="add-form" style={{ marginBottom: 20 }}>
            {/* Mode Switcher */}
            <div className="tab-mode-selector">
              <button 
                className={`tab-mode-btn ${foodMode === "manual" ? "active" : ""}`}
                onClick={() => setFoodMode("manual")}
              >
                ✏️ Manual Calorie Entry
              </button>
              <button 
                className={`tab-mode-btn ${foodMode === "ai" ? "active" : ""}`}
                onClick={() => setFoodMode("ai")}
              >
                ✦ AI Calorie Estimator
              </button>
            </div>

            {foodMode === "manual" ? (
              <div className="form-row">
                <div className="form-field f-name">
                  <label>Food name</label>
                  <input 
                    className="inp" 
                    placeholder="e.g. Idli, Rice, Apple, Chicken..." 
                    value={fName}
                    onChange={e => setFName(e.target.value)} 
                    onKeyDown={e => e.key === "Enter" && addFoodManual()} 
                  />
                </div>
                <div className="form-field f-num">
                  <label>Portion / Grams</label>
                  <input className="inp" type="number" placeholder="100g" value={fGrams} onChange={e => setFGrams(e.target.value)} />
                </div>
                <div className="form-field f-num">
                  <label>Calories (kcal)</label>
                  <input 
                    className="inp" 
                    type="number" 
                    placeholder="kcal" 
                    value={fCal}
                    onChange={e => setFCal(e.target.value)} 
                    onKeyDown={e => e.key === "Enter" && addFoodManual()} 
                  />
                </div>
                <button className="add-btn" onClick={addFoodManual}>+ Add</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="form-row">
                  <div className="form-field f-name">
                    <label>Food name</label>
                    <input 
                      className="inp" 
                      placeholder="e.g. Rice, Paneer Curry, Chicken, Dosa..." 
                      value={foodAiQuery}
                      onChange={e => setFoodAiQuery(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && handleEstimateFoodAi()} 
                    />
                  </div>
                  <div className="form-field f-num">
                    <label>Grams</label>
                    <input 
                      className="inp" 
                      type="number" 
                      placeholder="100" 
                      value={foodAiGrams} 
                      onChange={e => setFoodAiGrams(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && handleEstimateFoodAi()} 
                    />
                  </div>
                  <button 
                    className="add-btn" 
                    style={{ minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={handleEstimateFoodAi}
                    disabled={foodAiLoading}
                  >
                    {foodAiLoading ? "Estimating..." : "✦ Estimate Calories"}
                  </button>
                </div>

                {foodAiErr && <div className="err" style={{ marginTop: 2 }}>{foodAiErr}</div>}

                {/* AI Food Result Preview */}
                {foodAiResult && (
                  <div className="ai-result-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                          {foodAiResult.name} <span className="ai-badge">✦ AI Calculated</span>
                        </div>
                        {foodAiResult.portion && (
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                            Portion: <strong>{foodAiResult.portion}</strong>
                          </div>
                        )}
                        {(foodAiResult.protein || foodAiResult.carbs || foodAiResult.fat) && (
                          <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
                            {[foodAiResult.protein ? `Protein: ${foodAiResult.protein}` : null, foodAiResult.carbs ? `Carbs: ${foodAiResult.carbs}` : null, foodAiResult.fat ? `Fat: ${foodAiResult.fat}` : null].filter(Boolean).join(" • ")}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>
                        {foodAiResult.calories} <span style={{ fontSize: 13, color: "var(--text2)" }}>kcal</span>
                      </div>
                    </div>

                    {foodAiResult.explanation && (
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, fontStyle: "italic", borderTop: "1px dashed var(--border)", paddingTop: 6 }}>
                        💡 {foodAiResult.explanation}
                      </div>
                    )}

                    <button className="add-btn" style={{ width: "100%", marginTop: 12 }} onClick={addFoodFromAi}>
                      ✓ Add {foodAiResult.calories} kcal to Food Log
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Food Log List */}
      <div className="section-title">Food Log <small>{fmtDate(viewDay)}</small></div>
      {foodLog.length === 0 && (
        <div className="empty">No food logged {isToday ? "yet today" : "on this day"}</div>
      )}
      {foodLog.map(f => (
        <div key={f.id} className="food-item">
          <div className="food-dot" />
          <div className="food-name">
            {f.name} {f.source === "ai" && <span className="ai-badge">✦ AI</span>}
            {f.macros && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{f.macros}</div>}
          </div>
          {f.grams && <div className="food-meta">{typeof f.grams === "number" ? `${f.grams}g` : f.grams}</div>}
          <div className="food-cal">{f.cal} kcal</div>
          {isToday && <button className="del-btn" onClick={() => delFood(f.id)}>×</button>}
        </div>
      ))}
    </>
  );
}
