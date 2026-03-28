import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New sign-up fields
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  
  const [error, setError] = useState('');
  const { login, signup, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!fullName || !company || !position) {
          throw new Error('Please fill in all professional details.');
        }
        await signup(email, password, fullName, company, position);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          background: 'var(--primary)', 
          width: '64px', 
          height: '64px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 1rem',
          boxShadow: 'var(--shadow)'
        }}>
          <Camera size={32} color="white" />
        </div>
        <h1 style={{ fontSize: '2rem' }}>FieldSnap</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Site documentation made easy</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            color: 'var(--danger)', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius)', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <Input 
                label="Full Name" 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                placeholder="John Doe"
              />
              <Input 
                label="Company/Organization" 
                type="text" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                required 
                placeholder="Engineering Co."
              />
              <Input 
                label="Position" 
                type="text" 
                value={position} 
                onChange={(e) => setPosition(e.target.value)} 
                required 
                placeholder="Site Engineer"
              />
            </>
          )}
          
          <Input 
            label="Email Address" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="engineer@example.com"
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />
          <Button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary)', 
            fontWeight: 600, 
            cursor: 'pointer',
            padding: 0
          }}
        >
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
};
