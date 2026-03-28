import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorage, type Tenant, type UtilityReading } from '../context/StorageContext';
import { generateId } from '../utils/id';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ChevronLeft, Zap, Droplets, Flame, Trash2, Activity, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TenantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTenants, saveReading, getReadings, deleteReading } = useStorage();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<'Electric' | 'Water' | 'Gas'>('Electric');
  
  const [formData, setFormData] = useState({
    currentReading: '',
    previousReading: '',
    ratePrice: '',
    accountNumber: ''
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    const allTenants = await getTenants();
    const found = allTenants.find(t => t.id === id);
    if (found) {
      setTenant(found);
      const r = await getReadings(id!);
      setReadings(r);
    } else {
      navigate('/utility-billing');
    }
  };

  const handleExportPDF = () => {
    if (!tenant) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Utility Billing Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Tenant: ${tenant.name}`, 14, 32);
    doc.text(`Type: ${tenant.type}`, 14, 38);
    doc.text(`Contact: ${tenant.contactPerson}`, 14, 44);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 50);

    // Prepare table data
    const utilityOrder = { 'Electric': 0, 'Water': 1, 'Gas': 2 };
    const sortedReadings = [...readings].sort((a, b) => {
      if (utilityOrder[a.type] !== utilityOrder[b.type]) {
        return utilityOrder[a.type] - utilityOrder[b.type];
      }
      return a.timestamp - b.timestamp;
    });

    const tableData = sortedReadings.map(r => {
      const consumption = r.currentReading - r.previousReading;
      const totalAmount = consumption * r.ratePrice;
      return [
        r.type,
        new Date(r.timestamp).toLocaleDateString(),
        r.accountNumber,
        r.previousReading.toFixed(2),
        r.currentReading.toFixed(2),
        consumption.toFixed(2),
        r.ratePrice.toFixed(2),
        `P ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: [['Utility', 'Date', 'Account No.', 'Prev', 'Curr', 'Cons', 'Rate', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] }
    });

    doc.save(`${tenant.name.replace(/\s+/g, '_')}_Utility_Billing.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await saveReading({
      id: generateId(),
      tenantId: id,
      type: selectedUtility,
      currentReading: parseFloat(formData.currentReading),
      previousReading: parseFloat(formData.previousReading),
      ratePrice: parseFloat(formData.ratePrice),
      accountNumber: formData.accountNumber,
      timestamp: Date.now()
    });

    setFormData({ currentReading: '', previousReading: '', ratePrice: '', accountNumber: '' });
    setIsAdding(false);
    loadData();
  };

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'Electric': return <Zap size={18} color="#f59e0b" />;
      case 'Water': return <Droplets size={18} color="#3b82f6" />;
      case 'Gas': return <Flame size={18} color="#ef4444" />;
      default: return null;
    }
  };

  if (!tenant) return null;

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/utility-billing')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{tenant.name}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tenant.type}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {readings.length > 0 && (
            <button 
              onClick={handleExportPDF}
              style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}
              title="Export to PDF"
            >
              <Download size={18} />
              <span>PDF</span>
            </button>
          )}
          
          <div style={{ position: 'relative' }}>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
              onChange={(e) => {
                setSelectedUtility(e.target.value as any);
                setIsAdding(true);
              }}
              value=""
            >
              <option value="" disabled>+ Utility</option>
              <option value="Electric">Electric</option>
              <option value="Water">Water</option>
              <option value="Gas">Gas</option>
            </select>
          </div>
        </div>
      </header>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="card" style={{ animation: 'tabFadeIn 0.3s ease', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {getUtilityIcon(selectedUtility)}
            <h3 style={{ margin: 0 }}>Add {selectedUtility} Reading</h3>
          </div>
          
          <Input label="Account Number" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Current Reading" type="number" step="0.01" value={formData.currentReading} onChange={e => setFormData({...formData, currentReading: e.target.value})} required />
            <Input label="Previous Reading" type="number" step="0.01" value={formData.previousReading} onChange={e => setFormData({...formData, previousReading: e.target.value})} required />
          </div>
          
          <Input label="Rate Price" type="number" step="0.01" value={formData.ratePrice} onChange={e => setFormData({...formData, ratePrice: e.target.value})} required />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit">Save Reading</Button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} /> Billing History</h3>
          
          {readings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.5 }}>
              <p>No billing records found</p>
            </div>
          ) : (
            readings.map(r => {
              const consumption = r.currentReading - r.previousReading;
              const totalAmount = consumption * r.ratePrice;
              
              return (
                <div key={r.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getUtilityIcon(r.type)}
                      <span style={{ fontWeight: 'bold' }}>{r.type}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Account No.</p>
                      <p style={{ fontWeight: '500' }}>{r.accountNumber}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Consumption</p>
                      <p style={{ fontWeight: '500' }}>{consumption.toFixed(2)} units</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', textAlign: 'center' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Previous</p>
                      <p style={{ fontWeight: '600' }}>{r.previousReading.toFixed(2)}</p>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Current</p>
                      <p style={{ fontWeight: '600' }}>{r.currentReading.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Rate</p>
                      <p style={{ fontWeight: '600' }}>{r.ratePrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Amount</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      onClick={() => { if(window.confirm('Delete this record?')) { deleteReading(r.id); loadData(); } }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
