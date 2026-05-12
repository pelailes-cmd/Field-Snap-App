import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '../utils/id';
import { useStorage, type InspectionForm, type FieldRecord } from '../context/StorageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ChevronLeft, FileText, Plus, Trash2, Calendar, Download, XCircle, Search, X, Image as ImageIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ViewMode = 'list' | 'add';

export const TechnicalReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveForm, getForms, deleteForm, getRecords } = useStorage();
  
  const [reports, setReports] = useState<InspectionForm[]>([]);
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    trade: '',
    date: new Date().toISOString().split('T')[0],
    issues: '',
    addressedTo: '',
    approvedBy: '',
    requestedBy: '',
    status: 'Pending' as 'Pending' | 'Approved' | 'Implemented',
    remarks: '',
    imageIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allForms = await getForms();
    setReports(allForms.filter(f => f.type === 'TechnicalReport'));
    const allRecords = await getRecords();
    setRecords(allRecords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveForm({
      ...formData,
      id: generateId(),
      type: 'TechnicalReport',
      timestamp: Date.now()
    });
    setFormData({
      projectName: '',
      location: '',
      trade: '',
      date: new Date().toISOString().split('T')[0],
      issues: '',
      addressedTo: '',
      approvedBy: '',
      requestedBy: '',
      status: 'Pending',
      remarks: '',
      imageIds: []
    });
    setViewMode('list');
    loadData();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this report?')) {
      await deleteForm(id);
      loadData();
    }
  };

  const toggleImageSelection = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.imageIds.includes(id);
      if (isSelected) {
        return { ...prev, imageIds: prev.imageIds.filter(i => i !== id) };
      } else {
        if (prev.imageIds.length >= 4) {
          alert("Maximum 4 images allowed");
          return prev;
        }
        return { ...prev, imageIds: [...prev.imageIds, id] };
      }
    });
  };

  const handleExportPDF = async (report: InspectionForm) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    doc.setFontSize(22);
    doc.setTextColor(0, 123, 255);
    doc.text('TECHNICAL REPORT', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report ID: ${report.id.slice(0, 8).toUpperCase()}`, pageWidth / 2, 26, { align: 'center' });

    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      body: [
        [
          { content: 'Project', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.projectName, 
          { content: 'Date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.date
        ],
        [
          { content: 'Location', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.location, 
          { content: 'Trade', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.trade || 'N/A'
        ],
        [
          { content: 'Observations', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          { content: report.issues, colSpan: 3 }
        ],
        [
          { content: 'Recommendations', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          { content: report.remarks, colSpan: 3 }
        ],
        [
          { content: 'Status', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.status, 
          { content: 'Addressed To', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          report.addressedTo
        ]
      ],
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 8.5, valign: 'middle' },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 35 }, 3: { cellWidth: 55 } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;
    const signatureAreaHeight = 40;
    const availableImageHeight = pageHeight - currentY - signatureAreaHeight - 10;

    // Photos section
    if (report.imageIds && report.imageIds.length > 0) {
      const selectedRecords = records.filter(r => report.imageIds?.includes(r.id)).slice(0, 4);
      if (selectedRecords.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('TECHNICAL DOCUMENTATION PHOTOS:', margin, currentY);
        currentY += 6;

        const maxImgWidth = (pageWidth - (margin * 3)) / 2;
        const numRows = Math.ceil(selectedRecords.length / 2);
        const maxImgHeight = (availableImageHeight - (numRows > 1 ? 5 : 0)) / numRows;

        selectedRecords.forEach((record, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const x = margin + col * (maxImgWidth + margin);
          const y = currentY + row * (maxImgHeight + 5);
          
          try {
            const props = doc.getImageProperties(record.imageData);
            const ratio = props.width / props.height;
            
            let drawWidth = maxImgWidth;
            let drawHeight = maxImgWidth / ratio;
            
            if (drawHeight > maxImgHeight) {
              drawHeight = maxImgHeight;
              drawWidth = drawHeight * ratio;
            }

            // Center the image within its assigned slot
            const offsetX = (maxImgWidth - drawWidth) / 2;
            const offsetY = (maxImgHeight - drawHeight) / 2;

            doc.addImage(record.imageData, 'JPEG', x + offsetX, y + offsetY, drawWidth, drawHeight, undefined, 'MEDIUM');
          } catch (e) {
            console.error("Error adding image to Technical Report PDF", e);
          }
        });
      }
    }

    // Signature Area
    const sigY = pageHeight - 35;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared By:', margin, sigY);
    doc.setFont('helvetica', 'normal');
    doc.text(report.requestedBy || '________________________', margin, sigY + 7);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Noted By:', pageWidth - margin, sigY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(report.approvedBy || '________________________', pageWidth - margin, sigY + 7, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 10);

    doc.save(`TechnicalReport_${report.projectName.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredReports = reports.filter(r => 
    r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Technical Report</h1>
        </div>
        
        {viewMode === 'list' && (
          <button 
            onClick={() => setViewMode('add')}
            style={{ 
              background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', 
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' 
            }}
          >
            <Plus size={24} />
          </button>
        )}
      </header>

      {viewMode === 'add' ? (
        <form onSubmit={handleSubmit} className="card" style={{ animation: 'tabFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button type="button" onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
              <ChevronLeft size={24} />
            </button>
            <h3 style={{ margin: 0 }}>New Technical Report</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Project Name" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} required />
            <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            <Input label="Trade / Discipline" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value})} />
          </div>

          <div className="input-group">
            <label className="input-label">Technical Observations</label>
            <textarea className="input-field" style={{ minHeight: '100px' }} value={formData.issues} onChange={e => setFormData({...formData, issues: e.target.value})} required />
          </div>

          <div className="input-group">
            <label className="input-label">Recommendations</label>
            <textarea className="input-field" style={{ minHeight: '100px' }} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Addressed To" value={formData.addressedTo} onChange={e => setFormData({...formData, addressedTo: e.target.value})} />
            <div className="input-group">
              <label className="input-label">Report Status</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Implemented">Implemented</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Prepared By" value={formData.requestedBy} onChange={e => setFormData({...formData, requestedBy: e.target.value})} />
            <Input label="Noted By" value={formData.approvedBy} onChange={e => setFormData({...formData, approvedBy: e.target.value})} />
          </div>

          <div className="input-group">
            <label className="input-label">Attached Photos ({formData.imageIds.length}/4)</label>
            <Button type="button" variant="secondary" onClick={() => setIsSelectingImages(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <ImageIcon size={18} /> Select Photos from Gallery
            </Button>
            
            {formData.imageIds.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                {records.filter(r => formData.imageIds.includes(r.id)).map(r => (
                  <div key={r.id} style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={r.imageData} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                    <button type="button" onClick={() => toggleImageSelection(r.id)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" style={{ marginTop: '1rem' }}>Save Technical Report</Button>
        </form>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <input type="text" className="input-field" placeholder="Search reports..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
                <FileText size={64} style={{ marginBottom: '1rem' }} />
                <p>No technical reports found</p>
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{report.projectName}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{report.location}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleExportPDF(report)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }} title="Export PDF"><Download size={20} /></button>
                      <button onClick={(e) => handleDelete(e, report.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={20} /></button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {report.date}</span>
                      <span style={{ fontWeight: '600', color: report.status === 'Approved' ? 'var(--success)' : 'var(--primary)' }}>{report.status}</span>
                    </div>
                    {report.imageIds && report.imageIds.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}><ImageIcon size={14} /> {report.imageIds.length} Photos</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {isSelectingImages && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, padding: '1rem', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '20px', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '0 auto', width: '100%', overflow: 'hidden' }}>
            <header style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Select Photos ({formData.imageIds.length}/4)</h2>
              <button onClick={() => setIsSelectingImages(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </header>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {records.map(record => {
                const isSelected = formData.imageIds.includes(record.id);
                return (
                  <div key={record.id} onClick={() => toggleImageSelection(record.id)} style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer' }}>
                    <img src={record.imageData} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: isSelected ? '4px solid var(--primary)' : 'none' }} alt="" />
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <Button onClick={() => setIsSelectingImages(false)}>Done Selecting</Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tabFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
