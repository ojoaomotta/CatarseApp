import React, { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function WhatsAppModule() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleOpenWhatsAppWeb = async () => {
    try {
      await openUrl("https://web.whatsapp.com/");
    } catch (e: any) {
      alert("Erro ao abrir WhatsApp Web: " + e.message);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    // Clean phone number (keep digits only)
    const cleanPhone = phone.replace(/\D/g, "");
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;

    try {
      await openUrl(waUrl);
      setPhone("");
      setMessage("");
    } catch (e: any) {
      alert("Erro ao direcionar para o WhatsApp Web: " + e.message);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>WhatsApp Central</h2>
          <p style={styles.subtitle}>Conexão segura e manual para evitar bloqueios anti-spam</p>
        </div>
      </div>

      <div style={styles.contentLayout}>
        {/* Alerta de Segurança Anti-Spam */}
        <div className="glass-panel" style={{ ...styles.panel, borderLeft: "4px solid #e06b6b" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "2rem" }}>⚠️</span>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#e06b6b", fontWeight: 700 }}>
                Proteção Contra Bloqueios (Spam)
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-cream-dim)", lineHeight: 1.6 }}>
                O WhatsApp utiliza inteligência artificial avançada para detectar robôs baseados em engenharia reversa. Conexões automatizadas de terceiros podem colocar seu chip em restrição por 7 dias ou causar o banimento definitivo do número.
              </p>
              <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.82rem", color: "var(--text-cream-dim)", lineHeight: 1.6 }}>
                Para sua segurança total, desativamos os servidores automatizados em segundo plano. Use o **WhatsApp Web Oficial** ou gere links diretos de envio abaixo.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.gridColumns}>
          {/* Coluna 1: Acesso Rápido */}
          <div className="glass-panel gold-glow" style={{ ...styles.panel, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={styles.sectionTitle}>Acesso Oficial</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-cream-dim)", lineHeight: 1.5 }}>
              Abra o WhatsApp Web oficial no seu navegador padrão de forma 100% segura para conversar com seus noivos e clientes.
            </p>
            <button onClick={handleOpenWhatsAppWeb} className="btn-primary" style={{ padding: "0.8rem 1.5rem", fontSize: "0.85rem", width: "100%" }}>
              Abrir WhatsApp Web Oficial ↗
            </button>
          </div>

          {/* Coluna 2: Gerador de Conversas Rápidas (Click-to-chat) */}
          <div className="glass-panel" style={{ ...styles.panel, display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <h3 style={styles.sectionTitle}>Enviar Mensagem Sem Salvar Contato</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-cream-dim)", lineHeight: 1.5 }}>
              Insira o telefone do cliente com DDI e DDD (ex: 5511999999999) para abrir a conversa diretamente no WhatsApp Web com uma mensagem pré-preenchida.
            </p>
            <form onSubmit={handleGenerateLink} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>WhatsApp do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Mensagem Padrão (Opcional)</label>
                <textarea
                  placeholder="Ex: Olá! Aqui é a equipe da Catarse Film..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ ...styles.formInput, height: "70px", resize: "none" }}
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                Iniciar Conversa Oficial ↗
              </button>
            </form>
          </div>
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
  contentLayout: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  panel: { padding: "1.5rem" },
  sectionTitle: { margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-cream)" },
  gridColumns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  formLabel: { fontSize: "0.75rem", color: "var(--text-cream-dim)" },
  formInput: { backgroundColor: "var(--bg-moss)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "0.6rem 0.85rem", color: "var(--text-cream)", fontSize: "0.8rem", outline: "none" },
};
