import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStorage, type TaskPersonnel, type PersonnelTask, type FieldRecord } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Trash2, CheckCircle2, Circle, Plus, X, ListTodo, MapPin, MessageSquare, Calendar, Image as ImageIcon, Share2 } from 'lucide-react';
import { generateId } from '../utils/id';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PersonnelTasksPage: React.FC = () => {
  const { personnelId } = useParams<{ personnelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPersonnel, getPersonnelTasks, savePersonnelTask, deletePersonnelTask, getRecords } = useStorage();
  
  const [personnel, setPersonnel] = useState<TaskPersonnel | null>(null);
  const [tasks, setTasks] = useState<PersonnelTask[]>([]);
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    taskName: '',
    location: '',
    remarks: '',
    deadline: '',
    imageIds: [] as string[],
    status: 'Pending' as 'Pending' | 'Done'
  });

  useEffect(() => {
    if (personnelId) {
      loadData();
    }
  }, [personnelId]);

  const loadData = async () => {
    if (!personnelId) return;
    const allPersonnel = await getPersonnel();
    const current = allPersonnel.find(p => p.id === personnelId);
    setPersonnel(current || null);

    const taskData = await getPersonnelTasks(personnelId);
    setTasks(taskData);

    const allRecords = await getRecords();
    setRecords(allRecords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelId || !formData.taskName) return;

    await savePersonnelTask({
      id: generateId(),
      personnelId,
      taskName: formData.taskName,
      location: formData.location,
      remarks: formData.remarks,
      deadline: formData.deadline,
      imageIds: formData.imageIds,
      status: formData.status,
      timestamp: Date.now()
    });

    setFormData({ taskName: '', location: '', remarks: '', deadline: '', imageIds: [], status: 'Pending' });
    setShowAddForm(false);
    loadData();
  };

  const toggleStatus = async (task: PersonnelTask) => {
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
    await savePersonnelTask({ ...task, status: newStatus });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      await deletePersonnelTask(id);
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

  const handleSharePDF = async (task: PersonnelTask) => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 123, 255);
    doc.text('TASK ASSIGNMENT', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Personnel: ${personnel?.name || 'N/A'}`, margin, 30);
    doc.text(`Position: ${personnel?.position || 'N/A'}`, margin, 35);
    doc.text(`Company: ${user?.profile?.company || 'N/A'}`, margin, 40);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, margin, 45);

    // Table info - Minimized height
    autoTable(doc, {
      startY: 50,
      margin: { left: margin, right: margin },
      body: [
        [{ content: 'Task Description', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, task.taskName],
        [{ content: 'Location', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, task.location || '-'],
        [{ content: 'Deadline', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, task.deadline || '-'],
        [{ content: 'Status', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, task.status],
        [{ content: 'Remarks / Instructions', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, task.remarks || '-'],
      ],
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 9 } // Reduced padding and font size
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Photos - Maximized size
    if (task.imageIds && task.imageIds.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Attached References:', margin, currentY);
      currentY += 6;

      const imgRecords = records.filter(r => task.imageIds?.includes(r.id)).slice(0, 4);
      const gridGutter = 4;
      const availableWidth = pageWidth - (margin * 2);
      const footerSpace = 15;
      const availableHeight = doc.internal.pageSize.getHeight() - currentY - footerSpace;
      
      const numRows = imgRecords.length > 2 ? 2 : 1;
      const maxImgWidth = (availableWidth - gridGutter) / 2;
      const maxImgHeight = (availableHeight - (numRows > 1 ? gridGutter : 0)) / numRows;

      imgRecords.forEach((record, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (maxImgWidth + gridGutter);
        const y = currentY + row * (maxImgHeight + gridGutter);
        
        try {
          const props = doc.getImageProperties(record.imageData);
          const ratio = props.width / props.height;
          
          let drawWidth = maxImgWidth;
          let drawHeight = maxImgWidth / ratio;
          
          if (drawHeight > maxImgHeight) {
            drawHeight = maxImgHeight;
            drawWidth = drawHeight * ratio;
          }

          const offsetX = (maxImgWidth - drawWidth) / 2;
          const offsetY = (maxImgHeight - drawHeight) / 2;

          doc.addImage(record.imageData, 'JPEG', x + offsetX, y + offsetY, drawWidth, drawHeight, undefined, 'FAST');
        } catch (e) { console.error("PDF Image Error:", e); }
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated via FieldSnap Systems', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `Task_${task.taskName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Task Assignment: ${task.taskName}`,
          text: `Assignment for ${personnel?.name}`
        });
      } catch (err) {
        console.error("Error sharing PDF:", err);
      }
    } else {
      doc.save(`Task_${task.taskName}.pdf`);
      alert("Sharing not supported. PDF downloaded instead.");
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Personnel Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {personnel ? `Tasks for: ${personnel.name}` : 'Manage tasks'}
          </p>
        </div>
      </header>

      {!showAddForm ? (
        <>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}
          >
            <Plus size={20} /> Assign New Task
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px' }}>
                <ListTodo size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No tasks assigned yet.</p>
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="card" style={{ padding: '1rem', borderLeft: `6px solid ${t.status === 'Done' ? 'var(--success)' : '#666'}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <button 
                      onClick={() => toggleStatus(t)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.2rem' }}
                    >
                      {t.status === 'Done' ? <CheckCircle2 color="var(--success)" /> : <Circle color="var(--text-secondary)" />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', textDecoration: t.status === 'Done' ? 'line-through' : 'none', opacity: t.status === 'Done' ? 0.6 : 1 }}>
                          {t.taskName}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleSharePDF(t)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.2rem' }}
                            title="Share as PDF"
                          >
                            <Share2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={14} /> {t.location}
                          </span>
                        )}
                        {t.deadline && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: t.status !== 'Done' && new Date(t.deadline) < new Date() ? 'var(--danger)' : 'inherit' }}>
                            <Calendar size={14} /> {t.deadline}
                          </span>
                        )}
                      </div>

                      {t.imageIds && t.imageIds.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                          {t.imageIds.map(imgId => {
                            const record = records.find(r => r.id === imgId);
                            return record ? (
                              <div key={imgId} style={{ aspectRatio: '1/1', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <img src={record.imageData} alt="Task" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}

                      {t.remarks && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--background)', borderRadius: '8px', fontSize: '0.85rem', border: '1px dashed var(--border)' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: 'var(--primary)' }}>Remarks / Recommendations</p>
                          {t.remarks}
                        </div>
                      )}
                      
                      <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold', color: t.status === 'Done' ? 'var(--success)' : 'var(--text-secondary)' }}>
                        Status: {t.status}
                      </p>
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
            <h3 style={{ fontSize: '1.25rem' }}>Assign Task</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Task Name / Description" 
              icon={<ListTodo size={18} />}
              value={formData.taskName} 
              onChange={e => setFormData({...formData, taskName: e.target.value})} 
              placeholder="e.g. Electrical Rough-in"
              required
            />

            <Input 
              label="Location" 
              icon={<MapPin size={18} />}
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
              placeholder="e.g. Unit 402, 4th Floor"
            />

            <div className="input-group">
              <label className="input-label">Deadline</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Attached Photos ({formData.imageIds.length}/4)
                <button 
                  type="button" 
                  onClick={() => setIsSelectingImages(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={14} /> Select from Gallery
                </button>
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                {formData.imageIds.map(id => {
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
                {formData.imageIds.length === 0 && (
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

            <div className="input-group">
              <label className="input-label">Remarks / Recommendations</label>
              <textarea 
                className="input-field" 
                style={{ minHeight: '100px', resize: 'none', fontFamily: 'inherit' }}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                placeholder="Enter instructions or recommendations..."
              ></textarea>
            </div>
            
            <div className="input-group">
              <label className="input-label">Initial Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['Pending', 'Done'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({...formData, status: s})}
                    style={{ 
                      flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)',
                      background: formData.status === s ? 'var(--primary)' : 'var(--surface)',
                      color: formData.status === s ? 'white' : 'var(--text)',
                      fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Task</button>
            </div>
          </div>
        </form>
      )}

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
                  const isSelected = formData.imageIds.includes(record.id);
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
                Done Selection ({formData.imageIds.length}/4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
