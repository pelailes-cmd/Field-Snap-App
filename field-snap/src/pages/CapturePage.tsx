import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export const CapturePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Primary back camera
          width: { ideal: 4096 }, // Request 4K
          height: { ideal: 2160 },
          frameRate: { ideal: 30 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("High-quality camera access denied or unavailable. Trying standard quality...");
      
      // Fallback to standard quality
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(fallbackStream);
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
      } catch (e) {
        alert("Could not access camera.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capture = () => {
    if (videoRef.current && isReady) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Use the video's actual internal resolution for the canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High-quality rendering settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Export at high quality JPEG (0.95 quality)
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        
        stopStream();
        navigate('/edit', { state: { imageData } });
      }
    }
  };
  
  const handleBack = () => {
    stopStream();
    navigate('/');
  };

  return (
    <div style={{ position: 'relative', height: '100vh', backgroundColor: 'black', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <button 
          onClick={handleBack}
          style={{ 
            background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
            padding: '0.75rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <button 
          onClick={startCamera}
          style={{ 
            background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
            padding: '0.75rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)'
          }}
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Capture Area */}
      <div style={{ 
        position: 'absolute', bottom: '3rem', left: 0, right: 0, 
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
      }}>
        <p style={{ color: 'white', fontSize: '0.8rem', opacity: 0.7, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {isReady ? `HD Ready: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}` : 'Initializing HD Camera...'}
        </p>
        
        <button 
          onClick={capture}
          disabled={!isReady}
          style={{ 
            width: '84px', height: '84px', borderRadius: '50%', 
            border: '4px solid white', backgroundColor: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', opacity: isReady ? 1 : 0.5,
            transition: 'transform 0.1s active'
          }}
        >
          <div style={{ 
            width: '68px', height: '68px', borderRadius: '50%', 
            backgroundColor: 'white', boxShadow: '0 0 15px rgba(255,255,255,0.3)'
          }}></div>
        </button>
      </div>
    </div>
  );
};
