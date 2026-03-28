import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Trash2, SortAsc, LayoutGrid, LayoutList, LogOut, Info, Send, ShieldCheck, HardHat, User, Check, ChevronDown, Wrench, Receipt, FileText, Activity } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, deleteAccount, logout, updateEmail, updatePassword } = useAuth();
  const [viewType, setViewType] = useState<'grid' | 'list'>(
    localStorage.getItem('fieldsnap_view_type') as any || 'grid'
  );
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(
    localStorage.getItem('fieldsnap_sort_order') as any || 'newest'
  );

  // About form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Account update states
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [showOtherTools, setShowOtherTools] = useState(false);

  const handleViewChange = (type: 'grid' | 'list') => {
    setViewType(type);
    localStorage.setItem('fieldsnap_view_type', type);
  };

  const handleSortChange = (order: 'newest' | 'oldest') => {
    setSortOrder(order);
    localStorage.setItem('fieldsnap_sort_order', order);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? All your data will be permanently removed.')) {
      deleteAccount();
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateStatus(null);
    
    try {
      if (newEmail !== user?.email) {
        await updateEmail(newEmail);
      }
      
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await updatePassword(newPassword);
      }
      
      setUpdateStatus({ type: 'success', message: 'Account updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setIsUpdatingAccount(false), 2000);
    } catch (err: any) {
      setUpdateStatus({ type: 'error', message: err.message || 'Update failed' });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    const email = "afhinzz.ailes@gmail.com";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject || 'FieldSnap Feedback')}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
    setSubject('');
    setMessage('');
    alert('Opening your email app...');
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>App preferences and account</p>
      </header>

      {/* Other Tools Dropdown */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <button 
          onClick={() => setShowOtherTools(!showOtherTools)}
          style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench size={20} color="var(--primary)" />
            <span style={{ fontWeight: '600' }}>Other Tools</span>
          </div>
          <ChevronDown size={20} style={{ transform: showOtherTools ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>
        
        {showOtherTools && (
          <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'tabFadeIn 0.2s ease' }}>
            <button 
              onClick={() => navigate('/utility-billing')}
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <Receipt size={18} color="var(--primary)" />
              <span>Utility Billing</span>
            </button>
            <button 
              onClick={() => navigate('/technical-report')}
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <FileText size={18} color="var(--primary)" />
              <span>Technical Report</span>
            </button>
            <button 
              onClick={() => navigate('/monitoring')}
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <Activity size={18} color="var(--primary)" />
              <span>Monitoring</span>
            </button>
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutGrid size={20} /> Appearance
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleViewChange('grid')} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: viewType === 'grid' ? 'var(--primary)' : 'var(--surface)', color: viewType === 'grid' ? 'white' : 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutGrid size={24} /> Grid View
          </button>
          <button onClick={() => handleViewChange('list')} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: viewType === 'list' ? 'var(--primary)' : 'var(--surface)', color: viewType === 'list' ? 'white' : 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutList size={24} /> List View
          </button>
        </div>
      </div>

      {/* Sorting Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SortAsc size={20} /> Sorting
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleSortChange('newest')} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: sortOrder === 'newest' ? 'var(--primary)' : 'var(--surface)', color: sortOrder === 'newest' ? 'white' : 'var(--text)' }}>Newest First</button>
          <button onClick={() => handleSortChange('oldest')} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: sortOrder === 'oldest' ? 'var(--primary)' : 'var(--surface)', color: sortOrder === 'oldest' ? 'white' : 'var(--text)' }}>Oldest First</button>
        </div>
      </div>

      {/* NEW: About Section integrated into Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} /> About FieldSnap
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          FieldSnap is a professional site documentation tool designed for engineers and site inspectors. Version 1.0.0.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(0, 123, 255, 0.1)', padding: '0.5rem', borderRadius: '8px' }}><ShieldCheck size={20} color="var(--primary)" /></div>
            <div><p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Secure & Private</p><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All data stored locally.</p></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(40, 167, 69, 0.1)', padding: '0.5rem', borderRadius: '8px' }}><HardHat size={20} color="var(--success)" /></div>
            <div><p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Professional</p><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard inspection reports.</p></div>
          </div>
        </div>

        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Contact Creator</h4>
        <form onSubmit={handleSendMessage}>
          <input type="text" placeholder="Subject" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', marginBottom: '0.75rem' }} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea placeholder="Message or bug report..." rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', marginBottom: '1rem', resize: 'none', fontFamily: 'inherit' }} required value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
          <Button type="submit"><Send size={18} style={{ marginRight: '0.5rem' }} /> Send Message</Button>
        </form>
      </div>

      {/* Account Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <User size={20} /> Account Details
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user?.profile?.fullName || user?.name}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
          </div>
          {!isUpdatingAccount && (
            <button 
              onClick={() => setIsUpdatingAccount(true)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Update
            </button>
          )}
        </div>

        {isUpdatingAccount && (
          <form onSubmit={handleUpdateAccount} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', animation: 'tabFadeIn 0.3s ease' }}>
            <h4 style={{ marginBottom: '1rem' }}>Update Account</h4>
            
            {updateStatus && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', background: updateStatus.type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)', color: updateStatus.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {updateStatus.type === 'success' ? <Check size={16} /> : <Info size={16} />}
                {updateStatus.message}
              </div>
            )}

            <Input 
              label="Email Address" 
              type="email"
              value={newEmail} 
              onChange={(e) => setNewEmail(e.target.value)} 
              required
            />
            
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Leave password fields blank to keep current password.</p>
              <Input 
                label="New Password" 
                type="password"
                placeholder="••••••••"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <div style={{ marginTop: '1rem' }}>
                <Input 
                  label="Confirm New Password" 
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="button" onClick={() => { setIsUpdatingAccount(false); setUpdateStatus(null); }} style={{ flex: 1, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</Button>
              <Button type="submit" style={{ flex: 2 }}>Save Changes</Button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={logout} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <LogOut size={18} /> Log Out
          </button>
          <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(220, 53, 69, 0.1)', background: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>Publisher: <strong>Engr. Ailes</strong></p>
        <p>© 2026 FieldSnap Systems</p>
      </div>
    </div>
  );
};
