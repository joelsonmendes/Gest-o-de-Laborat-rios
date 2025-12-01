import { auth } from "../firebase/firebaseConfig";
import { 
  signInAnonymously, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";

class AuthService {
  constructor() {
    this.user = null;
    this.ready = false;
    this.listeners = [];
  }

  // Inicializar
  init() {
    return new Promise((resolve, reject) => {
      console.log("🚀 Inicializando AuthService...");
      
      // Observar mudanças de estado
      onAuthStateChanged(auth, 
        async (user) => {
          console.log("🔄 Estado de autenticação alterado:", user ? "Logado" : "Deslogado");
          this.user = user;
          this.ready = true;
          
          if (!user) {
            console.log("🔑 Nenhum usuário, tentando login anônimo...");
            try {
              const newUser = await this.loginAnonimo();
              this.user = newUser;
              this.notifyListeners();
              resolve(newUser);
            } catch (error) {
              reject(error);
            }
          } else {
            console.log("✅ Usuário já autenticado:", user.uid.substring(0, 8) + "...");
            this.notifyListeners();
            resolve(user);
          }
        },
        (error) => {
          console.error("❌ Erro no observador de auth:", error);
          reject(error);
        }
      );
    });
  }

  // Login anônimo
  async loginAnonimo() {
    try {
      console.log("🔐 Iniciando login anônimo...");
      const userCredential = await signInAnonymously(auth);
      this.user = userCredential.user;
      console.log("🎉 Novo usuário anônimo:", this.user.uid.substring(0, 8) + "...");
      this.notifyListeners();
      return this.user;
    } catch (error) {
      console.error("💥 Erro no login anônimo:", error.code, error.message);
      throw error;
    }
  }

  // Logout (opcional - recria sessão)
  async logout() {
    try {
      console.log("🚪 Fazendo logout...");
      await signOut(auth);
      this.user = null;
      this.notifyListeners();
      // Recria nova sessão anônima
      return await this.loginAnonimo();
    } catch (error) {
      console.error("❌ Erro no logout:", error);
      throw error;
    }
  }

  // Getters
  isAuthenticated() {
    return this.user !== null;
  }

  getCurrentUser() {
    return this.user;
  }

  getUserId() {
    return this.user ? this.user.uid : null;
  }

  getUserDisplayId() {
    return this.user ? this.user.uid.substring(0, 8) + "..." : null;
  }

  isReady() {
    return this.ready;
  }

  // Observer pattern
  addListener(listener) {
    this.listeners.push(listener);
    // Notificar imediatamente se já tiver dados
    if (this.user) {
      listener(this.user);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.user);
      } catch (error) {
        console.error("Erro ao notificar listener:", error);
      }
    });
  }
}

// Singleton
const authService = new AuthService();
export default authService;