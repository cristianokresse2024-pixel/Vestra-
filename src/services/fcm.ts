// Simple Web Audio API Synth silencer
export function playNotificationSound() {
  // Silent to prevent unwanted background noise. Sounds will play strictly upon scanning via playBeep.
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
