import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, RotateCcw } from 'lucide-react';

export const SketchPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to screen size
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = (window.innerHeight - 150) * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight - 150}px`;

    // Initialize white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scale for high DPI
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleNext = () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      navigate('/edit', { state: { imageData } });
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: '64px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#666' }}>
          <X size={28} />
        </button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>New Sketch</h2>
        <button 
          onClick={handleNext} 
          style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Next <ArrowRight size={18} />
        </button>
      </div>

      {/* Drawing Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            backgroundColor: 'white', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            touchAction: 'none',
            cursor: 'crosshair'
          }}
        />
      </div>

      {/* Toolbar */}
      <div style={{ height: '80px', backgroundColor: '#fff', borderTop: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <button onClick={clearCanvas} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#666' }}>
          <RotateCcw size={24} />
          <span style={{ fontSize: '0.7rem' }}>Clear</span>
        </button>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['#000000', '#ff0000', '#0000ff', '#00aa00'].map(c => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                backgroundColor: c, border: color === c ? '3px solid var(--primary)' : '2px solid #ddd'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
