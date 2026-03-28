import React, { useState, useEffect } from 'react';
import { generateId } from '../utils/id';
import { useStorage, type ScheduleEvent, type TaskStatus, type InspectionForm, type FieldRecord } from '../context/StorageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Calendar, Clock, Trash2, CheckCircle2, Circle, PlayCircle, XCircle, LayoutList, Bell, FileText, Plus, ChevronLeft, Download, Image as ImageIcon, X } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notification';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ViewMode = 'tasks' | 'forms' | 'add-form';

export const SchedulePage: React.FC = () => {
  const { saveSchedule, getSchedules, deleteSchedule, saveForm, getForms, deleteForm, getRecords } = useStorage();
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [forms, setForms] = useState<InspectionForm[]>([]);
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const [taskFormData, setFormData] = useState({
    subject: '',
    notes: '',
    details: '',
    dateTime: '',
    status: 'Pending' as TaskStatus,
    reminderMinutes: 60
  });

  const REMINDER_OPTIONS = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '1d', value: 1440 },
  ];

  const [routingFormData, setRoutingFormData] = useState({
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
    loadSchedules();
    loadForms();
    loadRecords();
  }, []);

  const loadSchedules = async () => {
    const data = await getSchedules();
    setSchedules(data);
  };

  const loadForms = async () => {
    const data = await getForms();
    setForms(data.filter(f => f.type === 'Routing'));
  };

  const loadRecords = async () => {
    const data = await getRecords();
    setRecords(data);
  };

  const toggleImageSelection = (id: string) => {
    setRoutingFormData(prev => {
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

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.subject || !taskFormData.dateTime) return;

    await saveSchedule({
      id: generateId(),
      subject: taskFormData.subject,
      notes: taskFormData.notes,
      details: taskFormData.details,
      dateTime: taskFormData.dateTime,
      status: taskFormData.status,
      reminderMinutes: taskFormData.reminderMinutes
    });

    setFormData({ subject: '', notes: '', details: '', dateTime: '', status: 'Pending', reminderMinutes: 60 });
    setIsAddingTask(false);
    loadSchedules();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await saveForm({
      ...routingFormData,
      id: generateId(),
      type: 'Routing',
      timestamp: Date.now()
    });
    setRoutingFormData({
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
    setViewMode('forms');
    loadForms();
  };

  const handleExportPDF = async (form: InspectionForm) => {
    const doc = new jsPDF();
    const margin = 15; // Reduced margin
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(18); // Slightly smaller
    doc.setTextColor(0, 123, 255);
    doc.text('ROUTING FORM', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    // Display original ID format (truncated for display if it's too long, but here we show full as per previous request to show ID)
    doc.text(`Report ID: ${form.id.length > 20 ? form.id.slice(0, 8).toUpperCase() : form.id}`, pageWidth / 2, 20, { align: 'center' });

    autoTable(doc, {
      startY: 25,
      margin: { left: margin, right: margin },
      body: [
        [
          { content: 'Project Name', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.projectName, 
          { content: 'Date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.date
        ],
        [
          { content: 'Location', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.location, 
          { content: 'Addressed To', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.addressedTo
        ],
        [
          { content: 'Trade', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.trade, 
          { content: 'Status', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          form.status
        ],
        [
          { content: 'Concerns / Issues', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          { content: form.issues, colSpan: 3 }
        ],
        [
          { content: 'Remarks / Notes', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
          { content: form.remarks, colSpan: 3 }
        ]
      ],
      theme: 'grid',
      styles: { cellPadding: 3, fontSize: 9, valign: 'middle' },
      columnStyles: { 
        0: { cellWidth: 35 }, 
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 55 }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;
    const signatureAreaHeight = 40;
    const signatureYLimit = pageHeight - signatureAreaHeight;

    // Add Images if any
    if (form.imageIds && form.imageIds.length > 0) {
      const allRecords = await getRecords();
      const selectedRecords = allRecords.filter(r => form.imageIds?.includes(r.id)).slice(0, 4);
      
      if (selectedRecords.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Attached Photos:', margin, currentY);
        currentY += 6;

        const numImages = selectedRecords.length;
        const numRows = Math.ceil(numImages / 2);
        const availableHeight = signatureYLimit - currentY - 5;
        const maxImgHeightPerRow = (availableHeight - (numRows > 1 ? 5 : 0)) / numRows;
        const maxImgWidthPerCol = (pageWidth - (margin * 3)) / 2;

        selectedRecords.forEach((record, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const x = margin + col * (maxImgWidthPerCol + margin);
          const y = currentY + row * (maxImgHeightPerRow + 5);
          
          try {
            const props = doc.getImageProperties(record.imageData);
            const ratio = props.width / props.height;
            
            let drawWidth = maxImgWidthPerCol;
            let drawHeight = maxImgWidthPerCol / ratio;
            
            if (drawHeight > maxImgHeightPerRow) {
              drawHeight = maxImgHeightPerRow;
              drawWidth = drawHeight * ratio;
            }

            // Center in the assigned slot
            const offsetX = (maxImgWidthPerCol - drawWidth) / 2;
            const offsetY = (maxImgHeightPerRow - drawHeight) / 2;
            
            doc.addImage(record.imageData, 'JPEG', x + offsetX, y + offsetY, drawWidth, drawHeight, undefined, 'FAST');
          } catch (e) {
            console.error("Error adding image to PDF", e);
          }
        });
        
        currentY = signatureYLimit; // Push currentY to the signature area
      }
    }

    // Signatures Section (Fixed Bottom)
    const signatureY = pageHeight - 35;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Requested By (Bottom Left)
    doc.setFont('helvetica', 'bold');
    doc.text('Requested By:', margin, signatureY);
    doc.setFont('helvetica', 'normal');
    doc.text(form.requestedBy || '________________________', margin, signatureY + 6);
    
    // Approved By (Bottom Right)
    doc.setFont('helvetica', 'bold');
    doc.text('Approved By:', pageWidth - margin, signatureY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(form.approvedBy || '________________________', pageWidth - margin, signatureY + 6, { align: 'right' });

    // Footer Note
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    doc.text('see attached report', pageWidth / 2, pageHeight - 12, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 8);
    
    doc.save(`RoutingForm_${form.projectName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      await deleteSchedule(id);
      loadSchedules();
    }
  };

  const updateStatus = async (event: ScheduleEvent, newStatus: TaskStatus) => {
    await saveSchedule({ ...event, status: newStatus });
    loadSchedules();
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={20} color="var(--success)" />;
      case 'On-going': return <PlayCircle size={20} color="var(--primary)" />;
      case 'Cancelled': return <XCircle size={20} color="var(--danger)" />;
      default: return <Circle size={20} color="#666" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return 'var(--success)';
      case 'On-going': return 'var(--primary)';
      case 'Cancelled': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      {permissionStatus === 'default' && (
        <div className="card" style={{ marginBottom: '1rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'tabFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={24} />
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Enable Reminders</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>Get notified 1 hour before tasks</p>
            </div>
          </div>
          <button 
            onClick={handleEnableNotifications}
            style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Allow
          </button>
        </div>
      )}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Site Tasks & Forms</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => { setViewMode('tasks'); setIsAddingTask(false); }}
            style={{ 
              background: viewMode === 'tasks' ? 'var(--primary)' : 'var(--surface)', 
              border: '1px solid var(--border)', borderRadius: '12px', color: viewMode === 'tasks' ? 'white' : 'var(--text)', padding: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            <LayoutList size={20} />
          </button>
          <button 
            onClick={() => { setViewMode('forms'); setIsAddingTask(false); }}
            style={{ 
              background: viewMode === 'forms' ? 'var(--primary)' : 'var(--surface)', 
              border: '1px solid var(--border)', borderRadius: '12px', color: viewMode === 'forms' ? 'white' : 'var(--text)', padding: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            <FileText size={20} />
          </button>
          {viewMode === 'tasks' ? (
            <button 
              onClick={() => setIsAddingTask(!isAddingTask)}
              style={{ 
                background: isAddingTask ? 'var(--danger)' : 'var(--primary)', 
                border: 'none', borderRadius: '12px', color: 'white', padding: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {isAddingTask ? <XCircle size={20} /> : <Plus size={20} />}
            </button>
          ) : (
            <button 
              onClick={() => setViewMode(viewMode === 'add-form' ? 'forms' : 'add-form')}
              style={{ 
                background: viewMode === 'add-form' ? 'var(--danger)' : 'var(--primary)', 
                border: 'none', borderRadius: '12px', color: 'white', padding: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {viewMode === 'add-form' ? <XCircle size={20} /> : <Plus size={20} />}
            </button>
          )}
        </div>
      </header>

      {viewMode === 'tasks' && isAddingTask && (
        <form onSubmit={handleTaskSubmit} className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)', animation: 'tabFadeIn 0.3s ease' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Create New Task</h3>
          <Input 
            label="Subject / Task Name" 
            placeholder="e.g. Electrical Rough-in Check" 
            value={taskFormData.subject} 
            onChange={e => setFormData({...taskFormData, subject: e.target.value})} 
            required
          />
          <div className="input-group">
            <label className="input-label">Scheduled Date & Time</label>
            <input 
              type="datetime-local" 
              className="input-field" 
              value={taskFormData.dateTime}
              onChange={e => setFormData({...taskFormData, dateTime: e.target.value})}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Initial Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['Pending', 'On-going', 'Completed', 'Cancelled'] as TaskStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...taskFormData, status: s})}
                  style={{ 
                    padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                    background: taskFormData.status === s ? 'var(--primary)' : 'var(--surface)',
                    color: taskFormData.status === s ? 'white' : 'var(--text)',
                    fontSize: '0.8rem', cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Input 
            label="Short Note" 
            placeholder="Quick reminder..." 
            value={taskFormData.notes} 
            onChange={e => setFormData({...taskFormData, notes: e.target.value})} 
          />
          <div className="input-group">
            <label className="input-label">Reminder Before Task</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {REMINDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({...taskFormData, reminderMinutes: opt.value})}
                  style={{ 
                    padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                    background: taskFormData.reminderMinutes === opt.value ? 'var(--primary)' : 'var(--surface)',
                    color: taskFormData.reminderMinutes === opt.value ? 'white' : 'var(--text)',
                    fontSize: '0.8rem', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Detailed Description</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
              placeholder="List specific items to check or detailed instructions..."
              value={taskFormData.details}
              onChange={e => setFormData({...taskFormData, details: e.target.value})}
            />
          </div>
          <Button type="submit" style={{ height: '56px', borderRadius: '16px' }}>Save Task to Schedule</Button>
        </form>
      )}

      {viewMode === 'add-form' && (
        <form onSubmit={handleFormSubmit} className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)', animation: 'tabFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button type="button" onClick={() => setViewMode('forms')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
            <h3 style={{ margin: 0 }}>New Routing Form</h3>
          </div>
          
          <Input 
            label="Project Name" 
            placeholder="e.g. Grand Residences Phase 1" 
            value={routingFormData.projectName} 
            onChange={e => setRoutingFormData({...routingFormData, projectName: e.target.value})} 
            required
          />
          <Input 
            label="Location / Area" 
            placeholder="e.g. Unit 402, 4th Floor" 
            value={routingFormData.location} 
            onChange={e => setRoutingFormData({...routingFormData, location: e.target.value})} 
            required
          />
          <Input 
            label="Trade / Discipline" 
            placeholder="e.g. Architectural / ID" 
            value={routingFormData.trade} 
            onChange={e => setRoutingFormData({...routingFormData, trade: e.target.value})} 
          />
          <div className="input-group">
            <label className="input-label">Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={routingFormData.date}
              onChange={e => setRoutingFormData({...routingFormData, date: e.target.value})}
              required
            />
          </div>
          <Input 
            label="Addressed To" 
            placeholder="e.g. Client / Interior Designer" 
            value={routingFormData.addressedTo} 
            onChange={e => setRoutingFormData({...routingFormData, addressedTo: e.target.value})} 
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Approved By" 
              placeholder="Full Name" 
              value={routingFormData.approvedBy} 
              onChange={e => setRoutingFormData({...routingFormData, approvedBy: e.target.value})} 
            />
            <Input 
              label="Requested By" 
              placeholder="Full Name" 
              value={routingFormData.requestedBy} 
              onChange={e => setRoutingFormData({...routingFormData, requestedBy: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Issues & Concerns</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '100px', resize: 'none' }}
              placeholder="Identify specific issues or concerns to be addressed..."
              value={routingFormData.issues}
              onChange={e => setRoutingFormData({...routingFormData, issues: e.target.value})}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Implementation Remarks</label>
            <textarea 
              className="input-field" 
              style={{ minHeight: '80px', resize: 'none' }}
              placeholder="Notes for implementation or designer's feedback..."
              value={routingFormData.remarks}
              onChange={e => setRoutingFormData({...routingFormData, remarks: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Status</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['Pending', 'Approved', 'Implemented'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRoutingFormData({...routingFormData, status: s})}
                  style={{ 
                    padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                    background: routingFormData.status === s ? 'var(--primary)' : 'var(--surface)',
                    color: routingFormData.status === s ? 'white' : 'var(--text)',
                    fontSize: '0.8rem', cursor: 'pointer', flex: 1
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Attached Photos ({routingFormData.imageIds.length}/4)
              <button 
                type="button" 
                onClick={() => setIsSelectingImages(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={14} /> Select from Gallery
              </button>
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {routingFormData.imageIds.map(id => {
                const record = records.find(r => r.id === id);
                return record ? (
                  <div key={id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={record.imageData} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button"
                      onClick={() => toggleImageSelection(id)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(220, 53, 69, 0.8)', border: 'none', borderRadius: '50%', padding: '2px', color: 'white', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : null;
              })}
              {routingFormData.imageIds.length === 0 && (
                <div 
                  onClick={() => setIsSelectingImages(true)}
                  style={{ gridColumn: 'span 4', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <ImageIcon size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No photos attached</p>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" style={{ height: '56px', borderRadius: '16px' }}>Save Form</Button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {viewMode === 'tasks' && (
          schedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
              <Calendar size={64} style={{ marginBottom: '1rem' }} />
              <p>No tasks scheduled</p>
            </div>
          ) : (
            schedules.map(event => (
              <div 
                key={event.id} 
                className="card" 
                style={{ 
                  padding: '1rem', borderLeft: `6px solid ${getStatusColor(event.status)}`,
                  transition: 'all 0.2s'
                }}
              >
                {/* ... Task content remains similar but uses task handlers ... */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {getStatusIcon(event.status)}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{event.subject}</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> {new Date(event.dateTime).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontWeight: 'bold', color: getStatusColor(event.status) }}>
                        • {event.status}
                      </span>
                      {event.status !== 'Completed' && event.status !== 'Cancelled' && new Date(event.dateTime) < new Date() && (
                        <span style={{ fontWeight: 'bold', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          • EXPIRED
                        </span>
                      )}
                      {event.status === 'Pending' && !event.notifiedOneHour && (
                        <span style={{ 
                          fontSize: '0.7rem', background: 'var(--primary-light, rgba(0,123,255,0.1))', 
                          color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}>
                          <Clock size={10} /> 
                          {event.reminderMinutes ? (
                            event.reminderMinutes >= 1440 
                              ? `${event.reminderMinutes / 1440}d Reminder`
                              : event.reminderMinutes >= 60 
                                ? `${event.reminderMinutes / 60}h Reminder`
                                : `${event.reminderMinutes}m Reminder`
                          ) : '1h Reminder'} Active
                        </span>
                      )}
                      {event.notifiedOneHour && (
                        <span style={{ 
                          fontSize: '0.7rem', background: 'rgba(40,167,69,0.1)', 
                          color: 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: '4px'
                        }}>
                          Reminder Sent
                        </span>
                      )}
                    </div>
                    
                    {event.notes && (
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                        {event.notes}
                      </p>
                    )}

                    {event.details && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        {event.details}
                      </div>
                    )}

                    {/* Status Quick-Switch */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem' }}>
                      {(['On-going', 'Completed', 'Cancelled'] as TaskStatus[]).map(s => (
                        s !== event.status && (
                          <button
                            key={s}
                            onClick={() => updateStatus(event, s)}
                            style={{ 
                              fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '6px', 
                              background: 'none', border: `1px solid ${getStatusColor(s)}`, 
                              color: getStatusColor(s), cursor: 'pointer'
                            }}
                          >
                            Mark {s}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(event.id)}
                    style={{ background: 'none', border: 'none', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {viewMode === 'forms' && (
          forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
              <FileText size={64} style={{ marginBottom: '1rem' }} />
              <p>No routing forms found</p>
            </div>
          ) : (
            forms.map(form => (
              <div 
                key={form.id} 
                className="card" 
                style={{ 
                  padding: '1rem', borderLeft: `6px solid ${form.status === 'Implemented' ? 'var(--success)' : form.status === 'Approved' ? 'var(--primary)' : '#666'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <FileText size={18} color="var(--primary)" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{form.projectName}</h3>
                      <span style={{ fontSize: '0.75rem', background: 'var(--surface)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{form.id.length > 20 ? form.id.slice(0, 8).toUpperCase() : form.id}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{form.location} {form.trade && `• ${form.trade}`} • {form.date}</p>
                    
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Issues / Concerns</p>
                      <p style={{ fontSize: '0.9rem' }}>{form.issues}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>To: <strong>{form.addressedTo}</strong></span>
                      <span style={{ color: form.status === 'Implemented' ? 'var(--success)' : form.status === 'Approved' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                        • {form.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleExportPDF(form)}
                      style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '0.5rem', color: 'white', cursor: 'pointer' }}
                      title="Export PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={async () => { if(window.confirm('Delete this form?')) { await deleteForm(form.id); loadForms(); } }}
                      style={{ background: 'none', border: 'none', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {isSelectingImages && (
        <div 
          className="no-scale"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
        >
          <div style={{ 
            width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', position: 'relative', 
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', padding: '1.25rem', border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--surface)', padding: '0.5rem 0', zIndex: 10 }}>
              <h3 style={{ margin: 0 }}>Select Gallery Photos</h3>
              <button type="button" onClick={() => setIsSelectingImages(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {records.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No gallery images available.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {records.map(record => {
                  const isSelected = routingFormData.imageIds.includes(record.id);
                  return (
                    <div 
                      key={record.id} 
                      onClick={() => toggleImageSelection(record.id)}
                      style={{ 
                        position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', 
                        cursor: 'pointer', border: isSelected ? '4px solid var(--primary)' : '1px solid var(--border)',
                        opacity: isSelected ? 1 : 0.7,
                        userSelect: 'none', WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <img src={record.imageData} alt={record.metadata.projectName} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', position: 'sticky', bottom: 0, background: 'var(--surface)', padding: '1rem 0' }}>
              <button 
                type="button" 
                onClick={() => setIsSelectingImages(false)} 
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--primary)', 
                  color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
                }}
              >
                Done Selection ({routingFormData.imageIds.length}/4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
