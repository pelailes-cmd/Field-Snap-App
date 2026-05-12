import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorage, type TaskPersonnel, type ScheduleEvent } from '../context/StorageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, UserPlus, Trash2, HardHat, Calendar, Briefcase, Award, Plus, X } from 'lucide-react';
import { generateId } from '../utils/id';

export const TaskPersonnelPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { getSchedules, getPersonnelByTask, savePersonnel, deletePersonnel } = useStorage();
  
  const [task, setTask] = useState<ScheduleEvent | null>(null);
  const [personnel, setPersonnel] = useState<TaskPersonnel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    dutyDates: '',
    expertise: ''
  });

  useEffect(() => {
    if (taskId) {
      loadData();
    }
  }, [taskId]);

  const loadData = async () => {
    const allSchedules = await getSchedules();
    const currentTask = allSchedules.find(s => s.id === taskId);
    setTask(currentTask || null);

    if (taskId) {
      const personnelData = await getPersonnelByTask(taskId);
      setPersonnel(personnelData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !formData.name) return;

    await savePersonnel({
      id: generateId(),
      taskId,
      name: formData.name,
      position: formData.position,
      dutyDates: formData.dutyDates,
      expertise: formData.expertise,
      timestamp: Date.now()
    });

    setFormData({ name: '', position: '', dutyDates: '', expertise: '' });
    setShowAddForm(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this personnel?')) {
      await deletePersonnel(id);
      loadData();
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Task Personnel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {task ? `Personnel for: ${task.subject}` : 'Manage personnel'}
          </p>
        </div>
      </header>

      {!showAddForm ? (
        <>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}
          >
            <UserPlus size={20} /> Add Personnel
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {personnel.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px' }}>
                <HardHat size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No personnel assigned to this task.</p>
              </div>
            ) : (
              personnel.map(p => (
                <div key={p.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 123, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{p.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>{p.position}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} /> <strong>Duty:</strong> {p.dutyDates}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={14} /> <strong>Expertise:</strong> {p.expertise}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ animation: 'tabFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Add Personnel</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Full Name" 
              icon={<UserPlus size={18} />}
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Juan Dela Cruz"
              required
            />
            <Input 
              label="Position" 
              icon={<Briefcase size={18} />}
              value={formData.position} 
              onChange={e => setFormData({...formData, position: e.target.value})} 
              placeholder="e.g. Senior Electrician / Laborer"
              required
            />
            <Input 
              label="Duty Dates & Time" 
              icon={<Calendar size={18} />}
              value={formData.dutyDates} 
              onChange={e => setFormData({...formData, dutyDates: e.target.value})} 
              placeholder="e.g. April 10-12, 8AM - 5PM"
              required
            />
            <Input 
              label="Expertise" 
              icon={<Award size={18} />}
              value={formData.expertise} 
              onChange={e => setFormData({...formData, expertise: e.target.value})} 
              placeholder="e.g. High Voltage, Tiling, etc."
              required
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Add Personnel</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
