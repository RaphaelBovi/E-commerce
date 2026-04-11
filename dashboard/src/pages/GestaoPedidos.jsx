import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes, FaEye, FaSearch, FaTimesCircle, FaPrint, FaFileDownload, FaFilter } from 'react-icons/fa';
import AdminNavbar from '../components/AdminNavbar';
import './GestaoPedidos.css';

export default function GestaoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/pedidos');
      setPedidos(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalhes = async (id, e) => {
    if (e) e.stopPropagation(); 
    setIsModalOpen(true);
    setLoadingModal(true);
    setPedidoDetalhe(null); 
    
    try {
      const response = await axios.get(`http://localhost:3000/pedidos/${id}`);
      if (response.data) setPedidoDetalhe(response.data);
    } catch (error) {
      console.error("Erro fatal ao abrir modal:", error);
      alert(`Erro ao abrir o pedido #${id}.`);
      setIsModalOpen(false);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleFecharModal = () => {
    setIsModalOpen(false);
    setPedidoDetalhe(null);
  };

  const handleAprovar = async (id, e) => {
    if (e) e.stopPropagation(); 
    if(window.confirm(`Iniciar preparação do pedido #${id}?`)) {
      try {
        await axios.patch(`http://localhost:3000/pedidos/${id}`, { status: 'EM_PREPARACAO' });
        fetchPedidos(); 
        handleFecharModal();
      } catch (error) {
        console.error("Erro ao aprovar pedido:", error);
        alert("Erro ao aprovar pedido.");
      }
    }
  };

  const handleCancelar = async (id, e) => {
    if (e) e.stopPropagation();
    if(window.confirm(`Tem certeza que deseja cancelar o pedido #${id}?`)) {
      try {
        await axios.patch(`http://localhost:3000/pedidos/${id}`, { status: 'CANCELADO' });
        fetchPedidos();
        handleFecharModal(); 
      } catch (error) {
        console.error("Erro ao cancelar pedido:", error);
        alert("Erro ao cancelar pedido.");
      }
    }
  };


  const handleImprimirEtiquetaUnica = (id) => {
    alert(`Gerando etiqueta de envio para o pedido #${id}...`);
  };

  const handleExportarRelatorio = () => {
    alert("Exportando lista de pedidos para Excel (.xlsx)...");
  };

  const getStatusTratado = (status) => {
    if (!status) return 'DESCONHECIDO';
    return status.toString().trim().toUpperCase();
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const statusValido = getStatusTratado(p.status);
    const bateBusca = (p.clienteNome && p.clienteNome.toLowerCase().includes(termoBusca.toLowerCase())) || 
                      (p.id && p.id.toString().includes(termoBusca));
    const bateFiltroStatus = filtroStatus === 'TODOS' || statusValido === filtroStatus;
    
    return bateBusca && bateFiltroStatus;
  });

  const countPendentes = pedidos.filter(p => getStatusTratado(p.status) === 'PENDENTE').length;
  const countPreparacao = pedidos.filter(p => getStatusTratado(p.status) === 'EM_PREPARACAO').length;

  const getStatusBadge = (statusOriginal) => {
    const status = getStatusTratado(statusOriginal);
    switch(status) {
      case 'PENDENTE': return <span className="badge badge-warning">Pendente</span>;
      case 'EM_PREPARACAO': return <span className="badge badge-info">Em Preparação</span>;
      case 'ENVIADO': return <span className="badge badge-success">Enviado</span>;
      case 'CANCELADO': return <span className="badge badge-danger">Cancelado</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />

      <main className="dashboard-content">
        <div className="admin-header">
          <h1>Central de <span className="highlight-text">Expedição</span></h1>
          <p>Gerencie, filtre e prepare os pedidos para envio de forma ágil.</p>
        </div>

        <div className="tools-section widget-box">
          
          <div className="filters-shortcut">
            <span className="tools-title"><FaFilter /> Filtros Rápidos:</span>
            <button className={`filter-pill ${filtroStatus === 'TODOS' ? 'active' : ''}`} onClick={() => setFiltroStatus('TODOS')}>
              Todos
            </button>
            <button className={`filter-pill pill-warning ${filtroStatus === 'PENDENTE' ? 'active' : ''}`} onClick={() => setFiltroStatus('PENDENTE')}>
              Pendentes <span className="count-badge">{countPendentes}</span>
            </button>
            <button className={`filter-pill pill-info ${filtroStatus === 'EM_PREPARACAO' ? 'active' : ''}`} onClick={() => setFiltroStatus('EM_PREPARACAO')}>
              Em Preparação <span className="count-badge">{countPreparacao}</span>
            </button>
            <button className={`filter-pill pill-success ${filtroStatus === 'ENVIADO' ? 'active' : ''}`} onClick={() => setFiltroStatus('ENVIADO')}>
              Enviados
            </button>
          </div>

          <div className="action-tools">
            <button className="btn-tool btn-export" onClick={handleExportarRelatorio}>
              <FaFileDownload /> Exportar Excel
            </button>
          </div>

        </div>

        <div className="toolbar">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Buscar por ID ou Nome..." 
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container widget-box">
          {loading ? (
             <p className="text-center" style={{padding: '2rem'}}>Carregando fila de pedidos...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="text-center empty-state">Nenhum pedido encontrado com este filtro.</td></tr>
                ) : (
                  pedidosFiltrados.map((pedido) => {
                    const statusValido = getStatusTratado(pedido.status);
                    return (
                      <tr 
                        key={pedido.id} 
                        className={`clickable-row ${statusValido === 'PENDENTE' ? 'row-highlight' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleVerDetalhes(pedido.id, e)}
                      >
                        <td><strong>#{pedido.id}</strong></td>
                        <td>{new Date(pedido.dataCriacao).toLocaleDateString('pt-BR')}</td>
                        <td>{pedido.clienteNome}</td>
                        <td>
                          <strong>{pedido.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </td>
                        <td>{getStatusBadge(pedido.status)}</td>
                        <td className="actions-cell">
                          {statusValido === 'PENDENTE' ? (
                            <>
                              
                              <button className="btn-action btn-approve" title="Aprovar" onClick={(e) => handleAprovar(pedido.id, e)}><FaCheck /></button>
                              <button className="btn-action btn-cancel" title="Cancelar" onClick={(e) => handleCancelar(pedido.id, e)}><FaTimes /></button>
                            </>
                          ) : (
                            <button className="btn-action btn-view" title="Ver Detalhes" onClick={(e) => handleVerDetalhes(pedido.id, e)}><FaEye /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleFecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleFecharModal}><FaTimesCircle /></button>
            
            {loadingModal || !pedidoDetalhe ? (
              <div className="modal-loading">Buscando detalhes do pedido...</div>
            ) : (
              <>
                <h2 className="modal-title">Pedido #{pedidoDetalhe.id} {getStatusBadge(pedidoDetalhe.status)}</h2>
                
                <div className="modal-grid">
                  <div className="modal-section">
                    <h3>Dados do Comprador</h3>
                    <p><strong>Nome:</strong> {pedidoDetalhe.cliente?.nome}</p>
                    <p><strong>Empresa / CNPJ:</strong> {pedidoDetalhe.cliente?.empresa || 'Pessoa Física'}</p>
                    <p><strong>Contato:</strong> {pedidoDetalhe.cliente?.telefone} | {pedidoDetalhe.cliente?.email}</p>
                    <p className="highlight-text" style={{marginTop: '10px', fontWeight: 'bold'}}>
                      Fidelidade: Já comprou {pedidoDetalhe.cliente?.comprasAnteriores} vezes conosco.
                    </p>
                  </div>

                  <div className="modal-section">
                    <h3>Logística</h3>
                    <p><strong>Prazo de Entrega:</strong> {pedidoDetalhe.prazoEntrega || 'A definir'}</p>
                    <p><strong>Endereço de Destino:</strong></p>
                    <p style={{color: '#666', marginTop: '5px'}}>
                      {pedidoDetalhe.endereco?.rua}, {pedidoDetalhe.endereco?.numero} <br/>
                      {pedidoDetalhe.endereco?.bairro} - {pedidoDetalhe.endereco?.cidade}/{pedidoDetalhe.endereco?.estado} <br/>
                      CEP: {pedidoDetalhe.endereco?.cep}
                    </p>
                  </div>
                </div>

                <div className="modal-section itens-section">
                  <h3>Peças Solicitadas</h3>
                  <div className="itens-list">
                    {pedidoDetalhe.itens?.map((item, index) => (
                      <div key={index} className="item-row">
                        <img src={item.produto?.image || 'https://via.placeholder.com/60'} alt="Peça" className="item-img" />
                        <div className="item-info">
                          <h4>{item.produto?.name} <span className="item-brand">({item.produto?.brand})</span></h4>
                          <p>Ref: {item.produto?.ref} | Categoria: {item.produto?.category}</p>
                        </div>
                        <div className="item-pricing">
                          <p>{item.quantidade}x</p>
                          <p><strong>{item.precoUnitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <div className="modal-actions-container">
                    <div className="modal-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {getStatusTratado(pedidoDetalhe.status) === 'PENDENTE' ? (
                        <>
                          <button className="btn-modal-cancel" onClick={(e) => handleCancelar(pedidoDetalhe.id, e)}>
                            <FaTimes /> Cancelar Pedido
                          </button>
                          <button className="btn-modal-approve" onClick={(e) => handleAprovar(pedidoDetalhe.id, e)}>
                            <FaCheck /> Aprovar e Preparar
                          </button>
                        </>
                      ) : (
                        <span className="status-note" style={{ marginRight: '1rem' }}>
                          Este pedido está {getStatusTratado(pedidoDetalhe.status)}.
                        </span>
                      )}
                      {getStatusTratado(pedidoDetalhe.status) !== 'CANCELADO' && (
                        <button className="btn-tool btn-print" onClick={() => handleImprimirEtiquetaUnica(pedidoDetalhe.id)}>
                          <FaPrint /> Imprimir Etiqueta
                        </button>
                      )}
                    </div>

                  </div>
                  <h3>Valor Total: <span className="highlight-text">
                    {pedidoDetalhe.valorTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span></h3>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}