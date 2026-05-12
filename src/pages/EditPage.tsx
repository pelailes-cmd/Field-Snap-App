import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateId } from '../utils/id';
import { useStorage } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Save, LayoutGrid, CheckSquare, Square } from 'lucide-react';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const EditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveRecord } = useStorage();
  const { user } = useAuth();
  
  const state = location.state as { imageData: string } | null;
  const imageData = state?.imageData;

  const [metadata, setMetadata] = useState({
    projectName: '',
    location: '',
    trade: '',
    details: '',
    engineer: '',
    inspectedBy: '',
    remarks: ''
  });
  
  const [captionPosition, setCaptionPosition] = useState<Position>('bottom-left');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageData) navigate('/');
  }, [imageData, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const drawWatermark = async (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageData!;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageData!);

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(16, Math.floor(img.width / 55)); 
        const lineHeight = fontSize * 1.4;
        const padding = fontSize;
        
        const lines = [
          `Project: ${metadata.projectName}`,
          metadata.location ? `Location: ${metadata.location}` : '',
          `Date: ${new Date().toLocaleString()}`,
          metadata.trade ? `Trade: ${metadata.trade}` : '',
          metadata.details ? `Details: ${metadata.details}` : '',
          metadata.engineer ? `Engineer: ${metadata.engineer}` : '',
          metadata.inspectedBy ? `Inspected By: ${metadata.inspectedBy}` : '',
          metadata.remarks ? `Remarks: ${metadata.remarks}` : ''
        ].filter(line => line !== '');

        ctx.font = `bold ${fontSize}px sans-serif`;
        let maxTextWidth = 0;
        lines.forEach(line => {
          const width = ctx.measureText(line).width;
          if (width > maxTextWidth) maxTextWidth = width;
        });

        // Logo handling
        let logoImg: HTMLImageElement | null = null;
        let logoWidth = 0;
        const logoHeight = lines.length * lineHeight; // Match height of text block

        if (includeLogo && user?.profile?.companyLogo) {
          logoImg = await new Promise<HTMLImageElement | null>((resolveLogo) => {
            const lImg = new Image();
            lImg.src = user.profile!.companyLogo!;
            lImg.onload = () => resolveLogo(lImg);
            lImg.onerror = () => resolveLogo(null);
          });
          
          if (logoImg) {
            // Keep aspect ratio with height fixed to caption height
            const aspect = logoImg.width / logoImg.height;
            logoWidth = logoHeight * aspect;
          }
        }

        const boxWidth = maxTextWidth + (padding * 2) + (logoWidth > 0 ? logoWidth + padding : 0);
        const boxHeight = logoHeight + (padding * 2);

        let x = 0; let y = 0;
        switch (captionPosition) {
          case 'top-left': x = 0; y = 0; break;
          case 'top-right': x = img.width - boxWidth; y = 0; break;
          case 'bottom-left': x = 0; y = img.height - boxHeight; break;
          case 'bottom-right': x = img.width - boxWidth; y = img.height - boxHeight; break;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Draw Logo if available
        if (logoImg && logoWidth > 0) {
          ctx.drawImage(logoImg, x + padding, y + padding, logoWidth, logoHeight);
        }

        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        const textX = x + padding + (logoWidth > 0 ? logoWidth + padding : 0);
        lines.forEach((line, index) => {
          ctx.fillText(line, textX, y + padding + (index * lineHeight));
        });

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(imageData!);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageData) return;

    // Only Project Name is required now
    if (!metadata.projectName.trim()) {
      alert("Project Name is required.");
      return;
    }

    setLoading(true);
    try {
      const watermarkedImage = await drawWatermark();
      await saveRecord({
        id: generateId(),
        imageData: watermarkedImage,
        timestamp: Date.now(),
        metadata
      });
      setLoading(false);
      alert('Documentation saved successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const PositionButton = ({ pos, label }: { pos: Position, label: string }) => (
    <button
      type="button"
      onClick={() => setCaptionPosition(pos)}
      style={{
        flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px',
        border: '1px solid var(--border)',
        background: captionPosition === pos ? 'var(--primary)' : 'var(--surface)',
        color: captionPosition === pos ? 'white' : 'var(--text)',
        cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  if (!imageData) return null;

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
          <ArrowLeft size={24} color="var(--text)" />
        </button>
        <h1 style={{ fontSize: '1.5rem' }}>Documentation</h1>
      </header>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem', border: 'none' }}>
          <div style={{ position: 'relative' }}>
            <img src={imageData} alt="Capture" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#000', display: 'block' }} />
            <div style={{ 
              position: 'absolute', bottom: '10px', left: '10px', 
              backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', 
              borderRadius: '4px', fontSize: '10px' 
            }}>
              Preview Position: {captionPosition.replace('-', ' ')}
            </div>
          </div>
        </div>

        <div className="card">
          <div 
            onClick={() => setIncludeLogo(!includeLogo)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', 
              cursor: 'pointer', padding: '0.75rem', borderRadius: '12px', background: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
          >
            {includeLogo ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="var(--text-secondary)" />}
            <div>
              <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Include Company Logo</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.profile?.companyLogo ? 'Your logo will be added to the caption' : 'No logo found. Add one in Profile tab'}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutGrid size={16} /> Caption Position
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <PositionButton pos="top-left" label="Top Left" />
              <PositionButton pos="top-right" label="Top Right" />
              <PositionButton pos="bottom-left" label="Bottom Left" />
              <PositionButton pos="bottom-right" label="Bottom Right" />
            </div>
          </div>

          <Input name="projectName" label="Project Name (Required)" value={metadata.projectName} onChange={handleChange} placeholder="e.g. Skyline Tower" required />
          <Input name="location" label="Location" value={metadata.location} onChange={handleChange} placeholder="e.g. Level 5, Zone A" />
          <Input name="trade" label="Trade" value={metadata.trade} onChange={handleChange} placeholder="e.g. Electrical" />
          <Input name="details" label="Details" value={metadata.details} onChange={handleChange} placeholder="e.g. Conduit Installation" />
          <Input name="engineer" label="Engineer In-Charge" value={metadata.engineer} onChange={handleChange} />
          <Input name="inspectedBy" label="Inspected By" value={metadata.inspectedBy} onChange={handleChange} />
          <Input name="remarks" label="Remarks" value={metadata.remarks} onChange={handleChange} placeholder="e.g. Work in progress" />
          
          <Button type="submit" disabled={loading} style={{ marginTop: '1rem', height: '56px', borderRadius: '16px' }}>
            {loading ? 'Processing...' : 'Save & Documentation'} <Save size={18} style={{ marginLeft: '0.5rem' }} />
          </Button>
        </div>
      </form>
    </div>
  );
};
