import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

interface Equipment {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: "Disponível" | "Em Uso" | "Manutenção";
  created_at: string;
}

interface EquipmentLog {
  id: string;
  equipment_id: string;
  equipment_name: string;
  action: "Saída" | "Entrada";
  user_name: string;
  notes: string;
  created_at: string;
}

interface UserProfile {
  username: string;
  role: "admin" | "finance" | "editor";
}

interface EquipmentModuleProps {
  user: UserProfile;
}

export default function EquipmentModule({ user }: EquipmentModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"inventory" | "checkout" | "checkin" | "logs">("inventory");
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");

  // Selection states for check-out/check-in
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [movementNotes, setMovementNotes] = useState("");

  // Create Equipment form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Câmera");
  const [newItemSerial, setNewItemSerial] = useState("");

  // Load Inventory & Logs
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: equipData, error: equipError } = await supabase
        .from("equipment")
        .select("*")
        .order("name", { ascending: true });

      if (equipError) throw equipError;
      setEquipmentList(equipData || []);

      const { data: logData, error: logError } = await supabase
        .from("equipment_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logError) throw logError;
      setLogs(logData || []);
    } catch (e: any) {
      console.error("Erro ao carregar dados de equipamentos:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle equipment registration (Admin only)
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const { error } = await supabase.from("equipment").insert([
        {
          name: newItemName,
          category: newItemCategory,
          serial_number: newItemSerial,
          status: "Disponível",
        },
      ]);

      if (error) throw error;
      setNewItemName("");
      setNewItemSerial("");
      setShowAddForm(false);
      await loadData();
    } catch (e: any) {
      alert("Erro ao cadastrar equipamento: " + e.message);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Perform Check-out (Retirada)
  const handleCheckOut = async () => {
    if (selectedItemIds.length === 0) return;

    try {
      setLoading(true);
      // 1. Update status to 'Em Uso' for all selected items
      const { error: updateError } = await supabase
        .from("equipment")
        .update({ status: "Em Uso" })
        .in("id", selectedItemIds);

      if (updateError) throw updateError;

      // 2. Insert log entries for each
      const logEntries = selectedItemIds.map((id) => {
        const item = equipmentList.find((e) => e.id === id);
        return {
          equipment_id: id,
          equipment_name: item?.name || "Equipamento Desconhecido",
          action: "Saída",
          user_name: user.username,
          notes: movementNotes.trim() || "Saída para gravação",
        };
      });

      const { error: logError } = await supabase.from("equipment_logs").insert(logEntries);
      if (logError) throw logError;

      setSelectedItemIds([]);
      setMovementNotes("");
      setActiveSubTab("inventory");
      await loadData();
    } catch (e: any) {
      alert("Erro ao registrar saída: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Perform Check-in (Devolução)
  const handleCheckIn = async () => {
    if (selectedItemIds.length === 0) return;

    try {
      setLoading(true);
      // 1. Update status to 'Disponível' for all selected items
      const { error: updateError } = await supabase
        .from("equipment")
        .update({ status: "Disponível" })
        .in("id", selectedItemIds);

      if (updateError) throw updateError;

      // 2. Insert log entries for each
      const logEntries = selectedItemIds.map((id) => {
        const item = equipmentList.find((e) => e.id === id);
        return {
          equipment_id: id,
          equipment_name: item?.name || "Equipamento Desconhecido",
          action: "Entrada",
          user_name: user.username,
          notes: movementNotes.trim() || "Retornado e guardado",
        };
      });

      const { error: logError } = await supabase.from("equipment_logs").insert(logEntries);
      if (logError) throw logError;

      setSelectedItemIds([]);
      setMovementNotes("");
      setActiveSubTab("inventory");
      await loadData();
    } catch (e: any) {
      alert("Erro ao registrar devolução: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Change Sub-tab and clear selections
  const changeSubTab = (tab: "inventory" | "checkout" | "checkin" | "logs") => {
    setActiveSubTab(tab);
    setSelectedItemIds([]);
    setMovementNotes("");
  };

  // Filters
  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.serial_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "Todos" || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ["Todas", "Câmera", "Lente", "Áudio", "Iluminação", "Acessório", "Outros"];

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Equipamentos</h2>
          <p style={styles.subtitle}>Gestão de inventário e controle de retirada para gravações</p>
        </div>
        <div style={styles.tabsRow}>
          <button onClick={() => changeSubTab("inventory")} className={`social-subtab-btn ${activeSubTab === "inventory" ? "active" : ""}`}>
            📋 Inventário
          </button>
          <button onClick={() => changeSubTab("checkout")} className={`social-subtab-btn ${activeSubTab === "checkout" ? "active" : ""}`}>
            📤 Retirar (Check-out)
          </button>
          <button onClick={() => changeSubTab("checkin")} className={`social-subtab-btn ${activeSubTab === "checkin" ? "active" : ""}`}>
            📥 Devolver (Check-in)
          </button>
          <button onClick={() => changeSubTab("logs")} className={`social-subtab-btn ${activeSubTab === "logs" ? "active" : ""}`}>
            ⏱️ Histórico
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {loading && <div style={{ color: "var(--accent-gold)", textAlign: "center", padding: "2rem" }}>Aguarde, carregando...</div>}

        {/* 1. TAB: INVENTORY */}
        {activeSubTab === "inventory" && !loading && (
          <div className="animate-fade-in">
            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="Pesquisar por nome ou serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.inputSearch}
              />
              <div style={styles.selectWrapper}>
                <label style={styles.selectLabel}>Categoria</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.select}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={styles.selectWrapper}>
                <label style={styles.selectLabel}>Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={styles.select}>
                  <option value="Todos">Todos</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Em Uso">Em Uso</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
              </div>
              {user.role === "admin" && (
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary" style={{ padding: "0.6rem 1.2rem", fontSize: "0.78rem" }}>
                  {showAddForm ? "Cancelar" : "+ Novo Item"}
                </button>
              )}
            </div>

            {/* Add Equipment Form (Admin only) */}
            {showAddForm && (
              <form onSubmit={handleAddEquipment} className="animate-fade-in" style={styles.addForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nome do Equipamento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Câmera Sony FX3"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoria</label>
                  <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} style={styles.formInput}>
                    {categories.filter((c) => c !== "Todas").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nº de Série (Serial)</label>
                  <input
                    type="text"
                    placeholder="Ex: S/N: 2983719"
                    value={newItemSerial}
                    onChange={(e) => setNewItemSerial(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: "flex-end", height: "40px", padding: "0 1.5rem" }}>
                  Adicionar Equipamento
                </button>
              </form>
            )}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeader}>
                    <th style={styles.th}>Equipamento</th>
                    <th style={styles.th}>Categoria</th>
                    <th style={styles.th}>Nº de Série</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-cream-dim)" }}>
                        Nenhum equipamento cadastrado ou correspondente aos filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredEquipment.map((item) => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600, color: "var(--text-cream)" }}>{item.name}</td>
                        <td style={styles.td}>{item.category}</td>
                        <td style={{ ...styles.td, color: "var(--text-cream-dark)" }}>{item.serial_number || "—"}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusTag,
                            backgroundColor:
                              item.status === "Disponível" ? "rgba(109, 187, 138, 0.15)" :
                              item.status === "Em Uso" ? "rgba(212, 205, 168, 0.15)" : "rgba(224, 107, 107, 0.15)",
                            color:
                              item.status === "Disponível" ? "#6dbb8a" :
                              item.status === "Em Uso" ? "var(--accent-gold)" : "#e06b6b"
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TAB: CHECK-OUT */}
        {activeSubTab === "checkout" && !loading && (
          <div className="animate-fade-in" style={styles.columnsLayout}>
            {/* List to Select */}
            <div style={styles.leftColumn}>
              <h3 style={styles.sectionTitle}>Selecione os equipamentos para retirada:</h3>
              <div style={styles.gridSelect}>
                {equipmentList.filter((e) => e.status === "Disponível").length === 0 ? (
                  <p style={{ color: "var(--text-cream-dim)", fontSize: "0.82rem" }}>Não há equipamentos "Disponíveis" no momento.</p>
                ) : (
                  equipmentList
                    .filter((e) => e.status === "Disponível")
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelect(item.id)}
                        style={{
                          ...styles.selectCard,
                          borderColor: selectedItemIds.includes(item.id) ? "var(--accent-gold)" : "var(--glass-border)",
                          backgroundColor: selectedItemIds.includes(item.id) ? "rgba(212,205,168,0.06)" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-cream)" }}>{item.name}</span>
                          <input type="checkbox" checked={selectedItemIds.includes(item.id)} readOnly style={styles.checkbox} />
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-cream-dim)" }}>{item.category} • {item.serial_number || "Sem Serial"}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Form details */}
            <div style={styles.rightColumn}>
              <div className="glass-panel gold-glow" style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--accent-gold)" }}>Resumo do Registro de Saída</h4>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", display: "block" }}>Operador:</span>
                  <strong style={{ fontSize: "0.85rem" }}>{user.username}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", display: "block" }}>Itens Selecionados:</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--text-cream)" }}>{selectedItemIds.length} equipamentos</strong>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Destino/Observações</label>
                  <textarea
                    placeholder="Ex: Gravação do casamento de Julia e Arthur em Ilhabela."
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                    style={{ ...styles.formInput, height: "80px", resize: "none" }}
                  />
                </div>
                <button onClick={handleCheckOut} disabled={selectedItemIds.length === 0} className="btn-primary" style={{ width: "100%", padding: "0.75rem" }}>
                  Confirmar Retirada (Check-out) 📤
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: CHECK-IN */}
        {activeSubTab === "checkin" && !loading && (
          <div className="animate-fade-in" style={styles.columnsLayout}>
            {/* List to Select */}
            <div style={styles.leftColumn}>
              <h3 style={styles.sectionTitle}>Selecione os equipamentos para devolução:</h3>
              <div style={styles.gridSelect}>
                {equipmentList.filter((e) => e.status === "Em Uso").length === 0 ? (
                  <p style={{ color: "var(--text-cream-dim)", fontSize: "0.82rem" }}>Não há equipamentos "Em Uso" no momento.</p>
                ) : (
                  equipmentList
                    .filter((e) => e.status === "Em Uso")
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelect(item.id)}
                        style={{
                          ...styles.selectCard,
                          borderColor: selectedItemIds.includes(item.id) ? "var(--accent-gold)" : "var(--glass-border)",
                          backgroundColor: selectedItemIds.includes(item.id) ? "rgba(212,205,168,0.06)" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-cream)" }}>{item.name}</span>
                          <input type="checkbox" checked={selectedItemIds.includes(item.id)} readOnly style={styles.checkbox} />
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-cream-dim)" }}>{item.category} • {item.serial_number || "Sem Serial"}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Form details */}
            <div style={styles.rightColumn}>
              <div className="glass-panel gold-glow" style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--accent-gold)" }}>Resumo do Registro de Retorno</h4>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", display: "block" }}>Operador:</span>
                  <strong style={{ fontSize: "0.85rem" }}>{user.username}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", display: "block" }}>Itens Selecionados:</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--text-cream)" }}>{selectedItemIds.length} equipamentos</strong>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Estado dos Equipamentos / Obs.</label>
                  <textarea
                    placeholder="Ex: Tudo retornado em perfeito estado e limpo."
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                    style={{ ...styles.formInput, height: "80px", resize: "none" }}
                  />
                </div>
                <button onClick={handleCheckIn} disabled={selectedItemIds.length === 0} className="btn-primary" style={{ width: "100%", padding: "0.75rem" }}>
                  Confirmar Devolução (Check-in) 📥
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB: LOGS */}
        {activeSubTab === "logs" && !loading && (
          <div className="animate-fade-in">
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeader}>
                    <th style={styles.th}>Equipamento</th>
                    <th style={styles.th}>Movimento</th>
                    <th style={styles.th}>Usuário</th>
                    <th style={styles.th}>Data/Hora</th>
                    <th style={styles.th}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-cream-dim)" }}>
                        Nenhuma movimentação registrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600, color: "var(--text-cream)" }}>{log.equipment_name}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusTag,
                            backgroundColor: log.action === "Saída" ? "rgba(212, 205, 168, 0.15)" : "rgba(109, 187, 138, 0.15)",
                            color: log.action === "Saída" ? "var(--accent-gold)" : "#6dbb8a"
                          }}>
                            {log.action === "Saída" ? "📤 Saída" : "📥 Entrada"}
                          </span>
                        </td>
                        <td style={styles.td}>{log.user_name}</td>
                        <td style={styles.td}>
                          {new Date(log.created_at).toLocaleDateString("pt-BR")} às {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ ...styles.td, color: "var(--text-cream-dim)" }}>{log.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1.5rem" },
  title: { fontSize: "1.6rem", margin: 0, fontWeight: 600, color: "var(--text-cream)" },
  subtitle: { fontSize: "0.8rem", color: "var(--text-cream-dim)", margin: "0.2rem 0 0" },
  tabsRow: { display: "flex", gap: "0.5rem" },
  filterBar: { display: "flex", gap: "1rem", flexWrap: "wrap" as const, alignItems: "flex-end", marginBottom: "1.5rem" },
  inputSearch: { flex: 1, minWidth: "200px", backgroundColor: "var(--bg-moss)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "0.6rem 0.85rem", color: "var(--text-cream)", fontSize: "0.8rem", outline: "none" },
  selectWrapper: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  selectLabel: { fontSize: "0.65rem", color: "var(--text-cream-dark)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 },
  select: { backgroundColor: "var(--bg-moss)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "0.6rem 0.85rem", color: "var(--text-cream)", fontSize: "0.8rem", outline: "none", width: "140px" },
  addForm: { display: "flex", gap: "1rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem", flexWrap: "wrap" as const },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1, minWidth: "150px" },
  formLabel: { fontSize: "0.75rem", color: "var(--text-cream-dim)" },
  formInput: { backgroundColor: "var(--bg-moss)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "0.6rem 0.85rem", color: "var(--text-cream)", fontSize: "0.8rem", outline: "none" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  trHeader: { borderBottom: "1px solid var(--glass-border)" },
  th: { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", color: "var(--text-cream-dark)", textTransform: "uppercase", fontWeight: 700 },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" },
  td: { padding: "1rem", fontSize: "0.8rem", color: "var(--text-cream-dim)" },
  statusTag: { padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const },
  columnsLayout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "1rem" },
  rightColumn: {},
  sectionTitle: { margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--text-cream)" },
  gridSelect: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", maxHeight: "400px", overflowY: "auto" as const, paddingRight: "0.5rem" },
  selectCard: { border: "1px solid", borderRadius: "10px", padding: "1rem", cursor: "pointer", transition: "all 0.15s" },
  checkbox: { accentColor: "var(--accent-gold)", width: "15px", height: "15px" },
};
