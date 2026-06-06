import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, Volume2, X, AlertCircle, Scan, Image, Sparkles } from 'lucide-react';

interface BarcodeCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeCameraScanner: React.FC<BarcodeCameraScannerProps> = ({ onScanSuccess, onClose }) => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [scanMode, setScanMode] = useState<'camera' | 'file' | 'simulator'>('camera');
  
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play a beautiful, premium robotic cash register "beep" sound using the Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime); // High pitch
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio feedback blocked by browser settings', e);
    }
  };

  useEffect(() => {
    // 1. Query for cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if available
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
          setActiveCameraId(backCam ? backCam.id : devices[0].id);
          setHasCamera(true);
        } else {
          setHasCamera(false);
          setScanMode('simulator');
        }
      })
      .catch((err) => {
        console.error('Erro de câmera:', err);
        setHasCamera(false);
        setScanMode('simulator');
      });

    return () => {
      stopScanning();
    };
  }, []);

  // Fire up the scanning service on active camera change
  useEffect(() => {
    if (scanMode === 'camera' && activeCameraId && hasCamera) {
      startScanning(activeCameraId);
    } else {
      stopScanning();
    }
  }, [activeCameraId, scanMode, hasCamera]);

  const startScanning = async (cameraId: string) => {
    try {
      setError(null);
      
      // Stop outstanding scanner if exists
      if (qrCodeRef.current && isScanning) {
        await stopScanning();
      }

      const html5QrCode = new Html5Qrcode("scanner-viewport");
      qrCodeRef.current = html5QrCode;
      
      setIsScanning(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            return {
              width: Math.round(minSize * 0.75),
              height: Math.round(minSize * 0.45) // Barcodes are wide and short
            };
          }
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent failure on single frames is expected
        }
      );
    } catch (err: any) {
      console.error(err);
      setError("Permissão da Câmera recusada ou ocupada. Escolha o método File ou Simulador.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (qrCodeRef.current && isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.warn("Retorno ao parar scanner:", err);
      }
      qrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  const handleSuccess = (code: string) => {
    playBeep();
    onScanSuccess(code);
  };

  // Static barcode image parsing from local files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const html5QrCode = new Html5Qrcode("scanner-viewport-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccess(decodedText);
    } catch (err) {
      setError("Não encontramos nenhum código de barras legível nesta imagem. Tente outra foto.");
    }
  };

  // Flip between front/back camera
  const rotateCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

  // Static lists of classic commercial barcodes for simulation
  const mockBarcodes = [
    { label: 'O Boticário Floratta Red', code: '7891033221223' },
    { label: 'Natura Perfume Homem', code: '7891054329001' },
    { label: 'Camiseta Básica de Algodão', code: '7894561230987' },
    { label: 'Cinto de Couro Democrata', code: '7897891040502' },
    { label: 'Tênis Running Adidas 42', code: '4054067329108' },
    { label: 'Relógio Lince Quartz Gold', code: '7891530291993' }
  ];

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
      <div className="bg-zinc-950 border border-purple-500/15 w-full max-w-md rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Glow and header */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-500" />
        
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Leitor de Código de Barras</h3>
            <p className="text-[10px] text-zinc-500">Aponte a câmera ou use o arquivo/simulador</p>
          </div>
          <button
            onClick={() => {
              stopScanning().then(onClose);
            }}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 flex items-center justify-center text-zinc-400 border border-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-zinc-900 bg-zinc-900/10 shrink-0">
          <button
            onClick={() => {
              setScanMode('camera');
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              scanMode === 'camera'
                ? 'text-purple-400 bg-purple-600/5 border-b-2 border-purple-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Câmera
          </button>
          <button
            onClick={() => {
              setScanMode('file');
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              scanMode === 'file'
                ? 'text-purple-400 bg-purple-600/5 border-b-2 border-purple-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            Arquivo
          </button>
          <button
            onClick={() => {
              setScanMode('simulator');
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              scanMode === 'simulator'
                ? 'text-purple-400 bg-purple-600/5 border-b-2 border-purple-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulador
          </button>
        </div>

        {/* Action Window Content */}
        <div className="p-6 flex-1 flex flex-col justify-center items-center overflow-y-auto">
          
          {error && (
            <div className="w-full p-4 bg-red-950/15 border border-red-500/20 rounded-2xl mb-4 flex gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden scanner element required for static file reading */}
          <div id="scanner-viewport-hidden" className="hidden" />

          {/* 1. Camera Viewport */}
          {scanMode === 'camera' && (
            <div className="relative w-full aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
              {hasCamera === false ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-500 mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Nenhuma câmera encontrada no seu dispositivo, ou o acesso foi bloqueado pelo navegador. Por favor utilize as abas <strong>Arquivo</strong> ou <strong>Simulador</strong>.
                  </p>
                </div>
              ) : (
                <>
                  {/* The interactive qr-code stream render point */}
                  <div id="scanner-viewport" className="w-full h-full [&>video]:object-cover" />

                  {/* Aesthetic HUD scan alignment reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-10">
                    <div className="w-full aspect-[1.8/1] border-2 border-purple-400/40 rounded-xl relative shadow-[0_0_30px_rgba(0,0,0,0.85)] max-w-[80%]">
                      {/* Interactive scanning horizontal bar */}
                      <div className="absolute left-0 right-0 h-[1.5px] bg-red-400 shadow-[0_0_8px_red] animate-bounce" style={{ top: '35%' }} />
                      
                      {/* Reticle brackets corners */}
                      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl-[4px]" />
                      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr-[4px]" />
                      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl-[4px]" />
                      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br-[4px]" />
                    </div>
                  </div>

                  {/* Scanning active indicator overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 border border-purple-500/25 rounded-md text-[9px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5 z-10 animate-pulse">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    Buscando Código de Barras...
                  </div>

                  {cameras.length > 1 && (
                    <button
                      onClick={rotateCamera}
                      className="absolute top-3 right-3 w-8 h-8 bg-zinc-950/80 hover:bg-purple-600/30 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center transition-all z-20"
                      title="Rotacionar Câmera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* 2. File Upload Viewport */}
          {scanMode === 'file' && (
            <div className="w-full space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-zinc-900/25 border-2 border-dashed border-zinc-800 hover:border-purple-500/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all gap-2 group"
              >
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/25 rounded-xl flex items-center justify-center transition-all shadow-sm">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-200 font-semibold font-sans">Escolher Foto de Código</p>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Envie uma foto aproximada e nítida do código de barras</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-600 text-center leading-relaxed">
                Suporta padrões: EAN-13, EAN-8, CODE-128, QR Code.
              </p>
            </div>
          )}

          {/* 3. Simulator Viewport */}
          {scanMode === 'simulator' && (
            <div className="w-full space-y-5">
              <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-2xl">
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Use o simulador abaixo para emular a leitura instantânea de embalagens reais de marcas ou digite qualquer código para testar a flexibilidade do seu império.
                </p>
              </div>

              {/* Free Code Insertion */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 block">Digitar Código Livre</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 7891234567890"
                    value={simulatedCode}
                    onChange={(e) => setSimulatedCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono px-3.5 py-2.5 rounded-xl text-zinc-100 outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      if (simulatedCode) {
                        handleSuccess(simulatedCode);
                      }
                    }}
                    disabled={!simulatedCode}
                    className="px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    Simular
                  </button>
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 block">Presets Comerciais de Demonstração</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                  {mockBarcodes.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuccess(item.code)}
                      className="w-full py-2.5 px-3 bg-zinc-900/60 border border-zinc-900 hover:border-purple-500/25 rounded-xl hover:bg-purple-950/10 text-left transition-all flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div>
                        <span className="text-zinc-300 font-semibold font-sans">{item.label}</span>
                        <span className="block text-[9px] font-mono text-zinc-550 mt-0.5">EAN: {item.code}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        [ SCAN ]
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer tips */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-center text-center">
          <p className="text-[10px] font-sans text-zinc-600">
            Reino QR Scan • O sistema opera off-line para qualquer SKU personalizado
          </p>
        </div>

      </div>
    </div>
  );
};
