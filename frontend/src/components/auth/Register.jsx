import React, { useState } from "react";
import { apiRequest } from "../../utils/api";

export default function Register({ onRegister, goToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError("");

      if (!username || !password || !confirmPass) {
        setError("Please fill all fields");
        return;
      }

      if (password !== confirmPass) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);

      const data = await apiRequest("/api/auth/register", "POST", {
        username,
        password,
      });

      localStorage.setItem("token", data.token);

      onRegister(data.user);
    } catch (err) {
      setError(err.message || "Registration failed");
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
          <div className="onboard-sub">create your wellness account</div>

          <div className="field">
            <label>Username</label>
            <input
              className="inp"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <input
              className="inp"
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>

          {error && <div className="err">{error}</div>}

          <button
            className="primary-btn"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="switch-link">
            Already have an account?{" "}
            <button type="button" onClick={goToLogin}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
