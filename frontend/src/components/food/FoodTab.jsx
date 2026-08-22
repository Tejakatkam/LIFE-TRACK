import React, { useState, useEffect } from "react";
import { todayKey, dateOffset, fmtDate, stepsBurned } from "../../utils/helpers";

// Use localStorage for data persistence (works in real deployed apps)
function lsGet(k) {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export default function FoodTab({ currentUser }) {
  const [dayOffset, setDayOffset] = useState(0);
  const [foodLog, setFoodLog] = useState([]);
  const [foodSteps, setFoodSteps] = useState("");
  const [fName, setFName] = useState("");
  const [fGrams, setFGrams] = useState("");
  const [fCal, setFCal] = useState("");

  const userId = currentUser?.id || currentUser?.username || "user";
  const viewDay = dayOffset === 0 ? todayKey() : dateOffset(dayOffset);
  
  useEffect(() => {
    const log = lsGet(`food_${userId}_${viewDay}`);
    setFoodLog(log || []);
    const steps = lsGet(`steps_${userId}_${viewDay}`);
    setFoodSteps(steps !== null ? String(steps) : "");
  }, [userId, viewDay]);
  const isToday = viewDay === todayKey();

  const totalEaten = foodLog.reduce((s, f) => s + f.cal, 0);
  const burned = stepsBurned(+foodSteps || 0);
  const netCal = totalEaten - burned;
  const isDeficit = netCal < 0;
  const isZero = netCal === 0;
  const netClass = isZero ? "zero" : isDeficit ? "deficit" : "surplus";

  const addFood = () => {
    if (!fName || !fCal) return;
    const updated = [...foodLog, { id: Date.now(), name: fName.trim(), grams: +fGrams || null, cal: +fCal }];
    setFoodLog(updated);
    lsSet(`food_${userId}_${viewDay}`, updated);
    setFName(""); setFGrams(""); setFCal("");
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

  return (
    <>
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => setDayOffset(d => d - 1)}>‹</button>
        <div className="date-str">{fmtDate(viewDay)}</div>
        {dayOffset < 0 && (
          <button className="date-nav-btn" onClick={() => setDayOffset(d => d + 1)}>›</button>
        )}
      </div>

      <div className="summary-card">
        <div className="cal-row">
          <div className="cal-chip">
            <div className="cal-chip-label">Consumed</div>
            <div className="cal-chip-val">{totalEaten}<span>kcal</span></div>
          </div>
          <div className="cal-chip">
            <div className="cal-chip-label">Burned</div>
            <div className="cal-chip-val green">−{burned}<span>kcal</span></div>
          </div>
          <div className="cal-chip">
            <div className="cal-chip-label">Net</div>
            <div className={`cal-chip-val ${netClass}`}>{isDeficit ? "−" : "+"}{Math.abs(netCal)}<span>kcal</span></div>
          </div>
        </div>
        <div className={`net-banner ${netClass}`}>
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

      <div className="steps-card">
        <div className="steps-icon">◉</div>
        <div className="steps-content">
          <div className="steps-label">Steps {isToday ? "today" : fmtDate(viewDay)}</div>
          <div className="steps-row">
            <input className="steps-inp" type="number" placeholder="0" value={foodSteps}
              onChange={e => updateFoodSteps(e.target.value)} readOnly={!isToday} />
            <span className="steps-burned">≈ {burned} kcal burned</span>
          </div>
        </div>
      </div>

      {isToday && (
        <>
          <div className="section-title">Log Food</div>
          <div className="add-form">
            <div className="form-row">
              <div className="form-field f-name">
                <label>Food name</label>
                <input className="inp" placeholder="e.g. Idli, Rice, Apple..." value={fName}
                  onChange={e => setFName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFood()} />
              </div>
              <div className="form-field f-num">
                <label>Grams</label>
                <input className="inp" type="number" placeholder="100g" value={fGrams} onChange={e => setFGrams(e.target.value)} />
              </div>
              <div className="form-field f-num">
                <label>Calories</label>
                <input className="inp" type="number" placeholder="kcal" value={fCal}
                  onChange={e => setFCal(e.target.value)} onKeyDown={e => e.key === "Enter" && addFood()} />
              </div>
              <button className="add-btn" onClick={addFood}>+ Add</button>
            </div>
          </div>
        </>
      )}

      <div className="section-title">Food Log <small>{fmtDate(viewDay)}</small></div>
      {foodLog.length === 0 && (
        <div className="empty">No food logged {isToday ? "yet today" : "on this day"}</div>
      )}
      {foodLog.map(f => (
        <div key={f.id} className="food-item">
          <div className="food-dot" />
          <div className="food-name">{f.name}</div>
          {f.grams && <div className="food-meta">{f.grams}g</div>}
          <div className="food-cal">{f.cal} kcal</div>
          {isToday && <button className="del-btn" onClick={() => delFood(f.id)}>×</button>}
        </div>
      ))}
    </>
  );
}
