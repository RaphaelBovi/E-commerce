import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaShieldAlt, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { googleSetupSendOtp, googleSetupConfirm } from "../services/authApi";
import "./GoogleSetup.css";

const GOOGLE_SETUP_KEY = "google_setup";

function getStrength(pwd) {
  if (!pwd) return null;
  const len = pwd.length;
  if (len < 6)  return { level: 0, label: "Muito fraca",  pct: 15  };
  if (len < 8)  return { level: 1, label: "Fraca",        pct: 38  };
  if (len < 12) return { level: 2, label: "Moderada",     pct: 68  };
  return        { level: 3, label: "Forte",        pct: 100 };
}

function PasswordInput({ id, value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="gs-pwd-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required
      />
      <button
        type="button"
        className="gs-pwd-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

export default function GoogleSetup() {
  const navigate = useNavigate();
  const { loginWithToken, isAuthenticated } = useAuth();

  // step: 'password' | 'otp' | 'success'
  const [step, setStep]         = useState("password");
  const [setup, setSetup]       = useState(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [otp,      setOtp]      = useState("");

  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Load pending google setup from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem(GOOGLE_SETUP_KEY);
    if (!raw) { navigate("/login", { replace: true }); return; }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.email || !parsed?.setupToken) throw new Error();
      setSetup(parsed);
      setFullName(parsed.fullName || "");
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1: password setup ──────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Informe seu nome completo."); return; }
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setSubmitting(true);
    try {
      await googleSetupSendOtp(setup.email, fullName.trim(), password, setup.setupToken);
      setResendCooldown(60);
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Não foi possível enviar o código. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: OTP confirm ─────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("O código deve ter 6 dígitos."); return; }

    setSubmitting(true);
    try {
      const data = await googleSetupConfirm(setup.email, otp, setup.setupToken);
      sessionStorage.removeItem(GOOGLE_SETUP_KEY);
      setStep("success");
      setTimeout(() => {
        loginWithToken(data);
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.message || "Código incorreto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await googleSetupSendOtp(setup.email, fullName.trim(), password, setup.setupToken);
      setResendCooldown(60);
    } catch (err) {
      setError(err?.message || "Não foi possível reenviar o código.");
    }
  };

  if (!setup) return null;

  return (
    <div className="gs-page">
      <main className="gs-right">
        <div className="gs-form-box">

          {/* ── HEADER ── */}
          <div className="gs-header">
            <div className="gs-google-badge"><FaGoogle /></div>
            <h1 className="gs-title">
              {step === "success" ? "Conta criada!" : "Criar senha para sua conta"}
            </h1>
            <p className="gs-sub">
              {step === "password" && <>Quase lá! Defina uma senha para <strong>{setup.email}</strong></>}
              {step === "otp"      && <>Enviamos um código para <strong>{setup.email}</strong></>}
              {step === "success"  && <>Bem-vindo(a), <strong>{fullName || setup.email}</strong>!</>}
            </p>
          </div>

          {/* ── STEPS ── */}
          {step !== "success" && (
            <div className="gs-steps">
              {["Senha", "Verificação"].map((label, i) => {
                const stepIdx = step === "password" ? 0 : 1;
                return (
                  <div key={label} className={`gs-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
                    <span className="gs-step-dot">{i < stepIdx ? "✓" : i + 1}</span>
                    <span className="gs-step-label">{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {error && <div className="gs-error" role="alert">{error}</div>}

          {/* ── STEP 1: password ── */}
          {step === "password" && (
            <form className="gs-form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="gs-field">
                <label htmlFor="gs-email">E-mail</label>
                <input
                  id="gs-email"
                  type="email"
                  value={setup.email}
                  disabled
                  className="gs-input-disabled"
                />
                <p className="gs-field-hint">Conta Google verificada — e-mail não editável</p>
              </div>

              <div className="gs-field">
                <label htmlFor="gs-name">Nome completo</label>
                <input
                  id="gs-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="gs-field">
                <label htmlFor="gs-pwd">Criar senha</label>
                <PasswordInput
                  id="gs-pwd"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={submitting}
                />
                {password && (() => {
                  const s = getStrength(password);
                  return (
                    <div className="gs-strength">
                      <div className="gs-strength-bar">
                        <div className={`gs-strength-fill level-${s.level}`} style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className={`gs-strength-label level-${s.level}`}>{s.label}</span>
                    </div>
                  );
                })()}
                <p className="gs-field-hint">
                  <span className={password.length >= 8 ? "hint-ok" : "hint-dim"}>✓ Mínimo 8 caracteres</span>
                </p>
              </div>

              <div className="gs-field">
                <label htmlFor="gs-confirm">Confirmar senha</label>
                <PasswordInput
                  id="gs-confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  disabled={submitting}
                />
                {confirm && password !== confirm && (
                  <p className="gs-field-error">As senhas não coincidem</p>
                )}
              </div>

              <div className="gs-info-box">
                <FaShieldAlt className="gs-info-icon" />
                <span>
                  Esta senha permitirá que você acesse sua conta também por e-mail e senha no futuro.
                </span>
              </div>

              <button type="submit" className="gs-btn-primary" disabled={submitting}>
                {submitting ? "Enviando código…" : "Continuar"}
              </button>

              <button
                type="button"
                className="gs-back-link"
                onClick={() => navigate("/login")}
              >
                ← Cancelar e voltar ao login
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <form className="gs-form" onSubmit={handleOtpSubmit} noValidate>
              <div className="gs-otp-icon"><FaShieldAlt /></div>

              <div className="gs-field">
                <label htmlFor="gs-otp">Código de verificação</label>
                <input
                  id="gs-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="gs-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  disabled={submitting}
                  autoFocus
                />
                <p className="gs-field-hint">Verifique também a pasta de spam.</p>
              </div>

              <button type="submit" className="gs-btn-primary" disabled={submitting || otp.length !== 6}>
                {submitting ? "Verificando…" : "Verificar e criar conta"}
              </button>

              <div className="gs-resend">
                {resendCooldown > 0 ? (
                  <span className="gs-resend-timer">Reenviar em {resendCooldown}s</span>
                ) : (
                  <button type="button" className="gs-link-btn" onClick={handleResend}>
                    Reenviar código
                  </button>
                )}
              </div>

              <button
                type="button"
                className="gs-back-link"
                onClick={() => { setError(""); setOtp(""); setStep("password"); }}
              >
                ← Alterar senha
              </button>
            </form>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="gs-success">
              <div className="gs-success-icon"><FaCheckCircle /></div>
              <p className="gs-success-msg">
                Sua conta foi criada com sucesso!<br />
                Você será redirecionado em instantes…
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
