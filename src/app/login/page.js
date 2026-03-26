'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rp_tracking_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const generateAPIKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'rp_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const simulateOAuthLogin = async (provider) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser = {
      id: 'user_' + Date.now(),
      name: provider === 'google' ? 'Google User' : 'Facebook User',
      email: provider + '_user@example.com',
      picture: provider === 'google' 
        ? 'https://lh3.googleusercontent.com/a/default-user' 
        : 'https://graph.facebook.com/v12.0/me/picture',
      provider: provider,
    };
    
    const apiKey = generateAPIKey();
    
    localStorage.setItem('rp_tracking_user', JSON.stringify(mockUser));
    localStorage.setItem('rp_tracking_token', apiKey);
    
    setUser(mockUser);
    setLoading(false);
    
    setTimeout(() => router.push('/live-tracking'), 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('rp_tracking_user');
    localStorage.removeItem('rp_tracking_token');
    setUser(null);
  };

  if (user) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>Welcome Back!</h1>
          <div className="user-info">
            <img src={user.picture} alt={user.name} className="user-avatar" />
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
            <div className="api-key-display" style={{ marginTop: '1rem' }}>
              <span className="api-key-label">API Key:</span>
              <code className="api-key-value">
                {localStorage.getItem('rp_tracking_token')?.substring(0, 20)}...
              </code>
            </div>
          </div>
          <button className="btn-primary" onClick={handleLogout}>
            Sign Out
          </button>
          <button 
            className="btn-primary" 
            onClick={() => router.push('/live-tracking')}
            style={{ marginTop: '1rem' }}
          >
            Go to Live Tracking
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>RP Motor Tracking</h1>
        <p>Sign in to access live vehicle tracking</p>
        
        <div className="oauth-buttons">
          <button 
            className="oauth-btn google"
            onClick={() => simulateOAuthLogin('google')}
            disabled={loading}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <button 
            className="oauth-btn facebook"
            onClick={() => simulateOAuthLogin('facebook')}
            disabled={loading}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Facebook'}
          </button>
        </div>

        <div className="login-divider">
          <span>or sign in with email</span>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          simulateOAuthLogin('email');
        }}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="Enter password"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="login-footer">
          <a href="/">← Back to Dashboard</a>
        </p>

        <div className="api-key-info">
          <p>🔑 API Key required for live tracking</p>
          <p className="small">After login, you'll receive an API key for real-time GPS access</p>
        </div>
      </div>
    </main>
  );
}
