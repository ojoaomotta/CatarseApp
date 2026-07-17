import React from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function EmailModule() {
  const handleOpenGmail = async () => {
    try {
      await openUrl("https://mail.google.com");
    } catch {
      window.open("https://mail.google.com", "_blank");
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>E-mail Catarse</h2>
          <p style={styles.subtitle}>Sincronização e atendimento de contatos da Catarse Film</p>
        </div>
      </div>

      <div className="glass-panel" style={styles.panel}>
        <div style={{ textAlign: "center", padding: "4rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem", alignItems: "center" }}>
          <span style={{ fontSize: "3rem" }}>✉️</span>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-cream)" }}>Módulo em Desenvolvimento</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-cream-dim)", maxWidth: "460px", lineHeight: 1.6 }}>
            A sincronização automática por IMAP com a caixa de entrada de <strong style={{ color: "var(--text-cream)" }}>contatocatarsefilm@gmail.com</strong> está em fase final de testes. Enquanto isso, você pode gerenciar suas mensagens e orçamentos acessando o Gmail oficial de forma 100% segura pelo navegador.
          </p>
          <button onClick={handleOpenGmail} className="btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Acessar Gmail no Navegador ↗
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1.5rem" },
  title: { fontSize: "1.6rem", margin: 0, fontWeight: 600, color: "var(--text-cream)" },
  subtitle: { fontSize: "0.8rem", color: "var(--text-cream-dim)", margin: "0.2rem 0 0" },
  panel: { padding: "1.5rem" },
};
