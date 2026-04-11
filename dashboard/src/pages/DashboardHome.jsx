import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCheck, FaTimes, FaEye, FaSpinner, FaTimesCircle, FaLock } from 'react-icons/fa';
import AdminNavbar from '../components/AdminNavbar';
import './DashboardHome.css';
import './GestaoPedidos.css';

export default function DashboardHome() {
  const [currentUser] = useState(() => {
    const userString = localStorage.getItem('adminUser');
    return userString ? JSON.parse(userString) : null;
  });

  const hasFinanceiroAccess = currentUser?.role === 'MASTER' || currentUser?.permissoes?.includes('VER_FINANCEIRO');
  const [chartData, setChartData] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const responseGrafico = await axios.get('http://localhost:3000/grafico-vendas');
      const responseTopProdutos = await axios.get('http://localhost:3000/top-produtos');
      const responsePedidos = await axios.get('http://localhost:3000/pedidos');

      setChartData(responseGrafico.data);
      setTopProdutos(responseTopProdutos.data);
      setPedidos(responsePedidos.data);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard", err);
      setError("Não foi possível carregar os dados. Verifique a conexão com o json-server.");
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
      if (response.data) {
        setPedidoDetalhe(response.data);
      }
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
        fetchDashboardData(); 
        handleFecharModal();
      } catch (error) {
        console.error("Erro ao aprovar:", error);
        alert("Erro ao aprovar pedido.");
      }
    }
  };

  const handleCancelar = async (id, e) => {
    if (e) e.stopPropagation();
    if(window.confirm(`Tem certeza que deseja cancelar o pedido #${id}?`)) {
      try {
        await axios.patch(`http://localhost:3000/pedidos/${id}`, { status: 'CANCELADO' });
        fetchDashboardData(); 
        handleFecharModal(); 
      } catch (error) {
        console.error("Erro ao cancelar:", error);
        alert("Erro ao cancelar pedido.");
      }
    }
  };

  const getStatusTratado = (status) => {
    if (!status) return 'DESCONHECIDO';
    return status.toString().trim().toUpperCase();
  };

  const statusPriority = { 'PENDENTE': 1, 'EM_PREPARACAO': 2, 'ENVIADO': 3, 'CANCELADO': 4 };

  const sortedPedidos = [...pedidos].sort((a, b) => {
    return (statusPriority[getStatusTratado(a.status)] || 99) - (statusPriority[getStatusTratado(b.status)] || 99);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPedidos.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  if (loading) {
    return (
      <div className="admin-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <FaSpinner className="spinner-icon" style={{ fontSize: '3rem', color: '#dca200', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminNavbar />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Visão <span className="highlight-text">Geral</span></h1>
          <p>Acompanhe o desempenho das suas vendas e fluxo de pedidos.</p>
          {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}
        </div>

        <div className="dashboard-widgets-row">
          
          <div className="widget-box chart-widget">
            <h3>Faturamento Recente</h3>
            <div className="chart-container">
              {hasFinanceiroAccess ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                    <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <Bar dataKey="totalVendas" fill="#dca200" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="locked-access-container">
                  <FaLock className="locked-icon" />
                  <h4>Acesso Restrito</h4>
                  <p>Você não tem privilégios para visualizar o gráfico financeiro global.</p>
                </div>
              )}
            </div>
          </div>

          <div className="widget-box top-products-widget">
            <h3>Top 5 Produtos</h3>
            <ul className="top-products-list">
              {topProdutos.length === 0 ? <p>Nenhum dado encontrado.</p> : topProdutos.map((produto, index) => (
                <li key={produto.ref} className="top-product-item">
                  <div className="product-rank">{index + 1}º</div>
                  <div className="product-details">
                    <p className="product-name">{produto.name} - {produto.brand}</p>
                    <p className="product-stats">
                      Ref: {produto.ref} | Vendidos: {produto.amount} unid.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="widget-box table-widget">
          <h3>Fila de Pedidos (Ordenado por Prioridade)</h3>
          <div className="table-responsive">
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
                {currentItems.length === 0 ? <tr><td colSpan="6" className="text-center">Nenhum pedido encontrado.</td></tr> : currentItems.map((pedido) => {
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
                        <button className="btn-action btn-view" title="Ver Detalhes" onClick={(e) => handleVerDetalhes(pedido.id, e)}>
                          <FaEye />
                        </button>
                        {statusValido === 'PENDENTE' && (
                          <>
                            <button className="btn-action btn-approve" title="Aprovar" onClick={(e) => handleAprovar(pedido.id, e)}><FaCheck /></button>
                            <button className="btn-action btn-cancel" title="Cancelar" onClick={(e) => handleCancelar(pedido.id, e)}><FaTimes /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="page-btn">&laquo; Ant</button>
              {[...Array(totalPages)].map((_, index) => (
                <button key={index + 1} onClick={() => paginate(index + 1)} className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}>{index + 1}</button>
              ))}
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="page-btn">Próx &raquo;</button>
            </div>
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
                    {getStatusTratado(pedidoDetalhe.status) === 'PENDENTE' ? (
                      <div className="modal-action-buttons">
                        <button className="btn-modal-cancel" onClick={(e) => handleCancelar(pedidoDetalhe.id, e)}>
                          <FaTimes /> Cancelar Pedido
                        </button>
                        <button className="btn-modal-approve" onClick={(e) => handleAprovar(pedidoDetalhe.id, e)}>
                          <FaCheck /> Aprovar e Preparar
                        </button>
                      </div>
                    ) : (
                      <span className="status-note">Este pedido já foi processado.</span>
                    )}
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