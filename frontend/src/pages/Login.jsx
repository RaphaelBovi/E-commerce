import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import "./Login.css";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);

  // Etapa 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Etapa 2
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [receivePromo, setReceivePromo] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    setError("");
    setTermsError(false);

    if (!acceptTerms) {
      setTermsError(true);
      return;
    }
    if (password.length < 12) {
      setError("A senha deve ter pelo menos 12 caracteres.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(password)) {
      setError("A senha deve conter letras maiúsculas, minúsculas, números e um caractere especial.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cpfDigits = digitsOnly(cpf);
    const phoneDigits = digitsOnly(phone);
    const zipDigits = digitsOnly(zipCode);
    const uf = stateUf.trim().toUpperCase();

    if (cpfDigits.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Telefone deve ter 10 ou 11 dígitos.");
      return;
    }
    if (zipDigits.length !== 8) {
      setError("CEP deve ter 8 dígitos.");
      return;
    }
    if (uf.length !== 2 || !/^[A-Z]{2}$/.test(uf)) {
      setError("UF deve ter 2 letras (ex.: SP).");
      return;
    }
    if (!birthDate) {
      setError("Informe a data de nascimento.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        cpf: cpfDigits,
        birthDate,
        phone: phoneDigits,
        address: address.trim(),
        city: city.trim(),
        state: uf,
        zipCode: zipDigits,
      });
    } catch (err) {
      setError(err?.message || "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRegisterFields = () => {
    setStep(1);
    setConfirmPassword("");
    setFullName("");
    setCpf("");
    setBirthDate("");
    setPhone("");
    setAddress("");
    setCity("");
    setStateUf("");
    setZipCode("");
    setAcceptTerms(false);
    setReceivePromo(false);
    setTermsError(false);
  };

  return (
    <main className={`login-page ${mode === "register" ? "login-page--register" : ""}`}>
      <div
        className={`login-page-box login-page-box--wide ${
          mode === "register" ? "login-page-box--register" : ""
        }`}
      >
        <div className="login-page-mark" aria-hidden>
          <FaStore />
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`login-tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
              resetRegisterFields();
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`login-tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
              setStep(1);
            }}
          >
            Criar conta
          </button>
        </div>

        {mode === "login" ? (
          <>
            <h1 className="login-page-title">
              Acessar <span className="highlight-text">conta</span>
            </h1>
            <p className="login-page-sub">Use seu e-mail e senha.</p>
          </>
        ) : (
          <>
            <h1 className="login-page-title">
              Nova <span className="highlight-text">conta</span>
            </h1>
            <p className="login-page-sub">
              {step === 1
                ? "Informe seu e-mail e crie uma senha com no mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e um caractere especial."
                : "Preencha seus dados pessoais para concluir o cadastro."}
            </p>
            <div className="register-steps">
              <span className={`register-step ${step === 1 ? "is-active" : "is-done"}`}>1</span>
              <span className="register-step-line" />
              <span className={`register-step ${step === 2 ? "is-active" : ""}`}>2</span>
            </div>
          </>
        )}

        {error ? <div className="login-page-error" role="alert">{error}</div> : null}

        {mode === "login" ? (
          <form className="login-page-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <button type="submit" className="btn-gold btn-login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : step === 1 ? (
          <form className="login-page-form" onSubmit={handleStep1}>
            <div className="input-group">
              <label htmlFor="register-email">E-mail</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group">
              <label htmlFor="register-password">Senha</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group">
              <label htmlFor="register-confirm">Confirmar senha</label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="register-consents">
              <div className={`consent-group ${termsError ? "consent-group--error" : ""}`}>
                <input
                  id="accept-terms"
                  type="checkbox"
                  className="consent-checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-describedby={termsError ? "terms-error-msg" : undefined}
                />
                <label htmlFor="accept-terms" className="consent-label">
                  Li e aceito os{" "}
                  <Link to="/institucional" className="consent-link" tabIndex={0}>
                    termos e condições
                  </Link>{" "}
                  da loja <span className="consent-required" aria-label="obrigatório">*</span>
                </label>
              </div>
              {termsError && (
                <p className="consent-error" id="terms-error-msg" role="alert">
                  Você precisa aceitar os termos para criar uma conta.
                </p>
              )}
            </div>

            <button type="submit" className="btn-gold btn-login-submit" disabled={isSubmitting}>
              Continuar
            </button>
          </form>
        ) : (
          <form className="login-page-form login-page-form--register" onSubmit={handleRegister}>
            <div className="register-fields-grid">
              <div className="input-group register-span-2">
                <label htmlFor="register-fullName">Nome completo</label>
                <input
                  id="register-fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-cpf">CPF</label>
                <input
                  id="register-cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="Somente números"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-birth">Data de nascimento</label>
                <input
                  id="register-birth"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-phone">Telefone</label>
                <input
                  id="register-phone"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  placeholder="DDD + número"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-cep">CEP</label>
                <input
                  id="register-cep"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="8 dígitos"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group register-span-2">
                <label htmlFor="register-address">Endereço</label>
                <input
                  id="register-address"
                  type="text"
                  autoComplete="street-address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-city">Cidade</label>
                <input
                  id="register-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="register-uf">UF</label>
                <input
                  id="register-uf"
                  type="text"
                  required
                  maxLength={2}
                  placeholder="SP"
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="register-consents">
              <div className="consent-group">
                <input
                  id="receive-promo"
                  type="checkbox"
                  className="consent-checkbox"
                  checked={receivePromo}
                  onChange={(e) => setReceivePromo(e.target.checked)}
                  disabled={isSubmitting}
                />
                <label htmlFor="receive-promo" className="consent-label">
                  Desejo receber promoções e novidades por e-mail{" "}
                  <span className="consent-optional">(opcional)</span>
                </label>
              </div>
            </div>

            <div className="register-step2-actions">
              <button
                type="button"
                className="btn-outline btn-back"
                onClick={() => { setError(""); setStep(1); }}
                disabled={isSubmitting}
              >
                Voltar
              </button>
              <button type="submit" className="btn-gold btn-login-submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando…" : "Criar conta"}
              </button>
            </div>
          </form>
        )}

        <Link to="/" className="login-page-back">
          Voltar à loja
        </Link>
      </div>
    </main>
  );
}
