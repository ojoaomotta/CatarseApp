import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onLogin: (username: string, role: "admin" | "finance" | "editor", permissions: {
    can_view_social: boolean;
    can_view_finances: boolean;
    can_manage_bots: boolean;
    can_edit_portfolio: boolean;
  }) => void;
}

interface SavedUser {
  email: string;
  name: string;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // State for remembered user
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);

  // Check for saved user on mount
  useEffect(() => {
    const cached = localStorage.getItem("catarse_remembered_user");
    if (cached) {
      try {
        setSavedUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem("catarse_remembered_user");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resolve email to use: either the input or the saved user's email
    const loginEmail = savedUser ? savedUser.email : email;

    if (!loginEmail || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const { data, error: sbError } = await supabase
        .from("app_users")
        .select("*")
        .eq("email", loginEmail)
        .eq("password", password)
        .single();

      if (!sbError && data) {
        // Save user to localStorage for the next session
        localStorage.setItem(
          "catarse_remembered_user",
          JSON.stringify({ email: data.email, name: data.name })
        );

        onLogin(data.name, data.role as any, {
          can_view_social: data.can_view_social !== false,
          can_view_finances: data.can_view_finances !== false,
          can_manage_bots: data.can_manage_bots !== false,
          can_edit_portfolio: data.can_edit_portfolio !== false,
        });
        return;
      } else {
        setError("Senha ou e-mail incorretos.");
      }
    } catch (err: any) {
      setError("Erro ao conectar ao banco de dados: " + err.message);
    }
  };

  const handleClearSavedUser = () => {
    localStorage.removeItem("catarse_remembered_user");
    setSavedUser(null);
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="film-grain"></div>
      
      <div style={styles.loginCard} className="glass-panel gold-glow">
        <div style={styles.header}>
          <h1 style={styles.title}>Catarse Film</h1>
          <span style={styles.subtitle} className="tracking-wider">Central de Controle</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          {savedUser ? (
            /* Remembered User UI */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
              <div style={styles.avatar}>
                {savedUser.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-cream-dim)" }}>Bem-vindo de volta,</span>
                <h3 style={{ margin: "0.2rem 0", fontSize: "1.2rem", fontWeight: 700, color: "var(--text-cream)" }}>
                  {savedUser.name}
                </h3>
                <span style={{ fontSize: "0.72rem", color: "var(--text-cream-dark)" }}>{savedUser.email}</span>
              </div>
            </div>
          ) : (
            /* Default Email Input UI */
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail</label>
              <input
                type="email"
                placeholder="exemplo@catarsefilm.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                style={styles.input}
              />
            </div>
          )}

          {/* Password Input (Shown in both flows) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={styles.input}
              autoFocus={!!savedUser}
            />
          </div>

          <button type="submit" className="btn-primary" style={styles.button}>
            Entrar no Estúdio
          </button>
        </form>

        {savedUser && (
          <div style={{ marginTop: "0.5rem" }}>
            <button
              onClick={handleClearSavedUser}
              style={styles.switchAccountBtn}
            >
              Entrar em uma conta diferente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "var(--bg-moss)",
    padding: "1rem",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "3rem 2.5rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    color: "var(--text-cream)",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    color: "var(--accent-gold)",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    textAlign: "left",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.75rem",
    color: "var(--text-cream-dim)",
    fontWeight: 600,
  },
  input: {
    backgroundColor: "var(--bg-moss)",
    border: "1px solid var(--glass-border)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "var(--text-cream)",
    fontSize: "0.85rem",
    outline: "none",
  },
  button: {
    padding: "0.85rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginTop: "0.5rem",
  },
  error: {
    backgroundColor: "rgba(224, 107, 107, 0.15)",
    border: "1px solid rgba(224, 107, 107, 0.3)",
    borderRadius: "8px",
    color: "#e06b6b",
    fontSize: "0.8rem",
    padding: "0.75rem 1rem",
    textAlign: "center",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    border: "2px solid var(--accent-gold-border)",
    backgroundColor: "var(--accent-gold-dim)",
    color: "var(--accent-gold)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 auto 0.5rem",
  },
  switchAccountBtn: {
    background: "none",
    border: "none",
    color: "var(--text-cream-dark)",
    fontSize: "0.75rem",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "0.25rem",
    transition: "color 0.2s",
  }
};
