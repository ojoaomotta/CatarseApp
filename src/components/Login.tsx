import React, { useState } from "react";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onLogin: (username: string, role: "admin" | "finance" | "editor", permissions: {
    can_view_social: boolean;
    can_view_finances: boolean;
    can_manage_bots: boolean;
    can_edit_portfolio: boolean;
  }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const { data, error: sbError } = await supabase
        .from("app_users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (!sbError && data) {
        onLogin(data.name, data.role as any, {
          can_view_social: data.can_view_social !== false,
          can_view_finances: data.can_view_finances !== false,
          can_manage_bots: data.can_manage_bots !== false,
          can_edit_portfolio: data.can_edit_portfolio !== false,
        });
        return;
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } catch (err: any) {
      setError("Erro ao conectar ao banco de dados: " + err.message);
    }
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={styles.input}
            />
          </div>

          <button type="submit" className="btn-primary" style={styles.button}>
            Entrar no Estúdio
          </button>
        </form>
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
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-cream-dim)",
    fontWeight: 500,
  },
  button: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.9rem",
    fontSize: "0.85rem",
  },
  error: {
    color: "var(--danger)",
    fontSize: "0.8rem",
    backgroundColor: "rgba(207, 102, 121, 0.1)",
    border: "1px solid rgba(207, 102, 121, 0.2)",
    padding: "0.75rem",
    borderRadius: "4px",
    textAlign: "center",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "1rem 0 0.5rem 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "var(--glass-border)",
  },
  dividerText: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    color: "var(--text-cream-dark)",
    letterSpacing: "0.05em",
  },
  demoButtons: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
  },
  demoBtn: {
    flex: 1,
    padding: "0.6rem 0.2rem",
    fontSize: "0.65rem",
    letterSpacing: "0.05em",
  }
};
