import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import SocialModule from "./components/SocialModule";
import WhatsAppModule from "./components/WhatsAppModule";
import FinanceModule from "./components/FinanceModule";
import CMSModule from "./components/CMSModule";
import AdminModule from "./components/AdminModule";
import EmailModule from "./components/EmailModule";
import EquipmentModule from "./components/EquipmentModule";
import { openUrl } from "@tauri-apps/plugin-opener";
import "./App.css";

interface UserProfile {
  username: string;
  role: "admin" | "finance" | "editor";
  permissions: {
    can_view_social: boolean;
    can_view_finances: boolean;
    can_manage_bots: boolean;
    can_edit_portfolio: boolean;
  };
}

const LOCAL_VERSION = "0.6.0";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/ojoaomotta/CatarseApp/releases/latest");
        if (!res.ok) return;
        const data = await res.json();
        const latestTag = data.tag_name;
        
        // Clean version strings
        const cleanLatest = latestTag.replace(/[a-zA-Z-]/g, "");
        const cleanLocal = LOCAL_VERSION;
        
        // Semver comparison
        const latestParts = cleanLatest.split(".").map(Number);
        const localParts = cleanLocal.split(".").map(Number);
        
        let hasNewer = false;
        for (let i = 0; i < Math.max(latestParts.length, localParts.length); i++) {
          const latestPart = latestParts[i] || 0;
          const localPart = localParts[i] || 0;
          if (latestPart > localPart) {
            hasNewer = true;
            break;
          } else if (latestPart < localPart) {
            break;
          }
        }
        
        if (hasNewer) {
          setUpdateAvailable(latestTag);
        }
      } catch (err) {
        console.warn("Falha ao verificar atualizações:", err);
      }
    };
    
    // Check after 2 seconds
    const timer = setTimeout(checkUpdate, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleCloseMenu = () => {
      setContextMenu(null);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", handleCloseMenu);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", handleCloseMenu);
    };
  }, []);

  // Premium Web Audio synth notification sound (Apple chime clone)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Note 1 (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Note 2 (E6 - slightly delayed harmonizer)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.02, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("AudioContext block by browser policy or unsupported:", e);
    }
  };

  const handleLogin = (
    username: string,
    role: "admin" | "finance" | "editor",
    permissions: UserProfile["permissions"]
  ) => {
    setUser({ username, role, permissions });
    setActiveTab("dashboard");
    setTimeout(playChime, 100);
  };

  const handleLogout = () => {
    setUser(null);
    setMobileMenuOpen(false);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", show: true },
    { id: "social", label: "Redes Sociais", icon: "📈", show: user.permissions.can_view_social },
    { id: "whatsapp", label: "WhatsApp IA", icon: "💬", show: user.permissions.can_manage_bots },
    { id: "email", label: "E-mail", icon: "✉️", show: true },
    { id: "finances", label: "Finanças & IA", icon: "💰", show: user.permissions.can_view_finances },
    { id: "equipment", label: "Equipamentos", icon: "📷", show: true },
    { id: "cms", label: "Clientes & Site", icon: "🎬", show: user.permissions.can_edit_portfolio },
    { id: "admin", label: "Segurança", icon: "⚙️", show: user.role === "admin" }
  ];

  const renderNavPills = () => {
    return navItems
      .filter(item => item.show)
      .map(item => (
        <button
          key={item.id}
          onClick={() => handleTabChange(item.id)}
          className={`nav-pill-item ${activeTab === item.id ? "active" : ""}`}
        >
          {item.label}
        </button>
      ));
  };

  const renderMobileNavButtons = () => {
    return navItems
      .filter(item => item.show)
      .map(item => (
        <button
          key={item.id}
          onClick={() => handleTabChange(item.id)}
          className={`nav-item ${activeTab === item.id ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ));
  };

  return (
    <div className={`app-layout theme-${theme}`}>
      {/* DESKTOP APP HEADER (Horizontal Pills control + Theme Switcher) */}
      <header className="app-header">
        <a href="#" className="header-branding" onClick={() => handleTabChange("dashboard")}>
          <span className="header-logo">catarse</span>
          <span className="header-logo-badge">| CENTRAL</span>
        </a>

        <nav className="header-nav-pill-container">
          {renderNavPills()}
        </nav>

        <div className="header-actions-right">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          <button onClick={handleLogout} className="header-logout-btn">
            Sair
          </button>
        </div>
      </header>

      {/* MOBILE HEADER BAR (Fallback for narrow screens) */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
        <span className="mobile-logo font-serif">catarse</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            style={{ width: "30px", height: "30px", fontSize: "0.85rem" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className="mobile-user-avatar">
            {user.username.split(" ").map(n => n[0]).join("")}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sidebar-header">
              <span className="mobile-logo font-serif">catarse</span>
              <button className="menu-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            
            <nav className="mobile-nav">
              {renderMobileNavButtons()}
            </nav>

            <div className="nav-footer">
              <div className="user-profile">
                <div className="user-avatar" style={{ border: "1px solid var(--accent-gold-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-gold)", fontWeight: 600, width: "36px", height: "36px", borderRadius: "50%" }}>
                  {user.username.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role" style={{ fontSize: "0.65rem", color: "var(--text-cream-dark)", textTransform: "uppercase" }}>{user.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Sair da Central
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main viewport */}
      <main className="main-content">
        {activeTab === "dashboard" && <Dashboard user={user} setActiveTab={setActiveTab} />}
        {activeTab === "social" && user.permissions.can_view_social && <SocialModule />}
        {activeTab === "whatsapp" && user.permissions.can_manage_bots && <WhatsAppModule />}
        {activeTab === "email" && <EmailModule />}
        {activeTab === "finances" && user.permissions.can_view_finances && <FinanceModule />}
        {activeTab === "equipment" && <EquipmentModule user={user} />}
        {activeTab === "cms" && user.permissions.can_edit_portfolio && <CMSModule />}
        {activeTab === "admin" && user.role === "admin" && <AdminModule />}
      </main>

      {contextMenu && (
        <div style={{
          position: "fixed",
          top: contextMenu.y,
          left: contextMenu.x,
          backgroundColor: "var(--bg-moss)",
          border: "1px solid var(--accent-gold-border)",
          borderRadius: "8px",
          padding: "4px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          zIndex: 9999,
          width: "120px"
        }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              border: "none",
              color: "var(--text-cream)",
              padding: "8px 12px",
              textAlign: "left",
              fontSize: "0.8rem",
              cursor: "pointer",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 205, 168, 0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            🔄 Atualizar
          </button>
        </div>
      )}

      {updateAvailable && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.75)",
          zIndex: 10000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel gold-glow" style={{
            width: "90%",
            maxWidth: "420px",
            padding: "2rem",
            borderRadius: "12px",
            border: "1px solid var(--accent-gold-border)",
            backgroundColor: "var(--bg-moss)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <span style={{ fontSize: "3rem" }}>🚀</span>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-gold)" }}>
              Nova Versão Disponível!
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-cream-dim)", lineHeight: 1.6 }}>
              Uma nova atualização ({updateAvailable}) está pronta para a Central da Catarse Film. Deseja baixar e instalar agora?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setUpdateAvailable(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: "0.75rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Depois
              </button>
              <button
                onClick={async () => {
                  try {
                    await openUrl("https://github.com/ojoaomotta/CatarseApp/releases/latest");
                  } catch {
                    window.open("https://github.com/ojoaomotta/CatarseApp/releases/latest", "_blank");
                  }
                  setUpdateAvailable(null);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: "0.75rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Instalar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
