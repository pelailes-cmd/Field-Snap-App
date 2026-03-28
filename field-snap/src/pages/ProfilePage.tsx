import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Save, Edit3, X } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.profile?.fullName || '',
    company: user?.profile?.company || '',
    position: user?.profile?.position || '',
    trade: user?.profile?.trade || '',
    head: user?.profile?.head || '',
    department: user?.profile?.department || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.values(formData).some(value => !value.trim())) {
      alert("Please fill in all fields before saving.");
      return;
    }

    setLoading(true);
    await updateProfile(formData);
    setLoading(false);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    // Reset form to current user data
    setFormData({
      fullName: user?.profile?.fullName || '',
      company: user?.profile?.company || '',
      position: user?.profile?.position || '',
      trade: user?.profile?.trade || '',
      head: user?.profile?.head || '',
      department: user?.profile?.department || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{isEditing ? 'Editing your details' : 'Your professional details'}</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ 
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--primary)', fontWeight: '600'
            }}
          >
            <Edit3 size={18} /> Edit
          </button>
        ) : (
          <button 
            onClick={handleCancel}
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem', cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={24} />
          </button>
        )}
      </header>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input 
            name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} 
            placeholder="John Doe" required disabled={!isEditing} 
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          <Input 
            name="company" label="Company/Organization" value={formData.company} onChange={handleChange} 
            placeholder="Engineering Co." required disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          <Input 
            name="position" label="Position" value={formData.position} onChange={handleChange} 
            placeholder="Senior Engineer" required disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          <Input 
            name="trade" label="Trade" value={formData.trade} onChange={handleChange} 
            placeholder="Mechanical" required disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          <Input 
            name="head" label="Head" value={formData.head} onChange={handleChange} 
            placeholder="Department Head Name" required disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          <Input 
            name="department" label="Department" value={formData.department} onChange={handleChange} 
            placeholder="QC / Operations" required disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.8 }}
          />
          
          {isEditing && (
            <Button type="submit" disabled={loading} style={{ marginTop: '1.5rem', height: '56px', borderRadius: '16px' }}>
              {loading ? 'Updating...' : 'Save Profile Changes'} <Save size={18} style={{ marginLeft: '0.5rem' }} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
