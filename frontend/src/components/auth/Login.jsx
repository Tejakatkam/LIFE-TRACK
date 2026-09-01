import React, { useState } from "react";
import { apiRequest } from "../../utils/api";
import logo from "../../assets/logo.png";

export default function Login({ onLogin, goToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");

      if (!username || !password) {
        setError("Please enter username and password");
        return;
      }

      setLoading(true);

      const data = await apiRequest("/api/auth/login", "POST", {
        username,
        password,
      });

      localStorage.setItem("token", data.token);

      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Login failed");
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

          <div className="field mt-3">
            <label>USERNAME OR EMAIL</label>
            <input
              className="inp redesign-inp"
              placeholder="e.g. username or you@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="field mt-3">
            <label>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                className="inp redesign-inp"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <span className="eye-icon">👁</span>
            </div>
          </div>

          {error && <div className="err mt-3">{error}</div>}

          <button
            className="primary-btn redesign-btn mt-4"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="switch-link mt-3">
            No account?{" "}
            <button type="button" onClick={goToRegister} style={{ color: "var(--accent)"}}>
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
