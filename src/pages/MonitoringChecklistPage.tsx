import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorage, type MonitoringItem, type MonitoringChecklist } from '../context/StorageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Trash2, CheckCircle2, XCircle, Plus, X, ClipboardCheck, User, MessageSquare, Save, Calendar, History } from 'lucide-react';
import { generateId } from '../utils/id';

export const MonitoringChecklistPage: React.FC = () => {
  const { monitoringId } = useParams<{ monitoringId: string }>();
  const navigate = useNavigate();
  const { getMonitoringItems, getMonitoringChecklists, getLatestMonitoringChecklists, saveMonitoringChecklist, deleteMonitoringChecklist } = useStorage();
  
  const [equipment, setEquipment] = useState<MonitoringItem | null>(null);
  const [checklists, setChecklists] = useState<MonitoringChecklist[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingItem, setEditingItem] = useState<MonitoringChecklist | null>(null);
  
  const [formData, setFormData] = useState({
    details: '',
    status: 'Okay' as 'Okay' | 'Not Okay',
    checkedBy: '',
    remarks: ''
  });

  useEffect(() => {
    if (monitoringId) {
      loadData();
    }
  }, [monitoringId, selectedDate]);

  const loadData = async () => {
    if (!monitoringId) return;
    const allItems = await getMonitoringItems();
    const current = allItems.find(i => i.id === monitoringId);
    setEquipment(current || null);

    const allChecklistData = await getMonitoringChecklists(monitoringId);
    
    // Filter for specific date
    let dateData = allChecklistData.filter(c => c.date === selectedDate);
    
    // If no data for TODAY (or selected date), try to carry over from the latest day
    if (dateData.length === 0) {
      const latestItems = await getLatestMonitoringChecklists(monitoringId);
      if (latestItems.length > 0 && latestItems[0].date !== selectedDate) {
        // Clone items to the selected date
        const clonedItems = await Promise.all(latestItems.map(async (item) => {
          const newItem: Omit<MonitoringChecklist, 'userId'> = {
            ...item,
            id: generateId(),
            date: selectedDate,
            timestamp: Date.now()
          };
          await saveMonitoringChecklist(newItem);
          return { ...newItem, userId: '' } as MonitoringChecklist;
        }));
        dateData = clonedItems;
      }
    }
    
    setChecklists(dateData);

    // Get all unique dates for history
    const dates = Array.from(new Set(allChecklistData.map(c => c.date))).sort((a, b) => b.localeCompare(a));
    setHistoryDates(dates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitoringId || !formData.details || !formData.checkedBy) return;

    const checklistItem: Omit<MonitoringChecklist, 'userId'> = {
      id: editingItem ? editingItem.id : generateId(),
      monitoringId,
      date: selectedDate,
      details: formData.details,
      status: formData.status,
      checkedBy: formData.checkedBy,
      remarks: formData.remarks,
      timestamp: editingItem ? editingItem.timestamp : Date.now()
    };

    await saveMonitoringChecklist(checklistItem);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({ details: '', status: 'Okay', checkedBy: '', remarks: '' });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MonitoringChecklist) => {
    setEditingItem(item);
    setFormData({
      details: item.details,
      status: item.status,
      checkedBy: item.checkedBy,
      remarks: item.remarks
    });
    setShowAddForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this checklist item?')) {
      await deleteMonitoringChecklist(id);
      loadData();
    }
  };

  const handleSaveDay = () => {
    if (checklists.length === 0) {
      alert("No items to save for this day.");
      return;
    }
    alert(`Inspection checklist for ${selectedDate} has been finalized and saved.`);
    // Since we use IndexedDB and save each item, they are already "saved".
    // This could also trigger a PDF export or a status update.
  };

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{equipment?.equipmentName || 'Inspection'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{selectedDate}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem', color: 'var(--text)', cursor: 'pointer' }}
            title="History"
          >
            <History size={20} />
          </button>
          <button 
            onClick={handleSaveDay}
            style={{ background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '0.6rem', color: 'white', cursor: 'pointer' }}
            title="Save for the Day"
          >
            <Save size={20} />
          </button>
        </div>
      </header>

      {showHistory && (
        <div className="card" style={{ marginBottom: '1.5rem', animation: 'tabFadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Inspection History</h3>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {historyDates.length === 0 ? (
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No previous inspections.</p>
            ) : (
              historyDates.map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setShowHistory(false); }}
                  style={{ 
                    padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                    background: selectedDate === date ? 'var(--primary)' : 'var(--background)',
                    color: selectedDate === date ? 'white' : 'var(--text)',
                    fontSize: '0.75rem', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}
                >
                  {date}
                </button>
              ))
            )}
          </div>
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Custom Date:</label>
            <input 
              type="date" 
              className="input-field" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>
        </div>
      )}

      {!showAddForm ? (
        <>
          <button 
            onClick={() => { setEditingItem(null); setFormData({ details: '', status: 'Okay', checkedBy: equipment?.monitoredBy || '', remarks: '' }); setShowAddForm(true); }}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}
          >
            <Plus size={20} /> Add Checklist Item
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checklists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px' }}>
                <ClipboardCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No inspection records for this date.</p>
              </div>
            ) : (
              checklists.map(c => (
                <div 
                  key={c.id} 
                  className="card" 
                  onClick={() => handleEdit(c)}
                  style={{ padding: '1rem', cursor: 'pointer', borderLeft: `6px solid ${c.status === 'Okay' ? 'var(--success)' : 'var(--danger)'}`, position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {c.status === 'Okay' ? <CheckCircle2 color="var(--success)" size={20} /> : <XCircle color="var(--danger)" size={20} />}
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{c.details}</h3>
                        <p style={{ fontSize: '0.8rem', color: c.status === 'Okay' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{c.status.toUpperCase()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, c.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--background)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} /> Checked by: <span style={{ color: 'var(--text)' }}>{c.checkedBy}</span>
                    </div>
                  </div>
                  
                  {c.remarks && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Remarks:</strong> {c.remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ animation: 'tabFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>{editingItem ? 'Edit Item' : 'Add Inspection Item'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Item Details / Description" 
              icon={<ClipboardCheck size={18} />}
              value={formData.details} 
              onChange={e => setFormData({...formData, details: e.target.value})} 
              placeholder="e.g. Check Oil Level / Filter Status"
              required
            />
            
            <div className="input-group">
              <label className="input-label">Inspection Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['Okay', 'Not Okay'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({...formData, status: s})}
                    style={{ 
                      flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)',
                      background: formData.status === s ? (s === 'Okay' ? 'var(--success)' : 'var(--danger)') : 'var(--surface)',
                      color: formData.status === s ? 'white' : 'var(--text)',
                      fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Checked By" 
              icon={<User size={18} />}
              value={formData.checkedBy} 
              onChange={e => setFormData({...formData, checkedBy: e.target.value})} 
              placeholder="Name of inspector"
              required
            />

            <div className="input-group">
              <label className="input-label">Remarks</label>
              <textarea 
                className="input-field" 
                style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                placeholder="Findings or recommendations..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingItem ? 'Update Item' : 'Save Inspection'}</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
