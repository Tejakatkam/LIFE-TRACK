import React, { useState } from "react";
import { apiRequest } from "../../utils/api";

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
      <div className="onboard-wrap">
        <div className="onboard-card">
          <div className="onboard-logo">
            life<span>·</span>track
          </div>
          <div className="onboard-sub">your personal wellness companion</div>

          <div className="field">
            <label>Username</label>
            <input
              className="inp"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <div className="err">{error}</div>}

          <button
            className="primary-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="switch-link">
            No account?{" "}
            <button type="button" onClick={goToRegister}>
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
