import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Simple Web Audio API Synth to play a pleasant, premium notification chime
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

// Default standard public VAPID key for Firebase Cloud Messaging
// Users can configure their own in the console if they want to load production scopes
const DEFAULT_VAPID_KEY = "BDC_gLgL52_vL2uB77H5H_D388J20KLaB0S-E8M5H8c2m09D2L_E8M5H8c2A09D2L_vL2u_B77H5H_D3";

export async function requestFCMToken(): Promise<FCMStatus> {
  const result: FCMStatus = {
    supported: false,
    permission: 'default',
    token: null,
    error: null
  };

  try {
    const isFCMSupported = await isSupported();
    result.supported = isFCMSupported;

    if (!isFCMSupported) {
      result.error = "FCM não é suportado por este navegador ou restrições de iframe.";
      return result;
    }

    // Check system permission
    let status = Notification.permission;
    if (status === 'default') {
      status = await Notification.requestPermission();
    }
    result.permission = status;

    if (status !== 'granted') {
      result.error = "Permissão para enviar notificações foi negada pelo usuário.";
      return result;
    }

    // Attempt to register Service Worker and fetch messaging token safely
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, { 
      vapidKey: DEFAULT_VAPID_KEY 
    });

    result.token = token;
    console.log("FCM Device Registration Token:", token);
    
  } catch (err: any) {
    console.warn("Error registering or fetching FCM credentials:", err);
    result.error = err?.message || String(err);
  }

  return result;
}

// In-app Foreground Listener
export function setupForegroundFCMListener(callback: (payload: any) => void) {
  isSupported().then(supported => {
    if (!supported) return;

    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      
      onMessage(messaging, (payload) => {
        console.log("FCM Foreground Message received:", payload);
        playNotificationSound();
        callback(payload);
      });
    } catch (err) {
      console.warn("Could not register foreground messaging listener:", err);
    }
  });
}
