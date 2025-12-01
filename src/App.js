import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import authService from './services/authService';
import labService from './services/labService';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [laboratorios, setLaboratorios] = useState([]);
  const [novoLab, setNovoLab] = useState({
    nome: '',
    localizacao: '',
    capacidade: '',
    equipamentos: '',
    responsavel: '',
    status: 'ativo'
  });
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  // Inicializar autenticação
  useEffect(() => {
    const iniciarApp = async () => {
      try {
        console.log("🚀 Iniciando aplicação...");
        await authService.init();
        
        // Observar mudanças de usuário
        const unsubscribeAuth = authService.addListener((currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            console.log("👤 Usuário definido no estado:", currentUser.uid.substring(0, 8));
            iniciarSincronizacao();
          }
        });
        
        return () => {
          unsubscribeAuth();
        };
      } catch (error) {
        console.error("💥 Erro ao iniciar app:", error);
        mostrarMensagem('Erro ao conectar com o Firebase', 'danger');
      } finally {
        setLoading(false);
      }
    };

    iniciarApp();
  }, []);

  // Iniciar sincronização em tempo real
  const iniciarSincronizacao = () => {
    console.log("🔄 Iniciando sincronização em tempo real...");
    
    const unsubscribe = labService.observarLaboratorios((labs, error) => {
      if (error) {
        console.error("❌ Erro na sincronização:", error);
        mostrarMensagem('Erro na sincronização', 'danger');
      } else {
        setLaboratorios(labs);
        console.log(`📊 Laboratórios sincronizados: ${labs.length}`);
      }
    });

    return unsubscribe;
  };

  // Manipular formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoLab(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Adicionar laboratório
  const handleAdicionarLab = async (e) => {
    e.preventDefault();
    
    if (!user) {
      mostrarMensagem('Usuário não autenticado', 'danger');
      return;
    }

    try {
      // Validar campos obrigatórios
      if (!novoLab.nome.trim()) {
        mostrarMensagem('Nome do laboratório é obrigatório', 'warning');
        return;
      }

      const labData = {
        ...novoLab,
        capacidade: parseInt(novoLab.capacidade) || 0,
        equipamentos: parseInt(novoLab.equipamentos) || 0
      };

      await labService.criarLaboratorio(labData);
      
      // Limpar formulário
      setNovoLab({
        nome: '',
        localizacao: '',
        capacidade: '',
        equipamentos: '',
        responsavel: '',
        status: 'ativo'
      });
      
      mostrarMensagem('Laboratório criado com sucesso!', 'success');
    } catch (error) {
      console.error("❌ Erro ao criar laboratório:", error);
      mostrarMensagem(`Erro: ${error.message}`, 'danger');
    }
  };

  // Deletar laboratório
  const handleDeletarLab = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este laboratório?')) {
      return;
    }

    try {
      await labService.deletarLaboratorio(id);
      mostrarMensagem('Laboratório excluído com sucesso!', 'success');
    } catch (error) {
      console.error("❌ Erro ao deletar:", error);
      mostrarMensagem(`Erro: ${error.message}`, 'danger');
    }
  };

  // Adicionar exemplo
  const handleAdicionarExemplo = async () => {
    try {
      const exemplo = labService.gerarLaboratorioExemplo();
      await labService.criarLaboratorio(exemplo);
      mostrarMensagem('Laboratório de exemplo adicionado!', 'info');
    } catch (error) {
      console.error("❌ Erro ao adicionar exemplo:", error);
      mostrarMensagem(`Erro: ${error.message}`, 'danger');
    }
  };

  // Mostrar mensagem
  const mostrarMensagem = (texto, tipo = 'info') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 5000);
  };

  // Se estiver carregando
  if (loading) {
    return <LoadingScreen message="Conectando ao Firebase..." />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="bg-dark text-white p-4 mb-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">🧪 Gestão de Laboratórios</h1>
              <p className="mb-0 text-light">
                {user ? `Usuário: ${authService.getUserDisplayId()}` : 'Não autenticado'}
              </p>
            </div>
            <div className="d-flex align-items-center">
              <span className={`badge ${user ? 'bg-success' : 'bg-danger'} me-3`}>
                {user ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
              {user && (
                <button 
                  className="btn btn-outline-light btn-sm"
                  onClick={() => authService.logout()}
                >
                  🔄 Nova Sessão
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mensagem */}
      {mensagem.texto && (
        <div className="container mb-4">
          <div className={`alert alert-${mensagem.tipo} alert-dismissible fade show`}>
            {mensagem.texto}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMensagem({ texto: '', tipo: '' })}
            ></button>
          </div>
        </div>
      )}

      <main className="container">
        <div className="row">
          {/* Formulário */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">➕ Novo Laboratório</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleAdicionarLab}>
                  <div className="mb-3">
                    <label className="form-label">Nome do Laboratório *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nome"
                      value={novoLab.nome}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Laboratório de Química"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Localização</label>
                    <input
                      type="text"
                      className="form-control"
                      name="localizacao"
                      value={novoLab.localizacao}
                      onChange={handleInputChange}
                      placeholder="Ex: Bloco A, Sala 205"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Capacidade</label>
                      <input
                        type="number"
                        className="form-control"
                        name="capacidade"
                        value={novoLab.capacidade}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Número de alunos"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Equipamentos</label>
                      <input
                        type="number"
                        className="form-control"
                        name="equipamentos"
                        value={novoLab.equipamentos}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="Quantidade"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Responsável</label>
                    <input
                      type="text"
                      className="form-control"
                      name="responsavel"
                      value={novoLab.responsavel}
                      onChange={handleInputChange}
                      placeholder="Ex: Prof. João Silva"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={novoLab.status}
                      onChange={handleInputChange}
                    >
                      <option value="ativo">🟢 Ativo</option>
                      <option value="manutencao">🟡 Em Manutenção</option>
                      <option value="fechado">🔴 Fechado</option>
                    </select>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary">
                      💾 Salvar Laboratório
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={handleAdicionarExemplo}
                    >
                      🧪 Adicionar Exemplo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Lista de Laboratórios */}
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📋 Laboratórios Cadastrados</h5>
                <span className="badge bg-light text-dark">
                  {laboratorios.length} registros
                </span>
              </div>
              <div className="card-body p-0">
                {laboratorios.length === 0 ? (
                  <div className="text-center p-5">
                    <div className="mb-3">
                      <span style={{ fontSize: '3rem' }}>🧫</span>
                    </div>
                    <h5>Nenhum laboratório cadastrado</h5>
                    <p className="text-muted">
                      Adicione seu primeiro laboratório usando o formulário ao lado
                    </p>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handleAdicionarExemplo}
                    >
                      🧪 Criar Laboratório de Exemplo
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Nome</th>
                          <th>Localização</th>
                          <th>Capacidade</th>
                          <th>Equip.</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laboratorios.map((lab) => (
                          <tr key={lab.id}>
                            <td>
                              <strong>{lab.nome}</strong>
                              {lab.responsavel && (
                                <div className="text-muted small">
                                  {lab.responsavel}
                                </div>
                              )}
                            </td>
                            <td>{lab.localizacao || '-'}</td>
                            <td>
                              <span className="badge bg-info">
                                {lab.capacidade || 0}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {lab.equipamentos || 0}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                lab.status === 'ativo' ? 'bg-success' :
                                lab.status === 'manutencao' ? 'bg-warning' :
                                'bg-danger'
                              }`}>
                                {lab.status === 'ativo' ? '🟢 Ativo' :
                                 lab.status === 'manutencao' ? '🟡 Manutenção' :
                                 '🔴 Fechado'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeletarLab(lab.id)}
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {laboratorios.length > 0 && (
                <div className="card-footer text-muted small">
                  <div className="d-flex justify-content-between">
                    <span>
                      🔄 Sincronizado em tempo real com Firebase
                    </span>
                    <span>
                      Usuário: {authService.getUserDisplayId()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            {laboratorios.length > 0 && (
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card text-white bg-primary mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total</h5>
                      <p className="card-text display-6">{laboratorios.length}</p>
                      <small>Laboratórios cadastrados</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-white bg-success mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Ativos</h5>
                      <p className="card-text display-6">
                        {laboratorios.filter(l => l.status === 'ativo').length}
                      </p>
                      <small>Disponíveis para uso</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-white bg-info mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Capacidade Total</h5>
                      <p className="card-text display-6">
                        {laboratorios.reduce((sum, lab) => sum + (lab.capacidade || 0), 0)}
                      </p>
                      <small>Alunos simultâneos</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white mt-5 py-4">
        <div className="container text-center">
          <p className="mb-2">
            🔥 Sistema de Gestão de Laboratórios com Firebase
          </p>
          <p className="small text-light mb-0">
            Autenticação anônima | Sincronização em tempo real | Firestore Database
          </p>
          <div className="mt-2">
            <span className="badge bg-secondary me-2">
              Firebase: {user ? 'Conectado' : 'Desconectado'}
            </span>
            <span className="badge bg-secondary">
              Laboratórios: {laboratorios.length}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;