// ─────────────────────────────────────────────────────────────────
// UsuariosAdmin.jsx — Página de gestão de contas administrativas
//
// Exclusiva para usuários com role "MASTER" (protegida via ProtectedRoute).
//
// Funcionalidades:
//   - Criar novas contas administrativas com role ADMIN
//   - Listar todas as contas com acesso ao painel
//   - Validações de senha: mínimo 12 caracteres e confirmação igual
//
// Restrições por design:
//   - Contas criadas aqui recebem papel ADMIN (não podem criar outros admins)
//   - Apenas o MASTER pode acessar e usar esta página
//   - Não há funcionalidade de editar ou excluir usuários (futuras versões)
//
// Para adicionar a funcionalidade de excluir admin:
//   1. Adicione um botão de excluir na tabela
//   2. Implemente handleDelete chamando apiFetch com method "DELETE"
//   3. Remova o usuário da lista local com setAdmins(prev => prev.filter(...))
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { FaUserPlus, FaInfoCircle } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";
import "./UsuariosAdmin.css";

// Estado inicial do formulário de criação de administrador.
// Usado para inicializar e também para limpar o formulário após criar.
const EMPTY_FORM = { fullName: "", email: "", password: "", confirmPassword: "" };

// Formata uma string ISO de data para data e hora legíveis em pt-BR.
// Retorna "—" para valores nulos ou indefinidos.
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Mapeamento de roles para classes CSS de badge — cores definidas em index.css.
// MASTER → verde (badge-paid) | ADMIN → roxo (badge-shipped)
const ROLE_BADGE = { MASTER: "badge-paid", ADMIN: "badge-shipped" };

export default function UsuariosAdmin() {
  // Dados dos campos do formulário de criação (nome, e-mail, senha, confirmação)
  const [form, setForm]       = useState(EMPTY_FORM);

  // Indica se o formulário está sendo enviado para a API (desabilita o botão)
  const [saving, setSaving]   = useState(false);

  // Mensagem de erro exibida abaixo do cabeçalho (validação ou erro da API)
  const [error, setError]     = useState("");

  // Mensagem de sucesso exibida após criar um admin (desaparece em 4 segundos)
  const [success, setSuccess] = useState("");

  // Lista de contas administrativas carregadas da API
  const [admins, setAdmins]   = useState([]);

  // Indica se a lista de admins está sendo carregada (exibe spinner)
  const [loading, setLoading] = useState(true);

  // Busca a lista de administradores da API.
  // Chamada na montagem do componente.
  const loadAdmins = () => {
    setLoading(true);
    apiFetch("/admin/users")
      .then(setAdmins)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Executa loadAdmins() uma única vez ao montar o componente.
  useEffect(() => { loadAdmins(); }, []);

  // Atualiza o campo correspondente no estado do formulário ao digitar.
  // Usa o atributo "name" do input para identificar qual campo atualizar.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Valida e envia o formulário para criar um novo administrador.
  // Validações realizadas no front:
  //   - As senhas devem coincidir
  //   - A senha deve ter pelo menos 12 caracteres
  // Após criar com sucesso:
  //   - Limpa o formulário
  //   - Adiciona o novo admin no início da lista local
  //   - Exibe mensagem de sucesso por 4 segundos
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede reload da página pelo form
    setError("");
    setSuccess("");

    // Validação: senhas devem ser iguais
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    // Validação: senha deve ter mínimo de 12 caracteres
    if (form.password.length < 12) {
      setError("A senha deve ter no mínimo 12 caracteres.");
      return;
    }

    setSaving(true);
    try {
      // Envia os dados do novo administrador para a API.
      // O backend define automaticamente o role como ADMIN.
      const created = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      // Exibe mensagem de sucesso com o nome do admin criado
      setSuccess(`Administrador "${created.fullName}" criado com sucesso.`);
      // Limpa o formulário para permitir criar outro admin
      setForm(EMPTY_FORM);
      // Adiciona o novo admin no início da lista (mais recente primeiro)
      setAdmins((prev) => [created, ...prev]);
      // A mensagem de sucesso desaparece após 4 segundos
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      // Exibe erro retornado pela API (ex: e-mail já cadastrado)
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerenciamento de contas administrativas</p>
        </div>
      </div>

      {/* Alertas de erro e sucesso — aparecem abaixo do cabeçalho */}
      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Banner informativo sobre as permissões das contas criadas aqui */}
      <div className="usuarios-info-banner">
        <FaInfoCircle />
        <span>
          Esta área é exclusiva do <strong>MASTER</strong>. Contas criadas aqui recebem
          o papel <strong>ADMIN</strong> e têm acesso ao painel, mas não podem criar
          outros usuários nem alterar configurações sensíveis.
        </span>
      </div>

      {/* Grid de 2 colunas: formulário à esquerda, lista de admins à direita */}
      <div className="usuarios-grid">

        {/* Card com o formulário de criação de novo administrador */}
        <div className="card">
          <h2 className="usuarios-form-title">
            <FaUserPlus /> Novo Administrador
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Campo: nome completo do administrador */}
            <div className="input-group">
              <label>Nome completo *</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Ex: João Silva"
              />
            </div>

            {/* Campo: e-mail do novo administrador */}
            <div className="input-group">
              <label>E-mail *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="admin@empresa.com"
              />
            </div>

            {/* Campo: senha — mínimo 12 caracteres */}
            <div className="input-group">
              <label>Senha *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={12}
                placeholder="Mínimo 12 caracteres"
              />
            </div>

            {/* Campo: confirmação de senha — deve ser igual ao campo anterior */}
            <div className="input-group">
              <label>Confirmar senha *</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={12}
                placeholder="Repita a senha"
              />
            </div>

            {/* Dica de requisitos de senha exibida abaixo dos campos */}
            <p className="usuarios-password-hint">
              A senha deve conter no mínimo 12 caracteres, incluindo letra maiúscula,
              minúscula, número e símbolo especial.
            </p>

            {/* Botão de submit alinhado à direita */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {/* Texto muda para "Criando…" enquanto aguarda a API */}
                {saving ? "Criando…" : "Criar Administrador"}
              </button>
            </div>
          </form>
        </div>

        {/* Card com a lista de todas as contas com acesso ao painel */}
        <div className="card">
          <h2 className="usuarios-form-title" style={{ marginBottom: "1rem" }}>
            Contas com Acesso ao Painel
          </h2>

          {loading ? (
            // Spinner enquanto carrega a lista
            <div className="spinner">Carregando…</div>
          ) : admins.length === 0 ? (
            // Estado vazio — nenhuma conta encontrada
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Nenhuma conta administrativa encontrada.
            </p>
          ) : (
            // Tabela com as contas existentes: nome, e-mail, papel e data de criação
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ fontSize: "0.875rem" }}>{u.email}</td>
                      {/* Badge com o papel (MASTER = verde, ADMIN = roxo, outros = amarelo) */}
                      <td>
                        <span className={`badge ${ROLE_BADGE[u.role] || "badge-pending"}`}>
                          {u.role}
                        </span>
                      </td>
                      {/* Data de criação formatada */}
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
