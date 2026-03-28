import React, { useRef, useState, useEffect } from 'react';
import { X, Type, Pencil, RotateCcw, Move, Plus, Minus } from 'lucide-react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface ImageEditorProps {
  imageData: string;
  onSave: (newImageData: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageData, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  const [tool, setTool] = useState<'pencil' | 'text' | 'move'>('pencil');
  const [color, setColor] = useState('#ff0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Initialize canvases at FULL resolution
  useEffect(() => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      setBaseImage(img);
      
      const w = img.width;
      const h = img.height;

      // Setup canvases at NATIVE resolution
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      drawingCanvasRef.current.width = w;
      drawingCanvasRef.current.height = h;
      
      renderAll();
    };
  }, [imageData]);

  const renderAll = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);
    ctx.drawImage(drawingCanvasRef.current, 0, 0);

    textElements.forEach(el => {
      ctx.font = `bold ${el.fontSize}px sans-serif`;
      ctx.fillStyle = el.color;
      ctx.textBaseline = 'top';
      
      if (el.id === selectedTextId) {
        const metrics = ctx.measureText(el.text);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = Math.max(4, el.fontSize / 8);
        ctx.setLineDash([el.fontSize / 3, el.fontSize / 3]);
        ctx.strokeRect(el.x - 10, el.y - 10, metrics.width + 20, el.fontSize + 20);
        ctx.setLineDash([]);
      }
      
      ctx.fillText(el.text, el.x, el.y);
    });
  };

  useEffect(() => {
    renderAll();
  }, [textElements, selectedTextId, baseImage]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startAction = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    
    if (tool === 'pencil') {
      setIsDrawing(true);
      const drawCtx = drawingCanvasRef.current.getContext('2d');
      if (drawCtx) {
        drawCtx.beginPath();
        drawCtx.moveTo(pos.x, pos.y);
        drawCtx.strokeStyle = color;
        drawCtx.lineWidth = Math.max(6, drawingCanvasRef.current.width / 200);
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
      }
    } else if (tool === 'text') {
      const text = prompt("Enter text:");
      if (text) {
        const defaultFontSize = Math.floor(drawingCanvasRef.current.height / 20);
        const newEl: TextElement = {
          id: crypto.randomUUID(),
          text, x: pos.x, y: pos.y, fontSize: defaultFontSize, color
        };
        setTextElements([...textElements, newEl]);
        setSelectedTextId(newEl.id);
        setTool('move');
      }
    } else if (tool === 'move') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        let found = false;
        for (let i = textElements.length - 1; i >= 0; i--) {
          const el = textElements[i];
          ctx.font = `bold ${el.fontSize}px sans-serif`;
          const metrics = ctx.measureText(el.text);
          if (pos.x >= el.x && pos.x <= el.x + metrics.width &&
              pos.y >= el.y && pos.y <= el.y + el.fontSize) {
            setSelectedTextId(el.id);
            setIsDrawing(true);
            found = true;
            break;
          }
        }
        if (!found) setSelectedTextId(null);
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    
    if (tool === 'pencil') {
      const drawCtx = drawingCanvasRef.current.getContext('2d');
      if (drawCtx) {
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
        renderAll();
      }
    } else if (tool === 'move' && selectedTextId) {
      setTextElements(prev => prev.map(t => 
        t.id === selectedTextId ? { ...t, x: pos.x, y: pos.y } : t
      ));
    }
  };

  const endAction = () => {
    setIsDrawing(false);
  };

  const resetAll = () => {
    const drawCtx = drawingCanvasRef.current.getContext('2d');
    if (drawCtx) drawCtx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    setTextElements([]);
    setSelectedTextId(null);
    renderAll();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000', zIndex: 2000,
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Header */}
      <div style={{ 
        height: '64px', width: '100%', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', padding: '0 1rem', backgroundColor: '#111', borderBottom: '1px solid #222' 
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'white', padding: '0.5rem' }}><X size={28} /></button>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={resetAll} style={{ background: 'none', border: 'none', color: 'white', padding: '0.5rem' }}><RotateCcw size={22} /></button>
          <button 
            onClick={() => onSave(canvasRef.current!.toDataURL('image/jpeg', 0.98))} 
            style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Save HD
          </button>
        </div>
      </div>

      {/* Main Viewport - This fixes the cropping */}
      <div style={{ 
        flex: 1, position: 'relative', overflow: 'hidden', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem' 
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startAction}
          onMouseMove={handleMove}
          onMouseUp={endAction}
          onTouchStart={startAction}
          onTouchMove={handleMove}
          onTouchEnd={endAction}
          style={{ 
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            touchAction: 'none'
          }}
        />
      </div>

      {/* Bottom Toolbar */}
      <div style={{ 
        width: '100%', backgroundColor: '#111', borderTop: '1px solid #222',
        padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom))'
      }}>
        {/* Size Controls Row (Only shown when text selected) */}
        {selectedTextId && tool === 'move' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', backgroundColor: '#222', padding: '0.6rem', borderRadius: '12px', marginBottom: '1rem' }}>
            <button onClick={() => setTextElements(prev => prev.map(el => el.id === selectedTextId ? { ...el, fontSize: Math.max(10, el.fontSize - 10) } : el))} style={{ background: '#444', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px' }}><Minus size={18} /></button>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>Text Size</span>
            <button onClick={() => setTextElements(prev => prev.map(el => el.id === selectedTextId ? { ...el, fontSize: el.fontSize + 10 } : el))} style={{ background: '#444', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px' }}><Plus size={18} /></button>
          </div>
        )}

        {/* Tools Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <button onClick={() => setTool('pencil')} style={{ flex: 1, maxWidth: '80px', padding: '0.75rem', borderRadius: '12px', border: 'none', background: tool === 'pencil' ? 'var(--primary)' : '#222', color: 'white' }}>
            <Pencil size={24} style={{ margin: '0 auto' }} />
          </button>
          <button onClick={() => setTool('text')} style={{ flex: 1, maxWidth: '80px', padding: '0.75rem', borderRadius: '12px', border: 'none', background: tool === 'text' ? 'var(--primary)' : '#222', color: 'white' }}>
            <Type size={24} style={{ margin: '0 auto' }} />
          </button>
          <button onClick={() => setTool('move')} style={{ flex: 1, maxWidth: '80px', padding: '0.75rem', borderRadius: '12px', border: 'none', background: tool === 'move' ? 'var(--primary)' : '#222', color: 'white' }}>
            <Move size={24} style={{ margin: '0 auto' }} />
          </button>
        </div>

        {/* Colors Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
          {['#ff0000', '#ffff00', '#00ff00', '#ffffff', '#000000'].map(c => (
            <button 
              key={c}
              onClick={() => {
                setColor(c);
                if (selectedTextId) setTextElements(prev => prev.map(el => el.id === selectedTextId ? { ...el, color: c } : el));
              }}
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: color === c ? '3px solid white' : '2px solid transparent', backgroundColor: c, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
