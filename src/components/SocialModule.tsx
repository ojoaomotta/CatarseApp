import React from "react";

export default function SocialModule() {
  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Redes Sociais</h2>
          <p style={styles.subtitle}>Métricas de engajamento do Instagram e YouTube do estúdio</p>
        </div>
      </div>

      <div className="glass-panel gold-glow" style={styles.panel}>
        <div style={{ textAlign: "center", padding: "4rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem", alignItems: "center" }}>
          <span style={{ fontSize: "3rem" }}>⚙️</span>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-gold)" }}>Módulo em Desenvolvimento</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-cream-dim)", maxWidth: "460px", lineHeight: 1.6 }}>
            As conexões com a API do Instagram Graph e YouTube Analytics estão em fase de homologação. Os dados reais de inscritos, curtidas e comentários estarão disponíveis assim que as chaves de API forem ativadas no painel administrativo do Google Cloud e Facebook Developers.
          </p>
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
