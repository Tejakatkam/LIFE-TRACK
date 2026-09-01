import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiRequest } from "../../utils/api";

export default function WeightTracker({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [calData, setCalData] = useState(null);
  const [calLoading, setCalLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchHistory = async () => {
    try {
      const data = await apiRequest("/api/weight", "GET");
      setHistory((data || []).map(d => {
        const rawDate = d.record_date instanceof Date ? d.record_date.toISOString().split("T")[0] : String(d.record_date).slice(0, 10);
        return {
          ...d,
          rawDate,
          displayDate: new Date(d.record_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        };
      }));
    } catch (err) {
      console.error("Failed to fetch weight history", err);
    }
  };

  const todayEntry = history.find(h => h.rawDate === todayStr);

  const handleAddWeight = async () => {
    if (!weight) return;
    setLoading(true);
    try {
      await apiRequest("/api/weight", "POST", {
        weight: parseFloat(weight),
        record_date: todayStr
      });
      setWeight("");
      fetchHistory();
    } catch (err) {
      console.error("Failed to add weight", err);
    }
    setLoading(false);
  };

  const fetchCalorieRec = async () => {
    setCalLoading(true);
    try {
      const data = await apiRequest("/api/user/calorie-recommendation", "GET");
      setCalData(data);
    } catch (err) {
      console.error("Failed to fetch calorie rec", err);
    }
    setCalLoading(false);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="section-title">Weight Tracking</div>
      <div className="add-form" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ alignItems: "flex-end" }}>
          <div className="form-field f-num" style={{ flex: 1 }}>
            <label>Weight (kg)</label>
            <input 
              className="inp" 
              type="number" 
              step="0.1"
              placeholder={todayEntry ? `Current: ${todayEntry.weight} kg` : "e.g. 70.5"} 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleAddWeight()} 
            />
          </div>
          <button className="add-btn" style={{ minWidth: 120, height: 42 }} onClick={handleAddWeight} disabled={loading}>
            {loading ? "Saving..." : todayEntry ? "Update Today" : "+ Log Weight"}
          </button>
        </div>
        {todayEntry && (
          <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8 }}>
            ✓ Recorded today: <strong>{todayEntry.weight} kg</strong> (submitting updates today's log)
          </div>
        )}
      </div>

      {history.length > 0 ? (
        <div className="summary-card" style={{ height: 250, padding: "20px 10px 10px 0" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="displayDate" stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={["auto", "auto"]} stroke="var(--text3)" fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
                itemStyle={{ color: "var(--text)" }}
              />
              <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: "var(--accent)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty" style={{ marginBottom: 20 }}>No weight records yet.</div>
      )}

      <div className="section-title" style={{ marginTop: 24 }}>AI Calorie Recommendation</div>
      <div className="summary-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!calData ? (
          <button className="add-btn" style={{ alignSelf: "flex-start", width: "100%" }} onClick={fetchCalorieRec} disabled={calLoading}>
            {calLoading ? "Analyzing profile..." : "✦ Get Recommendation"}
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Goal: {calData.goal === "loss" ? "Weight Loss" : calData.goal === "gain" ? "Weight Gain" : "Maintain Weight"}
            </div>
            <div style={{ fontSize: 28, color: "var(--text)", fontWeight: 500, fontFamily: "\u0027Cormorant Garamond\u0027,serif" }}>
              {calData.dailyCalories} <span style={{ fontSize: 16, color: "var(--text2)", fontFamily: "\u0027Jost\u0027,sans-serif" }}>kcal/day</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text)", marginTop: 8, lineHeight: 1.5 }}>
              {calData.explanation}
            </div>
            {calData.fallback && (
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 12, fontStyle: "italic" }}>
                Note: Gemini API key is missing or unavailable. This is a fallback estimate.
              </div>
            )}
            <button 
              className="edit-btn" 
              style={{ marginTop: 16, width: "100%" }} 
              onClick={fetchCalorieRec}
              disabled={calLoading}
            >
              {calLoading ? "↻ Analyzing with AI..." : "↻ Refresh Recommendation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

