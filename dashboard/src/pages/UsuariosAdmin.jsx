import React, { useState } from 'react';
import axios from 'axios';
import AdminNavbar from '../components/AdminNavbar';
import './UsuariosAdmin.css';

export default function UsuariosAdmin() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [permissoes, setPermissoes] = useState({
        verFinanceiro: false,
        manipularPedidos: false,
        manipularProdutos: false
    });

    const handleTogglePermissao = (e) => {
        setPermissoes({ ...permissoes, [e.target.name]: e.target.checked });
    };

    const handleCriarUsuario = async (e) => {
        e.preventDefault();

        const permissoesArray = Object.keys(permissoes).filter(key => permissoes[key]).map(key => {
            if (key === 'verFinanceiro') return 'VER_FINANCEIRO';
            if (key === 'manipularPedidos') return 'MANIPULAR_PEDIDOS';
            if (key === 'manipularProdutos') return 'MANIPULAR_PRODUTOS';
            return '';
        });

        const novoFuncionario = { nome, email, senha, permissoes: permissoesArray, role: 'FUNCIONARIO' };

        try {
            await axios.post('http://localhost:3000/usuarios', novoFuncionario);

            alert(`Usuário ${nome} criado com sucesso!\nPrivilégios: ${permissoesArray.join(', ')}`);
            setNome(''); setEmail(''); setSenha('');
            setPermissoes({ verFinanceiro: false, manipularPedidos: false, manipularProdutos: false });
        } catch (err) {
            console.error("Erro ao salvar funcionário no backend:", err);
            alert("Erro ao criar usuário. Verifique se o json-server está rodando.");
        }
    };

    return (
        <div className="admin-layout">
            <AdminNavbar />
            <main className="dashboard-content">
                <div className="admin-header">
                    <h1>Gerenciar <span className="highlight-text">Funcionários</span></h1>
                    <p>Crie novas contas de acesso e defina os privilégios de cada setor.</p>
                </div>

                <div className="widget-box form-usuario-box">
                    <h3>Cadastrar Novo Acesso</h3>
                    <form onSubmit={handleCriarUsuario} className="user-creation-form">
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Nome Completo do Funcionário</label>
                                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>E-mail Corporativo</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Senha Provisória</label>
                                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
                            </div>
                        </div>

                        <div className="permissoes-section">
                            <h4>Privilégios de Acesso</h4>
                            <div className="checkbox-grid">
                                <label className="checkbox-container">
                                    <input type="checkbox" name="manipularPedidos" checked={permissoes.manipularPedidos} onChange={handleTogglePermissao} />
                                    <span className="checkmark"></span>
                                    <div>
                                        <strong>Estoque / Pedidos</strong>
                                        <p>Pode ver a fila de pedidos, aprovar, preparar e cancelar vendas.</p>
                                    </div>
                                </label>

                                <label className="checkbox-container">
                                    <input type="checkbox" name="manipularProdutos" checked={permissoes.manipularProdutos} onChange={handleTogglePermissao} />
                                    <span className="checkmark"></span>
                                    <div>
                                        <strong>Catálogo / Peças</strong>
                                        <p>Pode cadastrar novas peças, alterar preços e atualizar estoque.</p>
                                    </div>
                                </label>

                                <label className="checkbox-container">
                                    <input type="checkbox" name="verFinanceiro" checked={permissoes.verFinanceiro} onChange={handleTogglePermissao} />
                                    <span className="checkmark"></span>
                                    <div>
                                        <strong>Financeiro / Relatórios</strong>
                                        <p>Pode ver os gráficos de faturamento, tickets e volume de vendas.</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="btn-save-user">Salvar Novo Usuário</button>
                    </form>
                </div>
            </main>
        </div>
    );
}