import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Lock, User } from 'lucide-react';
import logoImg from '../assets/ehbl.jpeg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await login({ username, password, role });
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg('Invalid username or password.');
      }
    } catch (err) {
      setErrorMsg('Login failed. Please check credentials or server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card animate-fade-in">
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '1rem' }}>
          <img src={logoImg} alt="EHBL Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', marginBottom: '15px' }} />
          <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>Login to your account</p>
        </div>
        
        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Username or ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="role-selector">
            <label>
              <input
                type="radio"
                value="Salesman"
                checked={role === 'Salesman'}
                onChange={(e) => setRole(e.target.value)}
              />
              Salesman
            </label>
            <label>
              <input
                type="radio"
                value="Admin"
                checked={role === 'Admin'}
                onChange={(e) => setRole(e.target.value)}
              />
              Admin
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
