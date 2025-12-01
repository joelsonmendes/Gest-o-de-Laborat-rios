import { db } from "../firebase/firebaseConfig";
import authService from "./authService";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  where,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";

class LabService {
  constructor() {
    this.collectionName = "laboratorios";
    this.collectionRef = collection(db, this.collectionName);
  }

  // ========== CRUD OPERATIONS ==========

  // 1. Criar laboratório
  async criarLaboratorio(labData) {
    try {
      console.log("📝 Criando novo laboratório...");
      
      // Verificar autenticação
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não autenticado");
      }

      const dataCompleta = {
        ...labData,
        criadoPor: authService.getUserId(),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        status: "ativo"
      };

      const docRef = await addDoc(this.collectionRef, dataCompleta);
      console.log("✅ Laboratório criado com ID:", docRef.id);
      
      return {
        id: docRef.id,
        ...dataCompleta,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };
    } catch (error) {
      console.error("❌ Erro ao criar laboratório:", error);
      throw this.tratarErroFirebase(error);
    }
  }

  // 2. Buscar todos os laboratórios
  async buscarTodosLaboratorios() {
    try {
      console.log("🔍 Buscando todos os laboratórios...");
      const q = query(this.collectionRef, orderBy("criadoEm", "desc"));
      const snapshot = await getDocs(q);
      
      const laboratorios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converter timestamps
        criadoEm: doc.data().criadoEm?.toDate() || new Date(),
        atualizadoEm: doc.data().atualizadoEm?.toDate() || new Date()
      }));
      
      console.log(`✅ Encontrados ${laboratorios.length} laboratórios`);
      return laboratorios;
    } catch (error) {
      console.error("❌ Erro ao buscar laboratórios:", error);
      return [];
    }
  }

  // 3. Atualizar laboratório
  async atualizarLaboratorio(id, atualizacoes) {
    try {
      console.log("✏️  Atualizando laboratório:", id);
      
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...atualizacoes,
        atualizadoPor: authService.getUserId(),
        atualizadoEm: serverTimestamp()
      });
      
      console.log("✅ Laboratório atualizado:", id);
      return true;
    } catch (error) {
      console.error("❌ Erro ao atualizar laboratório:", error);
      throw this.tratarErroFirebase(error);
    }
  }

  // 4. Deletar laboratório
  async deletarLaboratorio(id) {
    try {
      console.log("🗑️  Deletando laboratório:", id);
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log("✅ Laboratório deletado:", id);
      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar laboratório:", error);
      throw this.tratarErroFirebase(error);
    }
  }

  // 5. Buscar por ID
  async buscarLaboratorioPorId(id) {
    try {
      // Nota: Para buscar por ID específico, você precisaria usar getDoc
      // Mas como estamos simulando, vamos filtrar da lista
      const todos = await this.buscarTodosLaboratorios();
      return todos.find(lab => lab.id === id) || null;
    } catch (error) {
      console.error("❌ Erro ao buscar laboratório por ID:", error);
      return null;
    }
  }

  // ========== OBSERVERS/REALTIME ==========

  // 6. Observar laboratórios em tempo real
  observarLaboratorios(callback) {
    console.log("👁️  Iniciando observação em tempo real...");
    
    const q = query(this.collectionRef, orderBy("criadoEm", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const laboratorios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          criadoEm: doc.data().criadoEm?.toDate() || new Date(),
          atualizadoEm: doc.data().atualizadoEm?.toDate() || new Date()
        }));
        
        console.log(`🔄 Atualização em tempo real: ${laboratorios.length} laboratórios`);
        callback(laboratorios);
      },
      (error) => {
        console.error("❌ Erro na sincronização em tempo real:", error);
        callback([], error);
      }
    );
    
    return unsubscribe;
  }

  // ========== BUSCAS ESPECÍFICAS ==========

  // 7. Buscar por status
  async buscarPorStatus(status) {
    try {
      const q = query(
        this.collectionRef, 
        where("status", "==", status),
        orderBy("criadoEm", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar por status:", error);
      return [];
    }
  }

  // 8. Buscar por responsável
  async buscarPorResponsavel(responsavel) {
    try {
      const q = query(
        this.collectionRef, 
        where("responsavel", "==", responsavel),
        orderBy("criadoEm", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar por responsável:", error);
      return [];
    }
  }

  // ========== UTILITIES ==========

  tratarErroFirebase(error) {
    const errosComuns = {
      'permission-denied': 'Permissão negada. Verifique as regras do Firestore.',
      'unauthenticated': 'Usuário não autenticado. Faça login novamente.',
      'not-found': 'Documento não encontrado.',
      'already-exists': 'Este documento já existe.',
      'failed-precondition': 'Operação não permitida no estado atual.',
      'network-request-failed': 'Erro de rede. Verifique sua conexão.'
    };
    
    const mensagem = errosComuns[error.code] || error.message;
    return new Error(`Firebase: ${mensagem} (${error.code})`);
  }

  // Gerar dados de exemplo
  gerarLaboratorioExemplo() {
    return {
      nome: `Laboratório ${Math.floor(Math.random() * 100)}`,
      localizacao: `Bloco ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
      capacidade: Math.floor(Math.random() * 50) + 10,
      equipamentos: Math.floor(Math.random() * 20) + 5,
      responsavel: `Prof. ${['Silva', 'Santos', 'Oliveira', 'Souza'][Math.floor(Math.random() * 4)]}`,
      status: ['ativo', 'manutencao', 'fechado'][Math.floor(Math.random() * 3)],
      descricao: 'Laboratório equipado para práticas experimentais'
    };
  }
}

// Singleton
const labService = new LabService();
export default labService;