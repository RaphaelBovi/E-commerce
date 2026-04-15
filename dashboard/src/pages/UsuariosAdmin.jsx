import { useState } from "react";
import { FaUserPlus, FaInfoCircle } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";
import "./UsuariosAdmin.css";

const EMPTY_FORM = { fullName: "", email: "", password: "", confirmPassword: "" };

export default function UsuariosAdmin() {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

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
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: "ADMIN",
        }),
      });
      setSuccess(`Usuário "${form.fullName}" criado com sucesso como ADMIN.`);
      setForm(EMPTY_FORM);
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
          <p className="page-subtitle">Crie novas contas de acesso administrativo</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="usuarios-info-banner">
        <FaInfoCircle />
        <span>
          Esta área é exclusiva do <strong>MASTER</strong>. Contas criadas aqui receberão
          o papel <strong>ADMIN</strong> e terão acesso ao painel administrativo, mas não
          poderão criar outros usuários nem alterar configurações sensíveis.
        </span>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
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
          <div style={{ marginTop: "0.5rem" }}>
            <p className="usuarios-password-hint">
              A senha deve conter no mínimo 12 caracteres, incluindo letra maiúscula,
              minúscula, número e símbolo especial.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Criando…" : "Criar Administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
