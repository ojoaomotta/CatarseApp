import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
  const [totalEquipments, setTotalEquipments] = useState(0);
  const [equipmentsInUse, setEquipmentsInUse] = useState(0);
  const [totalFilms, setTotalFilms] = useState(0);
  const [totalClients, setTotalClients] = useState(0);

  // Load real counts from Supabase to remove fake info
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // 1. Fetch Equipments
        const { data: equipData } = await supabase
          .from("equipment")
          .select("status");
        if (equipData) {
          setTotalEquipments(equipData.length);
          setEquipmentsInUse(equipData.filter((e) => e.status === "Em Uso").length);
        }

        // 2. Fetch Films count
        const { count: filmCount } = await supabase
          .from("lab_portfolio")
          .select("id", { count: "exact", head: true });
        setTotalFilms(filmCount || 0);

        // 3. Fetch Clients count
        const { count: clientCount } = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true });
        setTotalClients(clientCount || 0);
      } catch (err) {
        console.warn("Erro ao buscar contagens do banco:", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h2 style={styles.welcome}>Bem-vindo, {user.username}</h2>
          <p style={styles.date}>Visão Geral do Estúdio Catarse Film</p>
        </div>
        <span style={styles.badge} className="tracking-wide">{user.role}</span>
      </div>

      <div style={styles.grid}>
        {/* CLIENTS CARD */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("cms")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Clientes & Casamentos</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0 1 12 20.25a11.98 11.98 0 0 1-3-.122v-.079c0-1.114-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0 1 12 20.25a11.978 11.978 0 0 1-3-.122v-.109m0 0a9.013 9.013 0 0 1 2.625-.372 9.037 9.037 0 0 1 2.625.372M9 19.128v-.003c0-1.113.285-2.16.786-3.07M9 19.128v.109A11.978 11.978 0 0 1 6 20.25a11.98 11.98 0 0 1-3-.122v-.079c0-1.114.285-2.16.786-3.07m0 0a4.125 4.125 0 0 1 7.533-2.493M9 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div style={styles.cardValue}>{totalClients} Casais</div>
          <div style={styles.cardSubText}>Casamentos ativos no sistema</div>
        </div>

        {/* WHATSAPP CARD */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("whatsapp")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>WhatsApp Central</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div style={styles.cardValue}>WhatsApp Web</div>
          <div style={styles.cardSubText}>Envios de mensagens manuais e seguros</div>
        </div>

        {/* EQUIPMENT CARD (Replaces YouTube/Instagram fake card) */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("equipment")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Equipamentos</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
          <div style={styles.cardValue}>{totalEquipments} Itens</div>
          <div style={styles.cardSubText}>{equipmentsInUse} em gravação no momento</div>
        </div>

        {/* PORTFOLIO CARD */}
        <div className="glass-panel gold-glow" style={styles.card} onClick={() => setActiveTab("cms")}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Cinemateca & Portfólio</span>
            <svg style={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
          <div style={styles.cardValue}>{totalFilms} Filmes</div>
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
              💬 WhatsApp Web
            </button>
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
