import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, RefreshCw, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

interface ProductImageCaptureProps {
  currentValue?: string; // Existing Base64 value or empty
  onChange: (base64Value: string) => void;
  onClear: () => void;
}

export const ProductImageCapture: React.FC<ProductImageCaptureProps> = ({ currentValue, onChange, onClear }) => {
  const [activeTab, setActiveTabTab] = useState<'upload' | 'camera'>('upload');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress any image uploaded or captured to keep storage slim in local DB
  const compressAndSave = (base64Str: string) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 280; // Optimized thumbnail size
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#09090b'; // Premium matching background
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65); // JPEG at 65% quality
        onChange(compressedBase64);
      }
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada. Por favor envie uma menor que 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        compressAndSave(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Camera integration routines
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, activeCameraId]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      // Clean previous stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Enumerating cameras to alternate front/back if possible
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      const constraints: MediaStreamConstraints = {
        video: activeCameraId 
          ? { deviceId: { exact: activeCameraId } }
          : { facingMode: 'environment' } // Prefer back camera on mobile
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error(err);
      setCameraError("Não foi possível acessar a câmera do dispositivo. Verifique as permissões de privacidade.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame on canvas
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror effect for webcams
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Reset scale transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const snapshotBase64 = canvas.toDataURL('image/jpeg');
        compressAndSave(snapshotBase64);
        setActiveTabTab('upload'); // Switch to preview
      }
    } catch (e) {
      console.error("Erro ao capturar snapshot:", e);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.deviceId === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].deviceId);
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400">
          Foto / Identidade do Produto
        </label>
        
        {currentValue && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors uppercase font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir Foto
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
        {/* Left Aspect: Frame Preview Thumbnail */}
        <div className="col-span-2 aspect-square bg-[#07070a] border border-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center relative group">
          {currentValue ? (
            <>
              <img 
                src={currentValue} 
                alt="Upload Preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                <span className="text-[9px] font-semibold text-white uppercase tracking-wider bg-purple-650 px-2 py-1 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-white" /> Cadastrado
                </span>
              </div>
            </>
          ) : (
            <div className="text-center p-3">
              <ImageIcon className="w-6 h-6 text-zinc-700 mx-auto stroke-[1.5]" />
              <span className="block text-[8px] font-mono uppercase tracking-widest text-zinc-600 mt-2">Sem Imagem</span>
            </div>
          )}
        </div>

        {/* Right Aspect: File Actions / Camera Stream Integration */}
        <div className="col-span-3 min-h-[110px] flex flex-col bg-zinc-900/35 border border-zinc-900 rounded-2xl overflow-hidden">
          
          {/* Internal media subtabs */}
          <div className="flex border-b border-zinc-900/80 bg-zinc-950/20 text-[9px] font-mono uppercase font-bold">
            <button
              type="button"
              onClick={() => setActiveTabTab('upload')}
              className={`flex-1 py-1.5 text-center transition-all ${
                activeTab === 'upload' ? 'text-purple-400 bg-zinc-900/60' : 'text-zinc-500'
              }`}
            >
              Upar Arquivo
            </button>
            <button
              type="button"
              onClick={() => setActiveTabTab('camera')}
              className={`flex-1 py-1.5 text-center transition-all ${
                activeTab === 'camera' ? 'text-purple-400 bg-zinc-900/60' : 'text-zinc-500'
              }`}
            >
              Tirar Foto
            </button>
          </div>

          <div className="flex-1 p-3 flex flex-col justify-center relative">
            {activeTab === 'upload' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800 hover:border-purple-500/20 rounded-xl py-4 text-center cursor-pointer transition-all hover:bg-zinc-950/20"
              >
                <Upload className="w-4 h-4 text-zinc-500 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-zinc-300 block">Carregar imagem</span>
                <span className="text-[9px] text-zinc-500 block">De seu computador ou celular</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            ) : (
              // Live camera snapshot action
              <div className="relative w-full h-[95px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-850 flex items-center justify-center">
                {cameraError ? (
                  <p className="text-[9px] text-red-400 p-2 text-center leading-normal">{cameraError}</p>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]" // mirrored
                    />
                    
                    {/* Capture overlay circle button */}
                    <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 flex items-center justify-center shadow-lg transition-all"
                        title="Tirar snapshot"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      
                      {cameras.length > 1 && (
                        <button
                          type="button"
                          onClick={switchCamera}
                          className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400 hover:text-white flex items-center justify-center transition-all"
                          title="Alternar Câmera"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
