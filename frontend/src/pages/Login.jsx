import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  FaStore, FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt,
} from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../context/useAuth";
import { sendVerificationCode, confirmRegistration as confirmRegistrationApi, googleLoginRequest } from "../services/authApi";
import "./Login.css";

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

// ─── helpers ──────────────────────────────────────────────────────
const digitsOnly = (v) => String(v || "").replace(/\D/g, "");

function getStrength(pwd) {
  if (!pwd) return null;
  const len = pwd.length;
  if (len < 6)  return { level: 0, label: "Muito fraca",  pct: 15  };
  if (len < 8)  return { level: 1, label: "Fraca",        pct: 38  };
  if (len < 12) return { level: 2, label: "Moderada",     pct: 68  };
  return        { level: 3, label: "Forte",        pct: 100 };
}

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

// ─── PasswordInput — input with show/hide toggle ──────────────────
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
export default function Login() {
  // view: 'login' | 'reg1' | 'reg2' | 'otp' | 'success'
  const [view, setView] = useState("login");

  // Login fields
  const [loginEmail, setLoginEmail]   = useState("");
  const [loginPwd,   setLoginPwd]     = useState("");

  // Register step 1
  const [regEmail,   setRegEmail]     = useState("");
  const [regPwd,     setRegPwd]       = useState("");
  const [regConfirm, setRegConfirm]   = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Register step 2
  const [fullName,  setFullName]  = useState("");
  const [cpf,       setCpf]       = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone,     setPhone]     = useState("");
  const [address,   setAddress]   = useState("");
  const [city,      setCity]      = useState("");
  const [stateUf,   setStateUf]   = useState("");
  const [zipCode,   setZipCode]   = useState("");

  // OTP
  const [otpCode,        setOtpCode]        = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingAuth,    setPendingAuth]    = useState(null);

  // UI
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [successName, setSuccessName] = useState("");

  // CAPTCHA refs + tokens
  const captchaLoginRef = useRef(null);
  const captchaRegRef   = useRef(null);
  const [captchaLogin,  setCaptchaLogin]  = useState("");
  const [captchaReg,    setCaptchaReg]    = useState("");

  const { login, loginWithToken, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated (but not on success screen)
  useEffect(() => {
    if (isAuthenticated && view !== "success") navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate, view]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const clearError = () => setError("");

  const resetRegister = useCallback(() => {
    setRegEmail(""); setRegPwd(""); setRegConfirm(""); setAcceptTerms(false);
    setFullName(""); setCpf(""); setBirthDate(""); setPhone("");
    setAddress(""); setCity(""); setStateUf(""); setZipCode("");
    setOtpCode(""); setPendingPayload(null); setPendingAuth(null);
    setError("");
    captchaLoginRef.current?.reset(); setCaptchaLogin("");
    captchaRegRef.current?.reset();   setCaptchaReg("");
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    if (RECAPTCHA_KEY && !captchaLogin) {
      setError("Confirme que você não é um robô.");
      return;
    }
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPwd, captchaLogin);
    } catch (err) {
      setError(err?.message || "E-mail ou senha incorretos.");
      captchaLoginRef.current?.reset();
      setCaptchaLogin("");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Google ─────────────────────────────────────────────────────
  const handleGoogleLogin = async (credential) => {
    clearError();
    setSubmitting(true);
    try {
      const result = await googleLoginRequest(credential);
      if (result.newUser) {
        sessionStorage.setItem("google_setup", JSON.stringify({
          email: result.email,
          fullName: result.fullName,
          setupToken: result.setupToken,
        }));
        navigate("/completar-cadastro");
      } else {
        loginWithToken(result);
      }
    } catch (err) {
      setError(err?.message || "Falha no login com Google. Tente novamente.");
      setSubmitting(false);
    }
  };

  // ── Register step 1 ────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    clearError();
    if (!acceptTerms) { setError("Você precisa aceitar os termos para criar uma conta."); return; }
    if (regPwd.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (regPwd !== regConfirm) { setError("As senhas não coincidem."); return; }
    setView("reg2");
  };

  // ── Register step 2 → send OTP ─────────────────────────────────
  const handleStep2 = async (e) => {
    e.preventDefault();
    clearError();

    if (RECAPTCHA_KEY && !captchaReg) {
      setError("Confirme que você não é um robô.");
      return;
    }

    const cpfD   = digitsOnly(cpf);
    const phoneD = digitsOnly(phone);
    const zipD   = digitsOnly(zipCode);
    const uf     = stateUf.trim().toUpperCase();

    if (cpfD.length !== 11)                             { setError("CPF deve ter 11 dígitos."); return; }
    if (phoneD.length < 10 || phoneD.length > 11)       { setError("Telefone deve ter 10 ou 11 dígitos."); return; }
    if (zipD.length !== 8)                              { setError("CEP deve ter 8 dígitos."); return; }
    if (!birthDate)                                     { setError("Informe a data de nascimento."); return; }

    const payload = {
      email: regEmail.trim(),
      password: regPwd,
      fullName: fullName.trim(),
      cpf: cpfD,
      birthDate,
      phone: phoneD,
      address: address.trim(),
      city: city.trim(),
      state: uf,
      zipCode: zipD,
    };

    setSubmitting(true);
    try {
      await sendVerificationCode(payload, captchaReg);
      setPendingPayload(payload);
      setResendCooldown(60);
      setView("otp");
    } catch (err) {
      setError(err?.message || "Não foi possível enviar o código. Tente novamente.");
      captchaRegRef.current?.reset();
      setCaptchaReg("");
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP confirm ────────────────────────────────────────────────
  const handleOtp = async (e) => {
    e.preventDefault();
    clearError();
    if (otpCode.replace(/\D/g, "").length !== 6) { setError("O código deve ter 6 dígitos."); return; }

    setSubmitting(true);
    try {
      const data = await confirmRegistrationApi(regEmail.trim(), otpCode.trim());
      setPendingAuth(data);
      setSuccessName(fullName || data.email);
      setView("success");
    } catch (err) {
      setError(err?.message || "Código incorreto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────
  const handleResend = async () => {
    if (!pendingPayload || resendCooldown > 0) return;
    clearError();
    try {
      await sendVerificationCode(pendingPayload);
      setResendCooldown(60);
    } catch (err) {
      setError(err?.message || "Não foi possível reenviar o código.");
    }
  };

  // ── Enter store from success screen ───────────────────────────
  const handleEnterStore = () => {
    if (pendingAuth) loginWithToken(pendingAuth);
    navigate(from, { replace: true });
  };

  // ── Progress steps label ───────────────────────────────────────
  const stepIndex = { reg1: 0, reg2: 1, otp: 2 }[view] ?? -1;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      {/* ── Form panel ── */}
      <main className="auth-right">
        <div className="auth-form-box">

          {/* ── LOGIN view ── */}
          {view === "login" && (
            <>
              <div className="auth-form-header">
                <div className="auth-form-icon"><FaStore /></div>
                <h1 className="auth-form-title">Bem-vindo de volta</h1>
                <p className="auth-form-sub">Entre com seu e-mail e senha</p>
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleLogin} noValidate>
                <div className="auth-field">
                  <label htmlFor="l-email">E-mail</label>
                  <input
                    id="l-email" type="email" autoComplete="email" required
                    placeholder="seu@email.com"
                    value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="auth-field">
                  <div className="auth-field-label-row">
                    <label htmlFor="l-pwd">Senha</label>
                    <Link to="/recuperar-senha" className="auth-forgot-link">Esqueceu a senha?</Link>
                  </div>
                  <PasswordInput
                    id="l-pwd" value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    autoComplete="current-password" disabled={submitting}
                  />
                </div>
                {RECAPTCHA_KEY && (
                  <div className="auth-captcha">
                    <ReCAPTCHA
                      ref={captchaLoginRef}
                      sitekey={RECAPTCHA_KEY}
                      onChange={(t) => setCaptchaLogin(t || "")}
                      onExpired={() => setCaptchaLogin("")}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={submitting || (RECAPTCHA_KEY && !captchaLogin)}
                >
                  {submitting ? "Entrando…" : "Entrar"}
                </button>
              </form>

              <div className="auth-divider"><span>ou continue com</span></div>

              <div className="auth-google-wrap">
                <GoogleLogin
                  onSuccess={(cr) => handleGoogleLogin(cr.credential)}
                  onError={() => setError("Falha no login com Google.")}
                  text="continue_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="340"
                />
              </div>

              <p className="auth-switch">
                Ainda não tem conta?{" "}
                <button type="button" className="auth-link-btn"
                  onClick={() => { clearError(); setView("reg1"); }}>
                  Criar conta
                </button>
              </p>
              <Link to="/" className="auth-back-link">← Voltar à loja</Link>
            </>
          )}

          {/* ── REGISTER step 1 — email + senha ── */}
          {view === "reg1" && (
            <>
              <div className="auth-form-header">
                <div className="auth-form-icon"><FaStore /></div>
                <h1 className="auth-form-title">Criar conta</h1>
                <p className="auth-form-sub">Passo 1 de 3 — Acesso</p>
              </div>
              <div className="auth-steps">
                {["Acesso", "Dados", "Verificação"].map((label, i) => (
                  <div key={label} className={`auth-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
                    <span className="auth-step-dot">{i < stepIndex ? "✓" : i + 1}</span>
                    <span className="auth-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleStep1} noValidate>
                <div className="auth-field">
                  <label htmlFor="r1-email">E-mail</label>
                  <input
                    id="r1-email" type="email" autoComplete="email" required
                    placeholder="seu@email.com"
                    value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="r1-pwd">Senha</label>
                  <PasswordInput
                    id="r1-pwd" value={regPwd}
                    onChange={(e) => setRegPwd(e.target.value)}
                    autoComplete="new-password" placeholder="Mínimo 6 caracteres"
                    disabled={submitting}
                  />
                  {regPwd && (() => {
                    const s = getStrength(regPwd);
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
                    <span className={regPwd.length >= 6 ? "hint-ok" : "hint-dim"}>✓ Mínimo 6 caracteres</span>
                  </p>
                </div>
                <div className="auth-field">
                  <label htmlFor="r1-confirm">Confirmar senha</label>
                  <PasswordInput
                    id="r1-confirm" value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    autoComplete="new-password" placeholder="Repita a senha"
                    disabled={submitting}
                  />
                  {regConfirm && regPwd !== regConfirm && (
                    <p className="auth-field-error">As senhas não coincidem</p>
                  )}
                </div>

                <div className="auth-terms">
                  <input
                    id="terms" type="checkbox" className="auth-checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={submitting}
                  />
                  <label htmlFor="terms">
                    Li e aceito os{" "}
                    <Link to="/institucional" className="auth-text-link">termos e condições</Link>
                    {" "}<span className="auth-required">*</span>
                  </label>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={submitting}>
                  Continuar
                </button>
              </form>

              <div className="auth-divider"><span>ou continue com</span></div>
              <div className="auth-google-wrap">
                <GoogleLogin
                  onSuccess={(cr) => handleGoogleLogin(cr.credential)}
                  onError={() => setError("Falha no login com Google.")}
                  text="signup_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="340"
                />
              </div>

              <p className="auth-switch">
                Já tem conta?{" "}
                <button type="button" className="auth-link-btn"
                  onClick={() => { clearError(); resetRegister(); setView("login"); }}>
                  Entrar
                </button>
              </p>
              <Link to="/" className="auth-back-link">← Voltar à loja</Link>
            </>
          )}

          {/* ── REGISTER step 2 — dados pessoais ── */}
          {view === "reg2" && (
            <>
              <div className="auth-form-header">
                <h1 className="auth-form-title">Dados pessoais</h1>
                <p className="auth-form-sub">Passo 2 de 3 — Dados</p>
              </div>
              <div className="auth-steps">
                {["Acesso", "Dados", "Verificação"].map((label, i) => (
                  <div key={label} className={`auth-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
                    <span className="auth-step-dot">{i < stepIndex ? "✓" : i + 1}</span>
                    <span className="auth-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleStep2} noValidate>
                <div className="auth-grid-2">
                  <div className="auth-field auth-span-2">
                    <label htmlFor="r2-name">Nome completo</label>
                    <input id="r2-name" type="text" autoComplete="name" required
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-cpf">CPF</label>
                    <input id="r2-cpf" type="text" inputMode="numeric" required
                      placeholder="000.000.000-00"
                      value={cpf} onChange={(e) => setCpf(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-birth">Nascimento</label>
                    <input id="r2-birth" type="date" required
                      value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-phone">Telefone</label>
                    <input id="r2-phone" type="text" inputMode="numeric" autoComplete="tel" required
                      placeholder="(11) 99999-9999"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-cep">CEP</label>
                    <input id="r2-cep" type="text" inputMode="numeric" required
                      placeholder="00000-000"
                      value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field auth-span-2">
                    <label htmlFor="r2-addr">Endereço</label>
                    <input id="r2-addr" type="text" autoComplete="street-address" required
                      placeholder="Rua, número, complemento"
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-city">Cidade</label>
                    <input id="r2-city" type="text" required
                      value={city} onChange={(e) => setCity(e.target.value)}
                      disabled={submitting} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="r2-uf">Estado</label>
                    <select id="r2-uf" required
                      value={stateUf} onChange={(e) => setStateUf(e.target.value)}
                      disabled={submitting}>
                      <option value="">UF</option>
                      {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {RECAPTCHA_KEY && (
                  <div className="auth-captcha">
                    <ReCAPTCHA
                      ref={captchaRegRef}
                      sitekey={RECAPTCHA_KEY}
                      onChange={(t) => setCaptchaReg(t || "")}
                      onExpired={() => setCaptchaReg("")}
                    />
                  </div>
                )}

                <div className="auth-step2-actions">
                  <button type="button" className="auth-btn-secondary"
                    onClick={() => { clearError(); setView("reg1"); }}
                    disabled={submitting}>
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    className="auth-btn-primary auth-flex-1"
                    disabled={submitting || (RECAPTCHA_KEY && !captchaReg)}
                  >
                    {submitting ? "Enviando código…" : "Criar conta"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── OTP verification ── */}
          {view === "otp" && (
            <>
              <div className="auth-form-header">
                <div className="auth-otp-icon">
                  <FaShieldAlt />
                </div>
                <h1 className="auth-form-title">Verifique seu e-mail</h1>
                <p className="auth-form-sub">
                  Enviamos um código de 6 dígitos para<br />
                  <strong>{regEmail}</strong>
                </p>
              </div>
              <div className="auth-steps">
                {["Acesso", "Dados", "Verificação"].map((label, i) => (
                  <div key={label} className={`auth-step ${i < 2 ? "done" : i === 2 ? "active" : ""}`}>
                    <span className="auth-step-dot">{i < 2 ? "✓" : i + 1}</span>
                    <span className="auth-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleOtp} noValidate>
                <div className="auth-field">
                  <label htmlFor="otp-code">Código de verificação</label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="auth-otp-input"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    disabled={submitting}
                  />
                  <p className="auth-field-hint">Verifique também a pasta de spam.</p>
                </div>
                <button type="submit" className="auth-btn-primary" disabled={submitting || otpCode.length !== 6}>
                  {submitting ? "Verificando…" : "Verificar e criar conta"}
                </button>
              </form>

              <div className="auth-resend">
                {resendCooldown > 0 ? (
                  <span className="auth-resend-timer">
                    Reenviar código em {resendCooldown}s
                  </span>
                ) : (
                  <button type="button" className="auth-link-btn" onClick={handleResend}>
                    Reenviar código
                  </button>
                )}
              </div>

              <button type="button" className="auth-back-link"
                onClick={() => { clearError(); setOtpCode(""); setView("reg2"); }}>
                ← Alterar dados
              </button>
            </>
          )}

          {/* ── SUCCESS screen ── */}
          {view === "success" && (
            <div className="auth-success">
              <div className="auth-success-icon">
                <FaCheckCircle />
              </div>
              <h1 className="auth-success-title">Conta criada!</h1>
              <p className="auth-success-msg">
                Seja bem-vindo(a), <strong>{successName}</strong>!<br />
                Seu cadastro foi concluído com sucesso. Agora você pode aproveitar
                todos os benefícios da nossa loja.
              </p>
              <button type="button" className="auth-btn-primary auth-success-btn" onClick={handleEnterStore}>
                Entrar na loja
              </button>
              <p className="auth-success-hint">
                Você receberá ofertas e novidades no e-mail cadastrado.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
