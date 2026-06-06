/**
 * Firebase Cloud Messaging Service Worker
 * Real integration with Google AI Studio Applet Credentials
 */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAZVzhyBXT-SfcK0EoNbRk-jTZETUop83U",
  authDomain: "gen-lang-client-0994405432.firebaseapp.com",
  projectId: "gen-lang-client-0994405432",
  storageBucket: "gen-lang-client-0994405432.firebasestorage.app",
  messagingSenderId: "273794073990",
  appId: "1:273794073990:web:f6e3ee992d3af6d1285807"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Reino Gestão - Venda Efetuada!';
  const notificationOptions = {
    body: payload.notification?.body || 'Seu produto vinculado foi vendido.',
    icon: '/assets/crown.png', // Fallback icon path 
    badge: '/assets/crown.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
