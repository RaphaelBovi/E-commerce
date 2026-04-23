import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaShieldAlt, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { requestPasswordReset, confirmPasswordReset } from "../services/authApi";
import "./Login.css";
import "./RecuperarSenha.css";

// ─── helpers ──────────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return null;
  const len = pwd.length;
  if (len < 6)  return { level: 0, label: "Muito fraca",  pct: 15  };
  if (len < 8)  return { level: 1, label: "Fraca",        pct: 38  };
  if (len < 12) return { level: 2, label: "Moderada",     pct: 68  };
  return         { level: 3, label: "Forte",        pct: 100 };
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-pwd-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
      />
      <button
        type="button"
        className="auth-pwd-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
export default function RecuperarSenha() {
  // view: 'email' | 'token' | 'success'
  const [view, setView] = useState("email");

  const [email,       setEmail]      = useState("");
  const [token,       setToken]      = useState("");
  const [newPwd,      setNewPwd]     = useState("");
  const [confirmPwd,  setConfirmPwd] = useState("");

  const [error,       setError]      = useState("");
  const [submitting,  setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const clearError = () => setError("");

  // ── Step 1: send reset code ────────────────────────────────────
  const handleRequestReset = async (e) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) { setError("Informe o e-mail cadastrado."); return; }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setResendCooldown(60);
      setView("token");
    } catch (err) {
      setError(err?.message || "Não foi possível enviar o código. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend code ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearError();
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setResendCooldown(60);
    } catch (err) {
      setError(err?.message || "Não foi possível reenviar o código.");
    }
  };

  // ── Step 2: confirm token + set new password ───────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearError();
    if (token.replace(/\D/g, "").length !== 6) { setError("O código deve ter 6 dígitos."); return; }
    if (newPwd.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (newPwd !== confirmPwd) { setError("As senhas não coincidem."); return; }
    setSubmitting(true);
    try {
      await confirmPasswordReset(email.trim().toLowerCase(), token.trim(), newPwd);
      setView("success");
    } catch (err) {
      setError(err?.message || "Código incorreto ou expirado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Steps config ───────────────────────────────────────────────
  const stepIndex = { email: 0, token: 1 }[view] ?? -1;

  return (
    <div className="auth-page">
      <main className="auth-right">
        <div className="auth-form-box">

          {/* ── STEP 1: email ── */}
          {view === "email" && (
            <>
              <div className="auth-form-header">
                <div className="auth-form-icon rp-icon-primary">
                  <FaLock />
                </div>
                <h1 className="auth-form-title">Recuperar senha</h1>
                <p className="auth-form-sub">
                  Informe o e-mail cadastrado e enviaremos um código de verificação para você.
                </p>
              </div>

              <div className="auth-steps">
                {["E-mail", "Nova senha"].map((label, i) => (
                  <div key={label} className={`auth-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
                    <span className="auth-step-dot">{i < stepIndex ? "✓" : i + 1}</span>
                    <span className="auth-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleRequestReset} noValidate>
                <div className="auth-field">
                  <label htmlFor="rp-email">E-mail cadastrado</label>
                  <input
                    id="rp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="rp-info-box">
                  <FaEnvelope className="rp-info-icon" aria-hidden />
                  <p>Enviaremos um código de 6 dígitos válido por <strong>15 minutos</strong>. Verifique também a pasta de spam.</p>
                </div>

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Enviando código…" : "Enviar código"}
                </button>
              </form>

              <p className="auth-switch">
                Lembrou a senha?{" "}
                <Link to="/login" className="auth-link-btn" style={{ textDecoration: "underline" }}>
                  Entrar
                </Link>
              </p>
              <Link to="/" className="auth-back-link">← Voltar à loja</Link>
            </>
          )}

          {/* ── STEP 2: token + new password ── */}
          {view === "token" && (
            <>
              <div className="auth-form-header">
                <div className="auth-otp-icon">
                  <FaShieldAlt />
                </div>
                <h1 className="auth-form-title">Código enviado</h1>
                <p className="auth-form-sub">
                  Enviamos um código de 6 dígitos para<br />
                  <strong>{email}</strong>
                </p>
              </div>

              <div className="auth-steps">
                {["E-mail", "Nova senha"].map((label, i) => (
                  <div key={label} className={`auth-step ${i < 1 ? "done" : i === 1 ? "active" : ""}`}>
                    <span className="auth-step-dot">{i < 1 ? "✓" : i + 1}</span>
                    <span className="auth-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleResetPassword} noValidate>
                <div className="auth-field">
                  <label htmlFor="rp-token">Código de verificação</label>
                  <input
                    id="rp-token"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="auth-otp-input"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    disabled={submitting}
                  />
                  <p className="auth-field-hint">Verifique também a pasta de spam.</p>
                </div>

                <div className="auth-field">
                  <label htmlFor="rp-newpwd">Nova senha</label>
                  <PasswordInput
                    id="rp-newpwd"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  {newPwd && (() => {
                    const s = getStrength(newPwd);
                    return (
                      <div className="auth-strength">
                        <div className="auth-strength-bar">
                          <div
                            className={`auth-strength-fill level-${s.level}`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                        <span className={`auth-strength-label level-${s.level}`}>{s.label}</span>
                      </div>
                    );
                  })()}
                  <p className="auth-field-hint">
                    <span className={newPwd.length >= 6 ? "hint-ok" : "hint-dim"}>✓ Mínimo 6 caracteres</span>
                  </p>
                </div>

                <div className="auth-field">
                  <label htmlFor="rp-confirm">Confirmar nova senha</label>
                  <PasswordInput
                    id="rp-confirm"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  {confirmPwd && newPwd !== confirmPwd && (
                    <p className="auth-field-error">As senhas não coincidem</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={submitting || token.length !== 6 || newPwd.length < 6}
                >
                  {submitting ? "Redefinindo senha…" : "Redefinir senha"}
                </button>
              </form>

              <div className="auth-resend">
                {resendCooldown > 0 ? (
                  <span className="auth-resend-timer">Reenviar código em {resendCooldown}s</span>
                ) : (
                  <button type="button" className="auth-link-btn" onClick={handleResend}>
                    Reenviar código
                  </button>
                )}
              </div>

              <button
                type="button"
                className="auth-back-link"
                onClick={() => { clearError(); setToken(""); setNewPwd(""); setConfirmPwd(""); setView("email"); }}
              >
                ← Alterar e-mail
              </button>
            </>
          )}

          {/* ── SUCCESS ── */}
          {view === "success" && (
            <div className="auth-success">
              <div className="auth-success-icon">
                <FaCheckCircle />
              </div>
              <h1 className="auth-success-title">Senha redefinida!</h1>
              <p className="auth-success-msg">
                Sua senha foi alterada com sucesso.<br />
                Você receberá um e-mail de confirmação em breve.<br /><br />
                Agora você pode entrar com a nova senha.
              </p>
              <Link to="/login" className="auth-btn-primary auth-success-btn rp-success-btn">
                Ir para o login
              </Link>
              <p className="auth-success-hint">
                Não foi você quem alterou? Entre em contato com nosso suporte imediatamente.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
