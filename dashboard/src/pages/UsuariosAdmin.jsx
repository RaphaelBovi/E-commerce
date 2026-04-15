import { useEffect, useState } from "react";
import { FaUserPlus, FaInfoCircle } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";
import "./UsuariosAdmin.css";

const EMPTY_FORM = { fullName: "", email: "", password: "", confirmPassword: "" };

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const ROLE_BADGE = { MASTER: "badge-paid", ADMIN: "badge-shipped" };

export default function UsuariosAdmin() {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = () => {
    setLoading(true);
    apiFetch("/admin/users")
      .then(setAdmins)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 12) {
      setError("A senha deve ter no mínimo 12 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const created = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      setSuccess(`Administrador "${created.fullName}" criado com sucesso.`);
      setForm(EMPTY_FORM);
      setAdmins((prev) => [created, ...prev]);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerenciamento de contas administrativas</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="usuarios-info-banner">
        <FaInfoCircle />
        <span>
          Esta área é exclusiva do <strong>MASTER</strong>. Contas criadas aqui recebem
          o papel <strong>ADMIN</strong> e têm acesso ao painel, mas não podem criar
          outros usuários nem alterar configurações sensíveis.
        </span>
      </div>

      <div className="usuarios-grid">
        {/* Formulário */}
        <div className="card">
          <h2 className="usuarios-form-title">
            <FaUserPlus /> Novo Administrador
          </h2>
          <form onSubmit={handleSubmit}>
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
            <p className="usuarios-password-hint">
              A senha deve conter no mínimo 12 caracteres, incluindo letra maiúscula,
              minúscula, número e símbolo especial.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Criando…" : "Criar Administrador"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de admins */}
        <div className="card">
          <h2 className="usuarios-form-title" style={{ marginBottom: "1rem" }}>
            Contas com Acesso ao Painel
          </h2>
          {loading ? (
            <div className="spinner">Carregando…</div>
          ) : admins.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Nenhuma conta administrativa encontrada.
            </p>
          ) : (
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
                      <td>
                        <span className={`badge ${ROLE_BADGE[u.role] || "badge-pending"}`}>
                          {u.role}
                        </span>
                      </td>
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
