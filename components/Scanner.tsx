
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Zap } from 'lucide-react';

interface ScannerProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onCapture, isProcessing }) => {
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      alert("ক্যামেরা পারমিশন প্রয়োজন।");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {showCamera ? (
        <div className="relative overflow-hidden rounded-[40px] bg-black aspect-[3/4] shadow-2xl border-4 border-white">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-[scan_2s_infinite]"></div>
          
          <style>{`
            @keyframes scan {
              0% { top: 10%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 90%; opacity: 0; }
            }
          `}</style>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/20 rounded-3xl"></div>
          </div>
          
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="px-4 py-2 glass rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Vision Engine v4</span>
            </div>
            <button onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center">
            <button onClick={captureFrame} className="w-20 h-20 bg-white rounded-full p-1 shadow-2xl active:scale-90 transition-transform">
              <div className="w-full h-full border-4 border-indigo-600 rounded-full bg-white flex items-center justify-center">
                 <div className="w-12 h-12 bg-indigo-600 rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          <button disabled={isProcessing} onClick={startCamera} className="group flex flex-col items-center justify-center p-8 bg-indigo-600 text-white rounded-[32px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <div className="p-4 bg-white/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8" /></div>
            <span className="font-bold text-sm">ক্যামেরা স্ক্যান</span>
          </button>
          <label className={`group flex flex-col items-center justify-center p-8 bg-white text-indigo-600 border border-indigo-50 rounded-[32px] shadow-sm hover:border-indigo-300 cursor-pointer transition-all active:scale-95 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="p-4 bg-indigo-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8" /></div>
            <span className="font-bold text-sm">গ্যালারি</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
