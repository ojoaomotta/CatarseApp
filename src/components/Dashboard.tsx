import React from "react";

interface DashboardProps {
  user: {
    username: string;
    role: string;
    permissions: {
      can_view_social: boolean;
      can_view_finances: boolean;
      can_manage_bots: boolean;
      can_edit_portfolio: boolean;
    };
  };
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ user, setActiveTab }: DashboardProps) {
  // Mock data for widgets
  const totalSaved = "R$ 7.500,00";
  const monthlyBalance = "R$ 2.079,00";
  const activeBots = 1;
  const recentChats = 12;
  const ytSubscribers = "15.4K";
  const ytViews = "+24% este mês";
  const publishedVideos = 24;

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h2 style={styles.welcome}>Bem-vindo de volta, {user.username}</h2>
          <p style={styles.date}>Quarta-feira, 15 de Julho de 2026 • Visão Geral do Estúdio</p>
        </div>
        <span style={styles.badge} className="tracking-wide">{user.role}</span>
      </div>

      <div style={styles.grid}>
        {/* FINANCE CARD */}
        {user.permissions.can_view_finances && (
          <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("finances")}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Saúde Financeira</span>
              <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div style={styles.cardValue}>{monthlyBalance}</div>
            <div style={styles.cardSubText}>Saldo Livre do Mês • Acumulado: {totalSaved}</div>
          </div>
        )}

        {/* WHATSAPP CARD */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("whatsapp")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Mensagens & AI Bots</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div style={styles.cardValue}>{activeBots} Bot Ativo</div>
          <div style={styles.cardSubText}>{recentChats} conversas recentes qualificadas</div>
        </div>

        {/* SOCIAL CARD */}
        {user.permissions.can_view_social && (
          <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("social")}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Engajamento Social</span>
              <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div style={styles.cardValue}>{ytSubscribers}</div>
            <div style={styles.cardSubText}>Inscritos no YouTube • {ytViews}</div>
          </div>
        )}

        {/* PORTFOLIO CARD */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("cms")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Cinemateca & Portfólio</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
          <div style={styles.cardValue}>{publishedVideos} Filmes</div>
          <div style={styles.cardSubText}>Trabalhos publicados no site da Catarse</div>
        </div>
      </div>

      <div style={styles.row}>
        {/* QUICK ACTIONS */}
        <div className="glass-panel" style={styles.quickActions}>
          <h3 style={styles.sectionTitle}>Acessos Rápidos</h3>
          <div style={styles.actionsGrid}>
            <a href="https://catarse-digital.vercel.app/" target="_blank" rel="noopener noreferrer" style={styles.actionBtn} className="action-btn">
              🌐 Ver Site Catarse
            </a>
            <a href="https://www.youtube.com/@CatarseFilm" target="_blank" rel="noopener noreferrer" style={styles.actionBtn} className="action-btn">
              🎥 Canal do YouTube
            </a>
            <a href="https://www.instagram.com/catarsefilm/" target="_blank" rel="noopener noreferrer" style={styles.actionBtn} className="action-btn">
              📸 Perfil do Instagram
            </a>
            <button onClick={() => setActiveTab("whatsapp")} style={styles.actionBtnInner} className="action-btn">
              💬 WhatsApp Business
            </button>
            {user.permissions.can_view_finances && (
              <button onClick={() => setActiveTab("finances")} style={styles.actionBtnInner} className="action-btn">
                📈 Painel Financeiro
              </button>
            )}
            {user.permissions.can_edit_portfolio && (
              <button onClick={() => setActiveTab("cms")} style={styles.actionBtnInner} className="action-btn">
                🎬 Adicionar Novo Filme
              </button>
            )}
          </div>
        </div>

        {/* AGENCY MANIFEST */}
        <div className="glass-panel" style={styles.manifestCard}>
          <h3 style={styles.sectionTitle}>Filosofia Catarse</h3>
          <p style={styles.manifestQuote}>
            "Não filmamos apenas o que acontece. Filmamos o que se sente."
          </p>
          <p style={styles.manifestText}>
            A central da Catarse Film serve para dar suporte à exclusividade do nosso trabalho artesanal. 
            Limitamos nossa produção a 30 obras anuais para focar na sensibilidade do olhar, na excelência técnica e na riqueza do color grading.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "1.5rem",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  welcome: {
    fontSize: "2.2rem",
    color: "var(--text-cream)",
    margin: 0,
  },
  date: {
    fontSize: "0.85rem",
    color: "var(--text-cream-dim)",
  },
  badge: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "var(--accent-gold-dim)",
    border: "1px solid var(--accent-gold-border)",
    borderRadius: "4px",
    color: "var(--accent-gold)",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-cream-dim)",
    fontWeight: 600,
  },
  cardIcon: {
    width: "18px",
    height: "18px",
    color: "var(--accent-gold)",
  },
  cardValue: {
    fontSize: "1.8rem",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    color: "var(--text-cream)",
  },
  cardSubText: {
    fontSize: "0.7rem",
    color: "var(--text-cream-dark)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
  },
  quickActions: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  sectionTitle: {
    fontSize: "1.4rem",
    color: "var(--text-cream)",
    margin: 0,
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  actionBtn: {
    padding: "0.9rem",
    backgroundColor: "rgba(244, 237, 217, 0.02)",
    border: "1px solid var(--glass-border)",
    borderRadius: "4px",
    color: "var(--text-cream)",
    textDecoration: "none",
    fontSize: "0.8rem",
    textAlign: "center",
    fontWeight: 500,
    transition: "var(--transition-smooth)",
  },
  actionBtnInner: {
    padding: "0.9rem",
    backgroundColor: "rgba(244, 237, 217, 0.02)",
    border: "1px solid var(--glass-border)",
    borderRadius: "4px",
    color: "var(--text-cream)",
    fontSize: "0.8rem",
    textAlign: "center",
    fontWeight: 500,
    transition: "var(--transition-smooth)",
  },
  manifestCard: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    justifyContent: "center",
  },
  manifestQuote: {
    fontSize: "1.5rem",
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    color: "var(--accent-gold)",
    lineHeight: "1.3",
  },
  manifestText: {
    fontSize: "0.85rem",
    lineHeight: "1.6",
    color: "var(--text-cream-dim)",
    textAlign: "justify",
  }
};
