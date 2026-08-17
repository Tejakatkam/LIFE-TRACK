import React, { useEffect } from "react";
import { apiRequest } from "../../api";
import { todayKey, fmtDate, stepsBurned } from "../../utils/helpers";

export default function FoodTab({
  currentUser,
  viewDay,
  dayOffset,
  setDayOffset,
  foodLog,
  setFoodLog,
  foodSteps,
  setFoodSteps,
  fName,
  setFName,
  fGrams,
  setFGrams,
  fCal,
  setFCal,
}) {
  const isToday = viewDay === todayKey();

  // ✅ FETCH FOOD
  useEffect(() => {
    if (!currentUser) return;

    const fetchFood = async () => {
      try {
        const data = await apiRequest(`/food?date=${viewDay}`);
        setFoodLog(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFood();
  }, [currentUser, viewDay]);

  const totalEaten = foodLog.reduce((s, f) => s + (f.calories || 0), 0);

  const burned = stepsBurned(+foodSteps || 0);
  const netCal = totalEaten - burned;

  const isDeficit = netCal < 0;
  const isZero = netCal === 0;
  const netClass = isZero ? "zero" : isDeficit ? "deficit" : "surplus";

  // ✅ ADD FOOD
  const addFood = async () => {
    if (!fName || !fCal) return;

    try {
      await apiRequest("/food", "POST", {
        log_date: viewDay,
        name: fName.trim(),
        grams: +fGrams || null,
        calories: +fCal,
      });

      // Refetch instead of guessing
      const updated = await apiRequest(`/food?date=${viewDay}`);
      setFoodLog(updated);

      setFName("");
      setFGrams("");
      setFCal("");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ DELETE FOOD
  const delFood = async (id) => {
    try {
      await apiRequest(`/food/${id}`, "DELETE");

      const updated = await apiRequest(`/food?date=${viewDay}`);
      setFoodLog(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="date-nav">
        <button
          className="date-nav-btn"
          onClick={() => setDayOffset((d) => d - 1)}
        >
          ‹
        </button>

        <div className="date-str">{fmtDate(viewDay)}</div>

        {dayOffset < 0 && (
          <button
            className="date-nav-btn"
            onClick={() => setDayOffset((d) => d + 1)}
          >
            ›
          </button>
        )}
      </div>

      <div className="summary-card">
        <div className="cal-row">
          <div className="cal-chip">
            <div className="cal-chip-label">Consumed</div>
            <div className="cal-chip-val">
              {totalEaten}
              <span>kcal</span>
            </div>
          </div>

          <div className="cal-chip">
            <div className="cal-chip-label">Burned</div>
            <div className="cal-chip-val green">
              −{burned}
              <span>kcal</span>
            </div>
          </div>

          <div className="cal-chip">
            <div className="cal-chip-label">Net</div>
            <div className={`cal-chip-val ${netClass}`}>
              {isDeficit ? "−" : "+"}
              {Math.abs(netCal)}
              <span>kcal</span>
            </div>
          </div>
        </div>
      </div>

      {isToday && (
        <>
          <div className="section-title">Log Food</div>

          <div className="add-form">
            <div className="form-row">
              <input
                className="inp"
                placeholder="Food name"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
              />

              <input
                className="inp"
                type="number"
                placeholder="Grams"
                value={fGrams}
                onChange={(e) => setFGrams(e.target.value)}
              />

              <input
                className="inp"
                type="number"
                placeholder="Calories"
                value={fCal}
                onChange={(e) => setFCal(e.target.value)}
              />

              <button className="add-btn" onClick={addFood}>
                + Add
              </button>
            </div>
          </div>
        </>
      )}

      <div className="section-title">
        Food Log <small>{fmtDate(viewDay)}</small>
      </div>

      {foodLog.length === 0 && (
        <div className="empty">
          No food logged {isToday ? "yet today" : "on this day"}
        </div>
      )}

      {foodLog.map((f) => (
        <div key={f.id} className="food-item">
          <div className="food-name">{f.name}</div>
          {f.grams && <div>{f.grams}g</div>}
          <div>{f.calories} kcal</div>

          {isToday && (
            <button className="del-btn" onClick={() => delFood(f.id)}>
              ×
            </button>
          )}
        </div>
      ))}
    </>
  );
}
