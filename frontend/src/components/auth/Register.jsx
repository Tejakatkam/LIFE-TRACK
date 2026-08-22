import React, { useState } from "react";
import { apiRequest } from "../../utils/api";
import logo from "../../assets/logo.png";

export default function Register({ onRegister, goToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("Female");
  const [goal, setGoal] = useState("loss");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError("");

      if (!username || !email || !password) {
        setError("Please fill required fields (Username, Email, Password)");
        return;
      }

      setLoading(true);

      await apiRequest("/api/auth/register", "POST", {
        username,
        email,
        password,
        phone,
        age: age ? +age : null,
        weight: weight ? +weight : null,
        height: height ? +height : null,
        gender: gender.toLowerCase(),
        goal,
      });

      // Automatically log them in after registration
      const loginData = await apiRequest("/api/auth/login", "POST", {
        username,
        password,
      });

      localStorage.setItem("token", loginData.token);
      onRegister(loginData.user);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="onboard-wrap redesign-wrap">
        <div className="onboard-card redesign-card">
          <div className="redesign-header">
            <div className="redesign-logo-group">
              <div className="redesign-icon" style={{ padding: 0, overflow: 'hidden' }}>
                <img src={logo} alt="LifeTrack Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="redesign-title">Life <span>·</span> Track</div>
            </div>
            <div className="theme-toggle">☀</div>
          </div>
          <div className="redesign-sub">YOUR PERSONAL WELLNESS COMPANION</div>

          <div className="grid-2">
            <div className="field">
              <label>USERNAME</label>
              <input className="inp redesign-inp" placeholder="e.g. priya" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input className="inp redesign-inp" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <span className="eye-icon">👁</span>
              </div>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div className="field">
              <label>EMAIL</label>
              <input className="inp redesign-inp" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>PHONE</label>
              <input className="inp redesign-inp" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">👉🏽</span> Your email & phone will be used to send reminder notifications. Validating your email prevents duplicate accounts.
          </div>

          <div className="grid-3 mt-3">
            <div className="field">
              <label>AGE</label>
              <input className="inp redesign-inp" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="field">
              <label>WEIGHT (KG)</label>
              <input className="inp redesign-inp" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="field">
              <label>HEIGHT (CM)</label>
              <input className="inp redesign-inp" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>

          <div className="field mt-3">
            <label>BIOLOGICAL SEX</label>
            <select className="inp redesign-inp" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field mt-3">
            <label>YOUR GOAL</label>
            <div className="goal-grid">
              <div className={`goal-tile ${goal === 'loss' ? 'active' : ''}`} onClick={() => setGoal('loss')}>
                <div className="goal-icon">🍃</div>
                <div>LOSE WEIGHT</div>
              </div>
              <div className={`goal-tile ${goal === 'maintain' ? 'active' : ''}`} onClick={() => setGoal('maintain')}>
                <div className="goal-icon">⚖️</div>
                <div>MAINTAIN</div>
              </div>
              <div className={`goal-tile ${goal === 'gain' ? 'active' : ''}`} onClick={() => setGoal('gain')}>
                <div className="goal-icon">💪</div>
                <div>GAIN WEIGHT</div>
              </div>
            </div>
          </div>

          {error && <div className="err mt-3">{error}</div>}

          <button className="primary-btn redesign-btn mt-4" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating..." : "Send Verification Code"}
          </button>

          <div className="switch-link mt-3">
            Have an account? <button type="button" onClick={goToLogin} style={{ color: "var(--accent)"}}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
