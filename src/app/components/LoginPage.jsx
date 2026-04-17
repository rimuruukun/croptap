import { useState } from 'react';
import '../../styles/login.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just call onLogin - can integrate with Firebase later
    if (isSignUp) {
      if (name && email && password) {
        onLogin({ name, email });
      }
    } else {
      if (email && password) {
        onLogin({ email });
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo/Title */}
        <div className="login-header">
          <div className="login-title-wrapper">
            <img src="/assets/crops/wheat.png" alt="Wheat" className="login-wheat-icon" />
            <h1 className="login-title">CROPTAP</h1>
            <img src="/assets/crops/wheat.png" alt="Wheat" className="login-wheat-icon" />
          </div>
          <p className="login-subtitle">Idle Farming Adventure</p>
        </div>

        {/* Main Form Card */}
        <div className="login-card">
          <div className="login-form-header">
            <h2>{isSignUp ? 'Join the Farm' : 'Enter the Farm'}</h2>
          </div>

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
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isSignUp ? !name || !email || !password : !email || !password}
            >
              {isSignUp ? 'Create Farm' : 'Start Farming'}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="login-footer">
            <p>
              {isSignUp ? 'Already have a farm?' : "Don't have a farm yet?"}{' '}
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="demo-notice">
          <p>💡 Try email: <strong>demo@farm.com</strong> | Pass: <strong>demo123</strong></p>
        </div>
      </div>
    </div>
  );
}
