import React, { useState, useEffect } from "react";
import { calcBMI, calcBMR, calcTDEE, bmiCat } from "../../utils/helpers";
import WeightTracker from "./WeightTracker";
import { apiRequest } from "../../utils/api";

const METRIC_EXPLANATIONS = {
  TDEE: {
    title: "TDEE",
    fullName: "Total Daily Energy Expenditure",
    icon: "🔥",
    tagline: "Total calories your body burns in a day",
    description: "TDEE represents the complete number of calories you burn in 24 hours. It combines your baseline resting metabolism (BMR) with daily activities, walking, occupational movement, and exercise workouts.",
    keyPoints: [
      { label: "Weight Maintenance", desc: "Eating your TDEE calories keeps your weight stable." },
      { label: "Weight Loss (Deficit)", desc: "Eating 300–500 kcal below your TDEE promotes safe, steady fat loss." },
      { label: "Muscle Gain (Surplus)", desc: "Eating 200–400 kcal above your TDEE supports muscle growth." }
    ],
    formula: "TDEE = BMR × Daily Activity Multiplier"
  },
  BMR: {
    title: "BMR",
    fullName: "Basal Metabolic Rate",
    icon: "⚡",
    tagline: "Baseline vital energy needed at complete rest",
    description: "BMR is the absolute minimum calories your body requires to stay alive and maintain vital functions (breathing, cardiac pump, cellular repair, brain and organ operation) while resting in bed with zero movement.",
    keyPoints: [
      { label: "Core Metabolic Burn", desc: "Accounts for roughly 60–70% of all calories you burn every day." },
      { label: "Safety Principle", desc: "You should avoid eating below your BMR without physician supervision to prevent fatigue and metabolic slowdown." },
      { label: "Calculation Basis", desc: "Determined via the Mifflin-St Jeor formula from your age, sex, height, and weight." }
    ],
    formula: "Mifflin-St Jeor Equation [10×weight + 6.25×height − 5×age ± sex]"
  },
  BMI: {
    title: "BMI",
    fullName: "Body Mass Index",
    icon: "⚖️",
    tagline: "Standard weight-to-height screening metric",
    description: "BMI is a clinically established screening index that compares your body weight relative to your height squared (kg/m²) to categorize general health ranges.",
    keyPoints: [
      { label: "< 18.5", desc: "Underweight category" },
      { label: "18.5 – 24.9", desc: "Healthy / Normal weight range" },
      { label: "25.0 – 29.9", desc: "Overweight category" },
      { label: "≥ 30.0", desc: "Obese category" }
    ],
    formula: "BMI = Weight (kg) / [Height (m)]²"
  }
};

export default function ProfileTab({ profile, onSave, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setInfoModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await apiRequest("/api/auth/me", "DELETE");
      onLogout(); // Log the user out to clear UI state
    } catch (e) {
      console.error("Delete account failed:", e);
      alert("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <style>{`
        .bmi-chip.clickable {
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .bmi-chip.clickable:hover {
          border-color: var(--accent);
          background: var(--surface2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .bmi-info-badge {
          font-size: 11px;
          color: var(--accent);
          margin-left: 4px;
          font-weight: 600;
          opacity: 0.85;
        }
        .metric-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        .metric-modal-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px 24px;
          max-width: 440px;
          width: 100%;
          box-shadow: var(--shadow2);
          position: relative;
          animation: slideIn 0.2s ease;
        }
      `}</style>
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
            { label: "BMI", val: bmi, unit: bmi !== "—" ? bmiCat(+bmi) : "", hasInfo: true },
            { label: "TDEE", val: tdee, unit: tdee !== "—" ? "kcal/day" : "", hasInfo: true },
            { label: "BMR", val: bmr ? Math.round(bmr) : "—", unit: bmr ? "kcal" : "", hasInfo: true },
            { label: "Weight", val: form.weight || "—", unit: form.weight ? "kg" : "", hasInfo: false },
            { label: "Height", val: form.height || "—", unit: form.height ? "cm" : "", hasInfo: false },
            { label: "Age", val: form.age || "—", unit: form.age ? "yrs" : "", hasInfo: false },
          ].map(c => (
            <div 
              key={c.label} 
              className={`bmi-chip ${c.hasInfo ? "clickable" : ""}`}
              onClick={() => c.hasInfo && setInfoModal(c.label)}
              title={c.hasInfo ? `Click to learn about ${c.label}` : undefined}
            >
              <div className="bmi-chip-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{c.label}</span>
                {c.hasInfo && <span className="bmi-info-badge">ⓘ</span>}
              </div>
              <div className="bmi-chip-val">{c.val}<span>{c.unit}</span></div>
            </div>
          ))}
        </div>

        {/* Metric Explanation Modal Pop-up */}
        {infoModal && METRIC_EXPLANATIONS[infoModal] && (
          <div className="metric-modal-overlay" onClick={() => setInfoModal(null)}>
            <div className="metric-modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{METRIC_EXPLANATIONS[infoModal].icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                      {METRIC_EXPLANATIONS[infoModal].title} — {METRIC_EXPLANATIONS[infoModal].fullName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                      {METRIC_EXPLANATIONS[infoModal].tagline}
                    </div>
                  </div>
                </div>
                <button 
                  className="del-btn" 
                  style={{ opacity: 1, fontSize: 18, cursor: "pointer", color: "var(--text2)", padding: "2px 6px" }} 
                  onClick={() => setInfoModal(null)}
                  title="Close popup"
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 14 }}>
                {METRIC_EXPLANATIONS[infoModal].description}
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>
                  Key Highlights & How It Works
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {METRIC_EXPLANATIONS[infoModal].keyPoints.map((kp, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>•</span>
                      <div>
                        <strong style={{ color: "var(--text)" }}>{kp.label}:</strong> {kp.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
                  📐 {METRIC_EXPLANATIONS[infoModal].formula}
                </div>
                <button 
                  className="add-btn" 
                  style={{ padding: "6px 16px", fontSize: 12 }} 
                  onClick={() => setInfoModal(null)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <WeightTracker currentUser={profile} />

        <div style={{ display: 'flex', gap: '10px', marginTop: 20 }}>
          <button className="logout-btn" style={{ flex: 1 }} onClick={onLogout}>
            Log Out
          </button>
          
          <button 
            className="logout-btn" 
            style={{ flex: 1, backgroundColor: 'rgba(255, 60, 60, 0.1)', color: '#ff4444', borderColor: '#ff4444' }} 
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </>
  );
}
