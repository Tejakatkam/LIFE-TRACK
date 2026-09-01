import React, { useState } from "react";
import { apiRequest } from "../../utils/api";
import logo from "../../assets/logo.png";

export default function Register({ onRegister, goToLogin }) {
  const [step, setStep] = useState(1);
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("Female");
  const [goal, setGoal] = useState("loss");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendVerification = async () => {
    try {
      setError("");
      if (!username || !email || !password) {
        setError("Please fill required fields (Username, Email, Password)");
        return;
      }
      setLoading(true);

      const res = await apiRequest("/api/auth/send-verification", "POST", {
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

      setOtpToken(res.otpToken);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistration = async () => {
    try {
      setError("");
      if (!otp) {
        setError("Please enter the verification code");
        return;
      }
      setLoading(true);

      const res = await apiRequest("/api/auth/verify-registration", "POST", {
        otpToken,
        otp
      });

      localStorage.setItem("token", res.token);
      onRegister(res.user);
    } catch (err) {
      setError(err.message || "Verification failed");
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
          
          {step === 1 ? (
            <>
              <div className="redesign-sub">YOUR PERSONAL WELLNESS COMPANION</div>

              <div className="grid-2">
                <div className="field">
                  <label>USERNAME</label>
                  <input className="inp redesign-inp" placeholder="e.g. your_username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="field">
                  <label>PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <input 
                      className="inp redesign-inp" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <span 
                      className="eye-icon"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </span>
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

              <button className="primary-btn redesign-btn mt-4" onClick={handleSendVerification} disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </button>

              <div className="switch-link mt-3">
                Have an account? <button type="button" onClick={goToLogin} style={{ color: "var(--accent)"}}>Sign in</button>
              </div>
            </>
          ) : (
            <>
              <div className="redesign-sub">VERIFY YOUR EMAIL</div>
              
              <div className="info-card mt-3">
                <span className="info-icon">✉️</span> We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to complete registration.
              </div>

              <div className="field mt-4">
                <label>VERIFICATION CODE</label>
                <input 
                  className="inp redesign-inp" 
                  style={{ fontSize: '24px', letterSpacing: '4px', textAlign: 'center' }}
                  placeholder="------" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6}
                />
              </div>

              {error && <div className="err mt-3">{error}</div>}

              <button className="primary-btn redesign-btn mt-4" onClick={handleVerifyRegistration} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <div className="switch-link mt-3">
                <button type="button" onClick={() => setStep(1)} style={{ color: "var(--accent)"}}>← Back to Details</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
