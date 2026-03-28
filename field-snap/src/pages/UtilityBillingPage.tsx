import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorage, type Tenant } from '../context/StorageContext';
import { generateId } from '../utils/id';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, ChevronLeft, User, Building, CheckCircle2, XCircle, Trash2, Download, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const UtilityBillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveTenant, getTenants, deleteTenant, getReadings } = useStorage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: 'Active' as 'Active' | 'Inactive',
    contactPerson: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTenants(tenants);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredTenants(tenants.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.type.toLowerCase().includes(q) || 
        t.contactPerson.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, tenants]);

  const loadTenants = async () => {
    const data = await getTenants();
    setTenants(data);
    setFilteredTenants(data);
  };

  const handleExportAllPDF = async () => {
    const doc = new jsPDF();
    const allTenants = await getTenants();
    
    doc.setFontSize(20);
    doc.text('Master Utility Billing Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    let currentY = 35;
    const utilityOrder = { 'Electric': 0, 'Water': 1, 'Gas': 2 };

    for (const tenant of allTenants) {
      const readings = await getReadings(tenant.id);
      
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`${tenant.name} (${tenant.type})`, 14, currentY);
      currentY += 6;
      
      if (readings.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('No billing history available.', 14, currentY);
        currentY += 10;
        continue;
      }

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
        startY: currentY,
        head: [['Utility', 'Date', 'Account No.', 'Prev', 'Curr', 'Cons', 'Rate', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.save(`Master_Utility_Billing_${new Date().getTime()}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTenant({
      id: generateId(),
      ...formData,
      timestamp: Date.now()
    });
    setFormData({ name: '', type: '', status: 'Active', contactPerson: '' });
    setIsAdding(false);
    loadTenants();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this tenant? All billing data will be lost.')) {
      await deleteTenant(id);
      loadTenants();
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Utility Billing</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {tenants.length > 0 && !isAdding && (
            <button 
              onClick={() => setShowSearch(!showSearch)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem' }}
              title="Search Tenants"
            >
              <Search size={24} />
            </button>
          )}

          {tenants.length > 0 && !isAdding && (
            <button 
              onClick={handleExportAllPDF}
              style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
              title="Export All to PDF"
            >
              <Download size={18} />
              <span>Export All</span>
            </button>
          )}
          
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </header>

      {showSearch && !isAdding && (
        <div style={{ marginBottom: '1.5rem', position: 'relative', animation: 'tabFadeIn 0.3s ease' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search tenant, type, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            autoFocus
          />
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleSubmit} className="card" style={{ animation: 'tabFadeIn 0.3s ease' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Add New Tenant</h3>
          <Input label="Tenant Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Input label="Type of Establishment" placeholder="e.g. Commercial, Residential" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required />
          <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} required />
          
          <div className="input-group">
            <label className="input-label">Status</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['Active', 'Inactive'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s as any})}
                  style={{ 
                    flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)',
                    background: formData.status === s ? 'var(--primary)' : 'var(--surface)',
                    color: formData.status === s ? 'white' : 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit">Save Tenant</Button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
              <Building size={64} style={{ marginBottom: '1rem' }} />
              <p>{searchQuery ? 'No matching tenants found' : 'No tenants added yet'}</p>
            </div>
          ) : (
            filteredTenants.map(tenant => (
              <div 
                key={tenant.id} 
                className="card" 
                onClick={() => navigate(`/tenant/${tenant.id}`)}
                style={{ cursor: 'pointer', borderLeft: `6px solid ${tenant.status === 'Active' ? 'var(--success)' : '#666'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{tenant.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{tenant.type}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14} /> {tenant.contactPerson}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: tenant.status === 'Active' ? 'var(--success)' : 'inherit' }}>
                        {tenant.status === 'Active' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {tenant.status}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, tenant.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
