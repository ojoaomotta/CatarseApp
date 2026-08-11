import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onLogin: (
    username: string,
    role: "admin" | "finance" | "editor" | "client",
    permissions: {
      can_view_social: boolean;
      can_view_finances: boolean;
      can_manage_bots: boolean;
      can_edit_portfolio: boolean;
    },
    clientProjectData?: any
  ) => void;
}

interface SavedUser {
  email: string;
  name: string;
  role?: string;
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
    
    // Resolve email/username to use
    const loginEmail = savedUser ? savedUser.email : email.trim();

    if (!loginEmail || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      // 1. Try staff login in app_users
      const { data, error: sbError } = await supabase
        .from("app_users")
        .select("*")
        .eq("email", loginEmail)
        .eq("password", password)
        .single();

      if (!sbError && data) {
        localStorage.setItem(
          "catarse_remembered_user",
          JSON.stringify({ email: data.email, name: data.name, role: data.role })
        );

        onLogin(data.name, data.role as any, {
          can_view_social: data.can_view_social !== false,
          can_view_finances: data.can_view_finances !== false,
          can_manage_bots: data.can_manage_bots !== false,
          can_edit_portfolio: data.can_edit_portfolio !== false,
        });
        return;
      }

      // 2. Try Client login in clients table (by username or name match)
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .or(`username.eq.${loginEmail},name.ilike.%${loginEmail}%`)
        .eq("password", password)
        .maybeSingle();

      if (!clientError && clientData) {
        localStorage.setItem(
          "catarse_remembered_user",
          JSON.stringify({ email: clientData.username || clientData.name, name: clientData.name, role: "client" })
        );

        const parseJson = (val: any) => {
          if (val === null || val === undefined) return [];
          if (typeof val === "string") {
            try { return JSON.parse(val); } catch { return []; }
          }
          return val;
        };

        const mappedProject = {
          id: clientData.id,
          coupleName: clientData.name,
          genre: clientData.project_name || "Catarse Film",
          eventDate: clientData.event_date || "",
          stage: clientData.status || "Contrato",
          hasFilms: clientData.has_films !== false,
          hasPhotos: clientData.has_photos !== false,
          briefingEnabled: clientData.briefing_enabled !== false,
          extrasEnabled: clientData.extras_enabled !== false,
          extrasUnlocked: clientData.extras_unlocked || false,
          r2VideoKey: clientData.video_url || "",
          downloadKey: clientData.download_url || "",
          posterUrl: clientData.video_cover || "",
          contractUrl: clientData.contract_url || "",
          questions: parseJson(clientData.briefing_questions),
          fragments: parseJson(clientData.extras),
          photos: parseJson(clientData.photos),
          favoritePhotoIds: parseJson(clientData.favorite_photo_ids)
        };

        onLogin(clientData.name, "client", {
          can_view_social: false,
          can_view_finances: false,
          can_manage_bots: false,
          can_edit_portfolio: false,
        }, mappedProject);
        return;
      }

      setError("Usuário, e-mail ou senha incorretos.");
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
          <h1 style={styles.title}>Catarse</h1>
          <span style={styles.subtitle} className="tracking-wider">Central & Portal de Clientes</span>
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
            /* Default Email/Username Input UI */
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail ou Usuário de Acesso</label>
              <input
                type="text"
                placeholder="exemplo@catarsefilm.com ou codigo_cliente"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                style={styles.input}
              />
            </div>
          )}

          {/* Password Input (Shown in both flows) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha de Acesso</label>
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
            Acessar Portal / Estúdio
          </button>
        </form>

        {savedUser && (
          <div style={{ marginTop: "0.5rem" }}>
            <button
              onClick={handleClearSavedUser}
              style={styles.switchAccountBtn}
            >
              🔄 Entrar com outra conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--bg-black)",
    position: "relative",
    overflow: "hidden",
  },
  loginCard: {
    width: "90%",
    maxWidth: "400px",
    padding: "2.5rem 2rem",
    borderRadius: "16px",
    backgroundColor: "var(--bg-moss)",
    border: "1px solid var(--accent-gold-border)",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontFamily: "var(--font-serif)",
    fontSize: "2.2rem",
    color: "var(--accent-gold)",
    margin: 0,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: "0.72rem",
    color: "var(--text-cream-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.75rem",
    color: "var(--text-cream-dim)",
    fontWeight: 500,
  },
  input: {
    backgroundColor: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "8px",
    padding: "0.75rem",
    color: "var(--text-cream)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "var(--transition-smooth)",
  },
  button: {
    padding: "0.85rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginTop: "0.5rem",
    cursor: "pointer",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-gold-dim)",
    border: "1px solid var(--accent-gold-border)",
    color: "var(--accent-gold)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    fontWeight: 700,
    margin: "0 auto",
  },
  switchAccountBtn: {
    background: "none",
    border: "none",
    color: "var(--accent-gold)",
    fontSize: "0.75rem",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    padding: "0.5rem",
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#f87171",
    fontSize: "0.8rem",
    padding: "0.6rem",
    borderRadius: "6px",
    textAlign: "center",
  },
};
