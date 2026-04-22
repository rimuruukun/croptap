import { useState } from "react";
import "../../styles/login.css";

function formatLastSaved(lastSavedAt) {
  if (!lastSavedAt) {
    return "No local save found yet";
  }

  const savedTime = new Date(lastSavedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `Last local save: ${savedTime}`;
}

export default function LoginPage({
  onLogin,
  isOnline,
  lastSavedAt,
  hydrationError,
  authError,
  isAuthenticating,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (name && email && password) {
        await onLogin({
          mode: "register",
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }
    } else {
      if (email && password) {
        await onLogin({
          mode: "login",
          email: email.trim(),
          password,
        });
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo/Title */}
        <div className="login-header">
          <div className="login-title-wrapper">
            <img
              src="/assets/crops/wheat.png"
              alt="Wheat"
              className="login-wheat-icon"
            />
            <h1 className="login-title">CROPTAP</h1>
            <img
              src="/assets/crops/wheat.png"
              alt="Wheat"
              className="login-wheat-icon"
            />
          </div>
          <p className="login-subtitle">Idle Farming Adventure</p>

          <div className="login-status-strip">
            <span
              className={`login-network-chip ${isOnline ? "online" : "offline"}`}
            >
              {isOnline ? "Online mode" : "Offline mode"}
            </span>
            <span className="login-save-text">
              {formatLastSaved(lastSavedAt)}
            </span>
          </div>

          {hydrationError ? (
            <p className="login-error-text">{hydrationError}</p>
          ) : null}
        </div>

        {/* Main Form Card */}
        <div className="login-card">
          <div className="login-form-header">
            <h2>
              {isSignUp ? "Create Your Farm Account" : "Login to Your Farm"}
            </h2>
          </div>

          {authError ? <p className="login-error-text">{authError}</p> : null}

          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="name">Farmer Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="What's your name?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  disabled={isAuthenticating}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                disabled={isAuthenticating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                disabled={isAuthenticating}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={
                isAuthenticating ||
                (isSignUp ? !name || !email || !password : !email || !password)
              }
            >
              {isAuthenticating
                ? isSignUp
                  ? "Creating..."
                  : "Signing in..."
                : isSignUp
                  ? "Create Farm"
                  : "Start Farming"}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="login-footer">
            <p>
              {isSignUp ? "Already have a farm?" : "Don't have a farm yet?"}{" "}
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                  setName("");
                }}
                disabled={isAuthenticating}
              >
                {isSignUp ? "Login" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
