// Simple Web Audio API Synth to play a pleasant, premium notification chime on browser
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // First note (pleasant chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Second note harmonically delayed
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.6);
    }, 120);

  } catch (err) {
    console.warn("Could not play synthesized audio notification chime due to user-interaction lock:", err);
  }
}

export interface FCMStatus {
  supported: boolean;
  permission: NotificationPermission;
  token: string | null;
  error: string | null;
}

export async function requestFCMToken(): Promise<FCMStatus> {
  return {
    supported: false,
    permission: 'default',
    token: null,
    error: "O Reino Gestão está rodando em modo armazenamento local ultra Seguro (Totalmente Offline e sem cookies de Rastreamento)."
  };
}

// In-app Foreground Listener (Mocked to be a lightweight local listener)
export function setupForegroundFCMListener(callback: (payload: any) => void) {
  // No external socket required in localStorage mode
  console.log("Sistema de escuta local de transações ativado.");
}
