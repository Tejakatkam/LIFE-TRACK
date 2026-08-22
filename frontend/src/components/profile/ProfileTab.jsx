import React, { useState, useEffect } from "react";
import { calcBMI, calcBMR, calcTDEE, bmiCat } from "../../utils/helpers";

export default function ProfileTab({ profile, onSave, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    age: profile.age || "",
    weight: profile.weight || "",
    height: profile.height || "",
    gender: profile.gender || "other",
    goal: profile.goal || "maintain",
    email: profile.email || "",
    phone: profile.phone || "",
  });

  useEffect(() => {
    setForm({
      age: profile.age || "",
      weight: profile.weight || "",
      height: profile.height || "",
      gender: profile.gender || "other",
      goal: profile.goal || "maintain",
      email: profile.email || "",
      phone: profile.phone || "",
    });
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        age: +form.age || null,
        weight: +form.weight || null,
        height: +form.height || null,
        gender: form.gender,
        goal: form.goal,
        email: form.email,
        phone: form.phone,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Save failed:", e);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setForm({
      age: profile.age || "",
      weight: profile.weight || "",
      height: profile.height || "",
      gender: profile.gender || "other",
      goal: profile.goal || "maintain",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setEditing(false);
  };

  const bmi = form.weight && form.height ? calcBMI(+form.weight, +form.height) : "—";
  const bmr = form.weight && form.height && form.age
    ? calcBMR(+form.weight, +form.height, +form.age, form.gender)
    : 0;
  const tdee = bmr ? calcTDEE(bmr) : "—";

  const goalLabels = { loss: "Weight Loss", gain: "Weight Gain", maintain: "Maintain" };
  const goalIcons = { loss: "↓", gain: "↑", maintain: "◎" };

  // Support both .name (alias) and .username from backend
  const displayName = profile.name || profile.username || "User";

  return (
    <>
      <div className="profile-card">
        <div className="profile-header-row">
          <div className="profile-avatar">◉</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saved && <span className="saved-flash">✓ Saved</span>}
            {!editing ? (
              <button className="edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
            ) : (
              <>
                <button className="edit-btn save" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving…" : "Save"}
                </button>
                <button className="edit-btn cancel" style={{ marginLeft: 8 }} onClick={handleCancel}>Cancel</button>
              </>
            )}
          </div>
        </div>

        <div className="profile-name">{displayName}</div>

        <div className={`goal-badge ${form.goal}`}>
          {goalIcons[form.goal]} {goalLabels[form.goal]}
        </div>

        {/* Contact info display */}
        {!editing && (profile.email || profile.phone) && (
          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {profile.email && (
              <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                📬 {profile.email}
              </div>
            )}
            {profile.phone && (
              <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                📱 {profile.phone}
              </div>
            )}
          </div>
        )}

        {editing && (
          <>
            <div className="edit-row">
              <div className="edit-field">
                <label>Age</label>
                <input className="inp" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>Weight (kg)</label>
                <input className="inp" type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>Height (cm)</label>
                <input className="inp" type="number" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>Sex</label>
                <select className="inp" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-field">
                <label>Email</label>
                <input className="inp" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>Phone</label>
                <input className="inp" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 7 }}>Goal</div>
              <div className="goal-edit-grid">
                {[{ v: "loss", l: "🍃 Lose" }, { v: "maintain", l: "⚖ Maintain" }, { v: "gain", l: "💪 Gain" }].map(g => (
                  <div key={g.v} className={`goal-edit-opt${form.goal === g.v ? " sel" : ""}`} onClick={() => setForm({ ...form, goal: g.v })}>{g.l}</div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="bmi-row" style={{ marginTop: editing ? 16 : 12 }}>
          {[
            { label: "BMI", val: bmi, unit: bmi !== "—" ? bmiCat(+bmi) : "" },
            { label: "TDEE", val: tdee, unit: tdee !== "—" ? "kcal/day" : "" },
            { label: "BMR", val: bmr ? Math.round(bmr) : "—", unit: bmr ? "kcal" : "" },
            { label: "Weight", val: form.weight || "—", unit: form.weight ? "kg" : "" },
            { label: "Height", val: form.height || "—", unit: form.height ? "cm" : "" },
            { label: "Age", val: form.age || "—", unit: form.age ? "yrs" : "" },
          ].map(c => (
            <div key={c.label} className="bmi-chip">
              <div className="bmi-chip-label">{c.label}</div>
              <div className="bmi-chip-val">{c.val}<span>{c.unit}</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="logout-btn" onClick={onLogout}>
            Log Out
          </button>
          
          <button className="logout-btn" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={async () => {
            if (window.confirm("Are you sure you want to completely wipe the production database? This will delete all users.")) {
              try {
                const BASE_URL = import.meta.env.VITE_API_URL;
                await fetch(`${BASE_URL}/api/auth/clear-db-temp`);
                alert("Database cleared! Logging you out.");
                onLogout();
              } catch (e) {
                alert("Failed to clear DB");
              }
            }
          }}>
            Clear Remote Database
          </button>
        </div>
      </div>
    </>
  );
}
