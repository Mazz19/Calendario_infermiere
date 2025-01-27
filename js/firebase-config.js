// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCbwAB2npVjrbJzk4dCw-qjaDVb5AkR86s",
    authDomain: "calendario-condiviso-bf535.firebaseapp.com",
    projectId: "calendario-condiviso-bf535",
    storageBucket: "calendario-condiviso-bf535.firebasestorage.app",
    messagingSenderId: "241340369259",
    appId: "1:241340369259:web:9839393cd443d27eac642e"
  };

// Inizializzazione Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
