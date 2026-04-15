import { Navigate, useLocation } from "react-router-dom";

function getSession() {
  try {
    const raw = sessionStorage.getItem("dashboard_admin_session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token && s?.email ? s : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, masterOnly = false }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (masterOnly && session.role !== "MASTER") {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-secondary)" }}>
        <h2 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>Acesso Restrito</h2>
        <p>Esta área é exclusiva para administradores MASTER.</p>
      </div>
    );
  }

  return children;
}
