import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStorage, type FieldRecord } from '../context/StorageContext';
import { Search, Trash2, Calendar, Download, X, LayoutGrid, User, Settings, Camera, Share2, Edit3, PenTool, FileText, Filter, Image as ImageIcon } from 'lucide-react';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { SchedulePage } from './SchedulePage';
import { ImageEditor } from '../components/ImageEditor';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Tab = 'gallery' | 'schedule' | 'profile' | 'settings';
type FilterMode = 'all' | 'day' | 'month' | 'year' | 'range';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { getRecords, deleteRecord, saveRecord } = useStorage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FieldRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Filter States
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadRecords();
    }
    const storedView = localStorage.getItem('fieldsnap_view_type') as any;
    const storedSort = localStorage.getItem('fieldsnap_sort_order') as any;
    if (storedView) setViewType(storedView);
    if (storedSort) setSortOrder(storedSort);
  }, [activeTab]);

  useEffect(() => {
    let result = [...records];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.metadata.projectName.toLowerCase().includes(q) ||
        r.metadata.location.toLowerCase().includes(q) ||
        r.metadata.trade.toLowerCase().includes(q) ||
        r.metadata.details?.toLowerCase().includes(q) || // Search in details
        r.metadata.remarks.toLowerCase().includes(q)
      );
    }
    if (filterMode === 'day' && filterDate) {
      result = result.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === filterDate);
    } else if (filterMode === 'month' && filterMonth) {
      result = result.filter(r => new Date(r.timestamp).toISOString().slice(0, 7) === filterMonth);
    } else if (filterMode === 'year' && filterYear) {
      result = result.filter(r => new Date(r.timestamp).getFullYear().toString() === filterYear);
    } else if (filterMode === 'range' && startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;
      result = result.filter(r => r.timestamp >= start && r.timestamp <= end);
    }
    setFilteredRecords(result);
  }, [searchQuery, records, filterMode, filterDate, filterMonth, filterYear, startDate, endDate]);

  const loadRecords = async () => {
    let data = await getRecords();
    const storedSort = localStorage.getItem('fieldsnap_sort_order');
    if (storedSort === 'oldest') {
      data = [...data].sort((a, b) => a.timestamp - b.timestamp);
    } else {
      data = [...data].sort((a, b) => b.timestamp - a.timestamp);
    }
    setRecords(data);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(id).then(() => loadRecords());
    }
  };

  const handleDownload = (e: React.MouseEvent, record: FieldRecord) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = record.imageData;
    link.download = `FieldSnap_${record.metadata.projectName.replace(/\s+/g, '_') || 'Capture'}_${new Date(record.timestamp).getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (e: React.MouseEvent, record: FieldRecord) => {
    e.stopPropagation();
    if (!navigator.share) {
      alert("Sharing is not supported on this browser.");
      return;
    }
    try {
      const res = await fetch(record.imageData);
      const blob = await res.blob();
      const file = new File([blob], `${record.metadata.projectName || 'FieldSnap'}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `FieldSnap: ${record.metadata.projectName}`, text: `Documentation for ${record.metadata.projectName}` });
      }
    } catch (err) { console.error(err); }
  };

  const handleExportPDF = (e: React.MouseEvent, record: FieldRecord) => {
    e.stopPropagation();
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15;
    doc.setFontSize(18);
    doc.setTextColor(0, 123, 255);
    doc.text('SITE INSPECTION REPORT', margin, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Company: ${user?.profile?.company || 'N/A'}`, margin, 26);
    doc.text(`Project: ${record.metadata.projectName || 'Untitled'}`, margin, 31);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 36);
    const imgProps = doc.getImageProperties(record.imageData);
    const imgRatio = imgProps.height / imgProps.width;
    const displayImgHeight = Math.min((doc.internal.pageSize.getWidth() - 30) * imgRatio, 120);
    const displayImgWidth = displayImgHeight / imgRatio;
    doc.addImage(record.imageData, 'JPEG', margin + (doc.internal.pageSize.getWidth() - 30 - displayImgWidth) / 2, 45, displayImgWidth, displayImgHeight);
    autoTable(doc, {
      startY: 45 + displayImgHeight + 10,
      margin: { left: margin, right: margin },
      head: [['Field', 'Information']],
      body: [
        ['Project Name', record.metadata.projectName || '-'],
        ['Location', record.metadata.location || '-'],
        ['Date & Time', new Date(record.timestamp).toLocaleString()],
        ['Trade', record.metadata.trade || '-'],
        ['Details', record.metadata.details || '-'], // Added to PDF
        ['Engineer In-Charge', record.metadata.engineer || '-'],
        ['Inspected By', record.metadata.inspectedBy || '-'],
        ['Remarks', record.metadata.remarks || '-']
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] },
      styles: { fontSize: 10, cellPadding: 4 }
    });
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Publisher: Engr. Ailes`, margin, doc.internal.pageSize.getHeight() - 15);
    doc.save(`Report_${record.metadata.projectName || 'Site'}_${Date.now()}.pdf`);
  };

  const handleSaveEdit = async (newImageData: string) => {
    if (!selectedRecord) return;
    try {
      await saveRecord({ ...selectedRecord, imageData: newImageData });
      setIsEditing(false);
      setSelectedRecord(null);
      loadRecords();
      alert("Changes saved to gallery!");
    } catch (err) { alert(err); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        navigate('/edit', { state: { imageData: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case 'schedule': content = <SchedulePage />; break;
      case 'profile': content = <ProfilePage />; break;
      case 'settings': content = <SettingsPage />; break;
      default: content = (
        <div className="container" style={{ paddingBottom: '120px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>My Gallery</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome, {user?.profile?.fullName || user?.name}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="file" id="import-image" accept="image/*" style={{ display: 'none' }} onChange={handleImport} />
              <button onClick={() => document.getElementById('import-image')?.click()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', padding: '0.75rem', color: 'var(--text)' }} title="Import Image"><ImageIcon size={20} /></button>
              <button onClick={() => { setShowFilterBar(!showFilterBar); setShowSearchBar(false); }} style={{ background: showFilterBar ? 'var(--primary)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', padding: '0.75rem', color: showFilterBar ? 'white' : 'var(--text)' }} title="Filter"><Filter size={20} /></button>
              <button onClick={() => { setShowSearchBar(!showSearchBar); setShowFilterBar(false); }} style={{ background: showSearchBar ? 'var(--primary)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', padding: '0.75rem', color: showSearchBar ? 'white' : 'var(--text)' }} title="Search"><Search size={20} /></button>
              <button onClick={() => navigate('/sketch')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', padding: '0.75rem', color: 'var(--text)' }} title="Sketch"><PenTool size={20} /></button>
            </div>
          </header>

          {showSearchBar && (
            <div style={{ marginBottom: '1.5rem', animation: 'tabFadeIn 0.2s ease-out' }}>
              <input type="text" placeholder="Search projects..." className="input-field" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            </div>
          )}

          {showFilterBar && (
            <div className="card" style={{ marginBottom: '1.5rem', animation: 'tabFadeIn 0.2s ease-out', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
                {(['all', 'day', 'month', 'year', 'range'] as FilterMode[]).map(mode => (
                  <button key={mode} onClick={() => setFilterMode(mode)} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', background: filterMode === mode ? 'var(--primary)' : 'var(--background)', color: filterMode === mode ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}>{mode.toUpperCase()}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {filterMode === 'day' && <input type="date" className="input-field" value={filterDate} onChange={e => setFilterDate(e.target.value)} />}
                {filterMode === 'month' && <input type="month" className="input-field" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />}
                {filterMode === 'year' && <input type="number" placeholder="YYYY" className="input-field" value={filterYear} onChange={e => setFilterYear(e.target.value)} />}
                {filterMode === 'range' && (
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <input type="date" className="input-field" style={{ flex: 1 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <input type="date" className="input-field" style={{ flex: 1 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                )}
                {filterMode !== 'all' && <button onClick={() => { setFilterMode('all'); setShowFilterBar(false); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '0.5rem' }}><X size={20} /></button>}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: viewType === 'grid' ? 'repeat(2, 1fr)' : '1fr', gap: '0.75rem' }}>
            {filteredRecords.map(record => (
              <div key={record.id} className="card" onClick={() => setSelectedRecord(record)} style={{ padding: 0, overflow: 'hidden', border: 'none', position: 'relative', cursor: 'pointer', height: viewType === 'list' ? '80px' : 'auto', aspectRatio: viewType === 'grid' ? '1/1' : 'auto' }}>
                <img src={record.imageData} alt={record.metadata.projectName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: viewType === 'list' ? '0.5rem 0.75rem' : '0.75rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <p style={{ fontSize: viewType === 'list' ? '0.9rem' : '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.metadata.projectName}</p>
                  <p style={{ fontSize: '0.65rem', opacity: 0.9 }}>{new Date(record.timestamp).toLocaleDateString()}</p>
                </div>
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                  <button onClick={(e) => handleShare(e, record)} style={{ background: 'rgba(40, 167, 69, 0.9)', border: 'none', borderRadius: '6px', padding: '0.3rem', color: 'white' }}><Share2 size={12} /></button>
                  <button onClick={(e) => handleExportPDF(e, record)} style={{ background: 'rgba(255, 152, 0, 0.9)', border: 'none', borderRadius: '6px', padding: '0.3rem', color: 'white' }}><FileText size={12} /></button>
                  <button onClick={(e) => handleDownload(e, record)} style={{ background: 'rgba(0, 123, 255, 0.9)', border: 'none', borderRadius: '6px', padding: '0.3rem', color: 'white' }}><Download size={12} /></button>
                  <button onClick={(e) => handleDelete(e, record.id)} style={{ background: 'rgba(220, 53, 69, 0.9)', border: 'none', borderRadius: '6px', padding: '0.3rem', color: 'white' }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <div key={activeTab} className="tab-content">{content}</div>;
  };

  return (
    <>
      {renderContent()}
      {selectedRecord && !isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedRecord(null)}>
          <div style={{ position: 'absolute', top: '2rem', right: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.75rem', color: 'white' }}><Edit3 size={24} /></button>
            <button onClick={() => setSelectedRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.75rem', color: 'white' }}><X size={24} /></button>
          </div>
          <img src={selectedRecord.imageData} alt="Full view" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
      {isEditing && selectedRecord && <ImageEditor imageData={selectedRecord.imageData} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '72px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100 }}>
        <NavItem active={activeTab === 'gallery'} icon={<LayoutGrid size={22} />} label="Gallery" onClick={() => setActiveTab('gallery')} />
        <NavItem active={activeTab === 'schedule'} icon={<Calendar size={22} />} label="Schedule" onClick={() => setActiveTab('schedule')} />
        <div style={{ width: '72px', height: '72px', position: 'relative', marginTop: '-30px' }}>
          <button onClick={() => navigate('/capture')} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: '4px solid var(--surface)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} className="nav-item">
            <Camera size={32} />
          </button>
        </div>
        <NavItem active={activeTab === 'profile'} icon={<User size={22} />} label="Profile" onClick={() => setActiveTab('profile')} />
        <NavItem active={activeTab === 'settings'} icon={<Settings size={22} />} label="Settings" onClick={() => setActiveTab('settings')} />
      </nav>
    </>
  );
};

const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className={`nav-item ${active ? 'active' : ''}`} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: active ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}>
    {icon}
    <span style={{ fontSize: '0.65rem', fontWeight: active ? '600' : '400' }}>{label}</span>
  </button>
);
