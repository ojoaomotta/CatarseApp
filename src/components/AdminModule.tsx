import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "finance" | "editor";
  permissions: {
    can_view_social: boolean;
    can_view_finances: boolean;
    can_manage_bots: boolean;
    can_edit_portfolio: boolean;
  };
}

export default function AdminModule() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 1, name: "João Lucas", email: "admin@catarse.com", password: "admin123", role: "admin", permissions: { can_view_social: true, can_view_finances: true, can_manage_bots: true, can_edit_portfolio: true } },
    { id: 2, name: "Ana Clara", email: "financeiro@catarse.com", password: "financeiro123", role: "finance", permissions: { can_view_social: false, can_view_finances: true, can_manage_bots: false, can_edit_portfolio: false } },
    { id: 3, name: "Pedro Santos", email: "editor@catarse.com", password: "editor123", role: "editor", permissions: { can_view_social: false, can_view_finances: false, can_manage_bots: false, can_edit_portfolio: true } },
  ]);

  const [usingRealDb, setUsingRealDb] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | number | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "finance" | "editor">("editor");
  const [newPerms, setNewPerms] = useState({
    can_view_social: true,
    can_view_finances: false,
    can_manage_bots: false,
    can_edit_portfolio: true
  });

  // Apple & Notification triggers states
  const [soundOnLead, setSoundOnLead] = useState(true);
  const [soundOnR2, setSoundOnR2] = useState(true);
  const [soundOnAlert, setSoundOnAlert] = useState(false);

  // SQL code for user to run
  const sqlCode = `CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'finance', 'editor')),
  can_view_social boolean DEFAULT false,
  can_view_finances boolean DEFAULT false,
  can_manage_bots boolean DEFAULT false,
  can_edit_portfolio boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Anon" ON app_users FOR ALL USING (true) WITH CHECK (true);

INSERT INTO app_users (name, email, password, role, can_view_social, can_view_finances, can_manage_bots, can_edit_portfolio)
VALUES 
('João Lucas', 'admin@catarse.com', 'admin123', 'admin', true, true, true, true),
('Ana Clara', 'financeiro@catarse.com', 'financeiro123', 'finance', false, true, false, false),
('Pedro Santos', 'editor@catarse.com', 'editor123', 'editor', false, false, false, true)
ON CONFLICT (email) DO NOTHING;`;

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Table app_users not available yet, using mock users.");
        setUsingRealDb(false);
      } else if (data) {
        const mapped = data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password || "123456",
          role: u.role,
          permissions: {
            can_view_social: u.can_view_social !== false,
            can_view_finances: u.can_view_finances !== false,
            can_manage_bots: u.can_manage_bots !== false,
            can_edit_portfolio: u.can_edit_portfolio !== false
          }
        }));
        setMembers(mapped);
        setUsingRealDb(true);
      }
    } catch (err) {
      console.error("Exception loading database users:", err);
      setUsingRealDb(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Play modern Apple chime synthesiser
  const playAppleChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Pitch A5 (880Hz) to E6 (1320Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.02, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("AudioContext block:", e);
    }
  };

  const handleRoleChange = (role: "admin" | "finance" | "editor") => {
    setNewRole(role);
    if (role === "admin") {
      setNewPerms({ can_view_social: true, can_view_finances: true, can_manage_bots: true, can_edit_portfolio: true });
    } else if (role === "finance") {
      setNewPerms({ can_view_social: false, can_view_finances: true, can_manage_bots: false, can_edit_portfolio: false });
    } else {
      setNewPerms({ can_view_social: false, can_view_finances: false, can_manage_bots: false, can_edit_portfolio: true });
    }
  };

  const handleTogglePerm = (key: keyof typeof newPerms) => {
    setNewPerms({ ...newPerms, [key]: !newPerms[key] });
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      alert("Por favor, preencha nome, e-mail e senha.");
      return;
    }

    const payload = {
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      can_view_social: newPerms.can_view_social,
      can_view_finances: newPerms.can_view_finances,
      can_manage_bots: newPerms.can_manage_bots,
      can_edit_portfolio: newPerms.can_edit_portfolio
    };

    if (usingRealDb) {
      try {
        if (editingMemberId !== null) {
          const { error } = await supabase
            .from("app_users")
            .update(payload)
            .eq("id", editingMemberId);

          if (error) {
            alert("Erro ao atualizar no Supabase: " + error.message);
          } else {
            alert("Usuário atualizado no Supabase com sucesso!");
            await fetchUsers();
          }
        } else {
          const { error } = await supabase
            .from("app_users")
            .insert([payload]);

          if (error) {
            alert("Erro ao criar no Supabase: " + error.message);
          } else {
            alert("Usuário adicionado ao Supabase com sucesso!");
            await fetchUsers();
          }
        }
      } catch (err) {
        alert("Exceção ao salvar dados no Supabase: " + err);
      }
    } else {
      // Local fallback
      if (editingMemberId !== null) {
        setMembers(members.map(m => m.id === editingMemberId ? {
          ...m,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          permissions: newPerms
        } : m));
        alert("Usuário atualizado com sucesso (Modo Local)!");
      } else {
        const newMember: TeamMember = {
          id: Date.now(),
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          permissions: newPerms
        };
        setMembers([...members, newMember]);
        alert("Usuário adicionado com sucesso (Modo Local)!");
      }
    }

    // Reset Form
    setEditingMemberId(null);
    setIsAdding(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("editor");
    setNewPerms({ can_view_social: false, can_view_finances: false, can_manage_bots: false, can_edit_portfolio: true });
    playAppleChime();
  };

  const handleStartEdit = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setNewName(member.name);
    setNewEmail(member.email);
    setNewPassword(member.password || "");
    setNewRole(member.role);
    setNewPerms(member.permissions);
    setIsAdding(true);
    playAppleChime();
  };

  const deleteMember = async (id: string | number) => {
    if (id === 1 || id === "1") {
      alert("O administrador principal não pode ser excluído.");
      return;
    }
    if (confirm("Deseja realmente remover este usuário da central?")) {
      if (usingRealDb) {
        try {
          const { error } = await supabase
            .from("app_users")
            .delete()
            .eq("id", id);

          if (error) {
            alert("Erro ao excluir no Supabase: " + error.message);
          } else {
            alert("Usuário removido do Supabase!");
            await fetchUsers();
          }
        } catch (err) {
          alert("Exceção ao deletar: " + err);
        }
      } else {
        setMembers(members.filter(m => m.id !== id));
      }
      playAppleChime();
    }
  };

  const handleCancelForm = () => {
    setEditingMemberId(null);
    setIsAdding(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("editor");
    setNewPerms({ can_view_social: false, can_view_finances: false, can_manage_bots: false, can_edit_portfolio: true });
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* DB STATE NOTIFICATION BANNER */}
      {!usingRealDb && (
        <div style={styles.dbWarningCard} className="glass-panel">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <strong style={{ color: "var(--accent-gold)", fontSize: "0.9rem" }}>
              ⚠️ Tabela 'app_users' pendente no Supabase
            </strong>
            <p style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", margin: 0, lineHeight: "1.4" }}>
              A central está rodando em **modo local** para controle de usuários. Para habilitar o login dinâmico e sincronização de permissões reais pelo mesmo banco do Supabase, crie a tabela no seu painel.
            </p>
          </div>
          <button onClick={handleCopySql} className="btn-primary" style={styles.copyBtn}>
            {sqlCopied ? "✓ Copiado!" : "Copiar Script SQL 📋"}
          </button>
        </div>
      )}

      {usingRealDb && (
        <div style={styles.dbSuccessCard} className="glass-panel">
          <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: 600 }}>
            ● CONECTADO AO SUPABASE: Tabela 'app_users' sincronizada em tempo real!
          </span>
        </div>
      )}

      {/* 1. USER AND PERMISSIONS RBAC PANEL */}
      <div className="glass-panel" style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.title}>Controle de Acessos & Usuários (RBAC)</h2>
          <button 
            onClick={() => isAdding ? handleCancelForm() : setIsAdding(true)} 
            className="btn-primary"
            style={styles.addBtn}
          >
            {isAdding ? "Fechar Painel" : "👤 Convidar Usuário"}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSaveMember} style={styles.addForm} className="animate-fade-in">
            <h3 style={styles.formTitle}>
              {editingMemberId !== null ? "Editar Usuário e Permissões" : "Novo Convite de Acesso"}
            </h3>
            
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nome Completo</label>
                <input 
                  placeholder="Ex: Clara Ribeiro" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mail institucional</label>
                <input 
                  placeholder="clara@catarse.com" 
                  type="email"
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Senha de Acesso</label>
                <input 
                  placeholder="Senha" 
                  type="text"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Cargo / Papel Base</label>
                <select 
                  value={newRole} 
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                >
                  <option value="editor">Editor de Vídeo</option>
                  <option value="finance">Diretor Financeiro</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>
            </div>

            <div style={styles.permsSection}>
              <h4 style={styles.permsTitle}>Permissões Granulares (Customizadas)</h4>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={newPerms.can_view_social} 
                    onChange={() => handleTogglePerm("can_view_social")} 
                    style={styles.checkbox}
                  />
                  Administrar Redes Sociais (YouTube / Instagram)
                </label>

                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={newPerms.can_view_finances} 
                    onChange={() => handleTogglePerm("can_view_finances")} 
                    style={styles.checkbox}
                  />
                  Visualizar e Editar Fluxo Financeiro & Metas
                </label>

                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={newPerms.can_manage_bots} 
                    onChange={() => handleTogglePerm("can_manage_bots")} 
                    style={styles.checkbox}
                  />
                  Gerenciar e Configurar Bots de WhatsApp IA
                </label>

                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={newPerms.can_edit_portfolio} 
                    onChange={() => handleTogglePerm("can_edit_portfolio")} 
                    style={styles.checkbox}
                  />
                  Adicionar/Editar Portfólio (Cinemateca)
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button type="submit" className="btn-primary">
                {editingMemberId !== null ? "Salvar Usuário" : "Salvar no Supabase"}
              </button>
              <button type="button" onClick={handleCancelForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div style={styles.tableWrapper} className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Senha</th>
                <th>Função</th>
                <th>Permissões Ativas</th>
                <th style={{ textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.email}</td>
                  <td><code style={{ fontSize: "0.75rem" }}>{member.password}</code></td>
                  <td>
                    <span style={styles.roleBadge} className="tracking-wide">{member.role}</span>
                  </td>
                  <td>
                    <div style={styles.permsList}>
                      {member.permissions.can_view_social && <span style={styles.permBadge}>Mídias Sociais</span>}
                      {member.permissions.can_view_finances && <span style={styles.permBadge}>Financeiro</span>}
                      {member.permissions.can_manage_bots && <span style={styles.permBadge}>Bots IA</span>}
                      {member.permissions.can_edit_portfolio && <span style={styles.permBadge}>Cinemateca</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => handleStartEdit(member)}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.65rem", marginRight: "0.5rem" }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => deleteMember(member.id)} 
                      style={{
                        ...styles.deleteBtn,
                        opacity: (member.id === 1 || member.id === "1") ? 0.3 : 1,
                        cursor: (member.id === 1 || member.id === "1") ? "not-allowed" : "pointer"
                      }}
                      disabled={member.id === 1 || member.id === "1"}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. APPLE CONFIGURATIONS AND MODERN NOTIFICATION SOUNDS PANEL */}
      <div className="glass-panel" style={styles.panel}>
        <h3 style={{ fontSize: "1.2rem", color: "var(--accent-gold)", marginBottom: "0.25rem" }}>
          Configurações Apple, Safari & Sons de Alerta
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", marginBottom: "1.5rem" }}>
          Ajustes técnicos para visualização de vídeos 4K em dispositivos Apple e configuração de sons da central.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="form-grid">
          
          {/* CORS Configuration */}
          <div style={{ border: "1px solid rgba(234, 234, 234, 0.06)", backgroundColor: "#050505", borderRadius: "6px", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "var(--accent-gold)", textTransform: "uppercase", display: "block", marginBottom: "0.75rem" }}>
              CORS Policy (Cloudflare R2 para Safari/iOS)
            </span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-cream-dim)", lineHeight: "1.4", marginBottom: "0.75rem" }}>
              Dispositivos Apple exigem suporte a solicitações HTTP Range para fazer o buffer e tocar mídias .mov ou .mp4 em 4K. Cole estes headers nas configurações de bucket do Cloudflare R2:
            </p>
            <pre style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--accent-gold)", backgroundColor: "rgba(0,0,0,0.4)", padding: "0.5rem", borderRadius: "4px", overflowX: "auto" }}>
{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: Range
Access-Control-Expose-Headers: Content-Range, Content-Length`}
            </pre>
          </div>

          {/* Sound Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "var(--text-cream-dim)", textTransform: "uppercase" }}>
              Alertas Sonoros Internos
            </span>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Notificar novos Leads (WhatsApp)</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-cream-dim)" }}>Toca chime moderno ao receber nova mensagem</div>
              </div>
              <div 
                onClick={() => setSoundOnLead(!soundOnLead)}
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: soundOnLead ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "var(--transition-smooth)"
                }}
              >
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--bg-black)", position: "absolute", top: "3px", left: soundOnLead ? "19px" : "3px", transition: "var(--transition-smooth)" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Conclusão de Uploads R2</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-cream-dim)" }}>Disparar som ao finalizar o processamento de vídeo</div>
              </div>
              <div 
                onClick={() => setSoundOnR2(!soundOnR2)}
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: soundOnR2 ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "var(--transition-smooth)"
                }}
              >
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--bg-black)", position: "absolute", top: "3px", left: soundOnR2 ? "19px" : "3px", transition: "var(--transition-smooth)" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Alertas de Caixa Financeiro</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-cream-dim)" }}>Alertar com sinalizadores acústicos sobre caixa negativo</div>
              </div>
              <div 
                onClick={() => setSoundOnAlert(!soundOnAlert)}
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: soundOnAlert ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "var(--transition-smooth)"
                }}
              >
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--bg-black)", position: "absolute", top: "3px", left: soundOnAlert ? "19px" : "3px", transition: "var(--transition-smooth)" }} />
              </div>
            </div>

            <button 
              type="button" 
              onClick={playAppleChime}
              className="select-file-btn" 
              style={{ width: "100%", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}
            >
              🔔 Testar Som da Central (Apple Chime)
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  dbWarningCard: {
    padding: "1.25rem",
    borderLeft: "4px solid var(--accent-gold)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1.5rem",
    backgroundColor: "rgba(212, 175, 55, 0.03)",
  },
  dbSuccessCard: {
    padding: "1rem 1.25rem",
    borderLeft: "4px solid var(--success)",
    backgroundColor: "rgba(46, 125, 50, 0.03)",
  },
  copyBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.75rem",
    flexShrink: 0,
  },
  panel: {
    padding: "2rem",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "1rem",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.4rem",
    color: "var(--text-cream)",
    margin: 0,
  },
  addBtn: {
    padding: "8px 16px",
    fontSize: "0.75rem",
    margin: 0,
  },
  addForm: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--glass-border)",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  formTitle: {
    fontSize: "0.95rem",
    color: "var(--accent-gold)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.65rem",
    fontWeight: "bold",
    color: "var(--text-cream-dim)",
    textTransform: "uppercase",
  },
  permsSection: {
    borderTop: "1px solid rgba(234, 234, 234, 0.05)",
    paddingTop: "1rem",
  },
  permsTitle: {
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: "var(--text-cream-dim)",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "0.75rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  tableWrapper: {
    marginTop: "1rem",
  },
  roleBadge: {
    backgroundColor: "var(--accent-gold-dim)",
    color: "var(--accent-gold)",
    fontSize: "0.6rem",
    fontWeight: "bold",
    padding: "3px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
    border: "1px solid var(--accent-gold-border)",
  },
  permsList: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  permBadge: {
    backgroundColor: "rgba(234, 234, 234, 0.04)",
    border: "1px solid var(--glass-border)",
    fontSize: "0.6rem",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "var(--text-cream-dim)",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "var(--danger)",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "0.65rem",
    fontWeight: "bold",
    transition: "var(--transition-smooth)",
  }
};
