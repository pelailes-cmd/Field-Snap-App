import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="container">
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Monitoring</h1>
      </header>
      <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
        <Activity size={64} style={{ marginBottom: '1rem' }} />
        <p>Monitoring Tool Coming Soon</p>
      </div>
    </div>
  );
};
