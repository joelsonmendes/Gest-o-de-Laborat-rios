import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ⚠️ SUBSTITUA COM SEUS DADOS DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyASEDSuzTz2VsEnFWuICsiDwRnG29N0L0M",
  authDomain: "sgle-senai-hub.firebaseapp.com",
  projectId:"sgle-senai-hub",
  storageBucket: "sgle-senai-hub.firebasestorage.app",
  messagingSenderId: "424790404612",
  appId: "1:424790404612:web:16e14dc8e27a686b15cf51"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Função para autenticação anônima automática
async function iniciarAuthAnonima() {
  try {
    console.log("🔄 Iniciando autenticação anônima...");
    const userCredential = await signInAnonymously(auth);
    console.log("✅ Usuário anônimo conectado:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("❌ Erro na autenticação anônima:", error);
    // Tenta novamente após 3 segundos
    setTimeout(() => iniciarAuthAnonima(), 3000);
    return null;
  }
}

// Iniciar automaticamente
iniciarAuthAnonima();

// Testar conexão
async function testarConexaoFirebase() {
  try {
    console.log("🔧 Testando conexão Firebase...");
    // Tentar obter o usuário atual
    const user = auth.currentUser;
    if (user) {
      console.log("✅ Firebase conectado! User ID:", user.uid);
      return true;
    } else {
      console.log("⚠️  Aguardando autenticação...");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro na conexão Firebase:", error);
    return false;
  }
}

// Exportar tudo
export { 
  app, 
  db, 
  auth, 
  storage, 
  iniciarAuthAnonima, 
  testarConexaoFirebase 
};