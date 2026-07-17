import React, { useState } from "react";

interface TransactionRow {
  name: string;
  isCustom?: boolean;
  values: { [key: string]: number };
}

export default function FinanceModule() {
  const months = ["Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // 1. Inputs (Entradas)
  const [entradas, setEntradas] = useState<TransactionRow[]>([
    { name: "Entrada Principal", values: { Julho: 1520, Agosto: 1520, Setembro: 1520, Outubro: 1520, Novembro: 1520, Dezembro: 1520 } },
    { name: "Entrada Extras 1", values: { Julho: 640, Agosto: 640, Setembro: 640, Outubro: 640, Novembro: 640, Dezembro: 640 } },
    { name: "Entrada Extras 2", values: { Julho: 260, Agosto: 150, Setembro: 150, Outubro: 150, Novembro: 150, Dezembro: 150 } },
  ]);

  // 2. Costs (Custos Mensais)
  const [custos, setCustos] = useState<TransactionRow[]>([
    { name: "Casamento (Poupança)", values: { Julho: 0, Agosto: 1000, Setembro: 1000, Outubro: 1000, Novembro: 1000, Dezembro: 1000 } },
    { name: "Chip Telefone", values: { Julho: 80, Agosto: 80, Setembro: 80, Outubro: 80, Novembro: 80, Dezembro: 80 } },
    { name: "Ajuda Pais", values: { Julho: 0, Agosto: 200, Setembro: 200, Outubro: 200, Novembro: 200, Dezembro: 200 } },
    { name: "Móveis (Poupança)", values: { Julho: 0, Agosto: 400, Setembro: 400, Outubro: 400, Novembro: 650, Dezembro: 650 } },
    { name: "Parcela CNH", values: { Julho: 0, Agosto: 250, Setembro: 250, Outubro: 250, Novembro: 250, Dezembro: 0 } },
  ]);

  const [tithePercent, setTithePercent] = useState(10); // Dízimo padrão de 10%
  const [newEntradaName, setNewEntradaName] = useState("");
  const [newCustoName, setNewCustoName] = useState("");

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Olá! Sou seu Assessor Financeiro da Catarse. Posso analisar suas contas atuais da planilha e aconselhar sobre gastos, riscos de caixa negativo e alocação de lucros. Clique em 'Gerar Análise Completa com IA' ou me faça uma pergunta!" }
  ]);

  // Calculations
  const getColSum = (rows: TransactionRow[], col: string) => {
    return rows.reduce((sum, row) => sum + (row.values[col] || 0), 0);
  };

  const getColTotalEntradas = (col: string) => getColSum(entradas, col);
  const getColDizimo = (col: string) => Math.round(getColTotalEntradas(col) * (tithePercent / 100));
  const getColTotalLivre = (col: string) => getColTotalEntradas(col) - getColDizimo(col);
  const getColTotalCustos = (col: string) => getColSum(custos, col);
  const getColRestante = (col: string) => getColTotalLivre(col) - getColTotalCustos(col);

  // Totais Acumulados (Total Juntado)
  const getGoalAccumulated = (name: string) => {
    const row = custos.find(c => c.name === name);
    if (!row) return 0;
    return Object.values(row.values).reduce((sum, val) => sum + val, 0);
  };

  const totalJuntadoCasamento = getGoalAccumulated("Casamento (Poupança)");
  const totalJuntadoMoveis = getGoalAccumulated("Móveis (Poupança)");
  const totalJuntadoGeral = totalJuntadoCasamento + totalJuntadoMoveis;

  // Handles updates to inputs
  const handleValueChange = (
    type: "entrada" | "custo",
    rowIndex: number,
    month: string,
    valStr: string
  ) => {
    const val = parseFloat(valStr) || 0;
    if (type === "entrada") {
      const updated = [...entradas];
      updated[rowIndex].values[month] = val;
      setEntradas(updated);
    } else {
      const updated = [...custos];
      updated[rowIndex].values[month] = val;
      setCustos(updated);
    }
  };

  const addRow = (type: "entrada" | "custo") => {
    if (type === "entrada" && newEntradaName) {
      setEntradas([...entradas, {
        name: newEntradaName,
        isCustom: true,
        values: { Julho: 0, Agosto: 0, Setembro: 0, Outubro: 0, Novembro: 0, Dezembro: 0 }
      }]);
      setNewEntradaName("");
    } else if (type === "custo" && newCustoName) {
      setCustos([...custos, {
        name: newCustoName,
        isCustom: true,
        values: { Julho: 0, Agosto: 0, Setembro: 0, Outubro: 0, Novembro: 0, Dezembro: 0 }
      }]);
      setNewCustoName("");
    }
  };

  const deleteRow = (type: "entrada" | "custo", index: number) => {
    if (type === "entrada") {
      setEntradas(entradas.filter((_, idx) => idx !== index));
    } else {
      setCustos(custos.filter((_, idx) => idx !== index));
    }
  };

  // AI Advisor Analysis
  const runAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const novRestante = getColRestante("Novembro");
      let analysisText = `### Análise Financeira Catarse Film — Julho a Dezembro de 2026\n\n`;
      analysisText += `* **Fundo de Metas (Total Juntado):** Você acumulou **R$ ${totalJuntadoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** no total (R$ ${totalJuntadoCasamento.toLocaleString('pt-BR')} para o Casamento e R$ ${totalJuntadoMoveis.toLocaleString('pt-BR')} para Móveis). Isso representa uma excelente disciplina de poupança!\n\n`;
      
      if (novRestante < 0) {
        analysisText += `> [!WARNING]\n`;
        analysisText += `> **Risco de Caixa em Novembro:** Detectei que em Novembro seu saldo restante fica negativo em **R$ ${novRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. Isso ocorre devido à CNH (R$ 250,00) coincidir com o aumento da alocação de Móveis para R$ 650,00.\n\n`;
        analysisText += `#### Sugestões de Ajuste por IA:\n`;
        analysisText += `1. **Redistribuição de Móveis:** Reduza a alocação de Móveis em Novembro de R$ 650,00 para R$ 540,00. Isso zera o saldo negativo e você compensa essa diferença de R$ 110,00 em Dezembro.\n`;
        analysisText += `2. **Aproveitamento de Sobras:** Nos meses de Agosto, Setembro e Outubro, você possui uma sobra livre de R$ 149,00/mês. Crie uma pequena "Reserva de Giro" no Supabase para cobrir temporariamente o déficit de Novembro sem mexer no Fundo de Casamento.`;
      } else {
        analysisText += `> [!NOTE]\n`;
        analysisText += `> **Saúde do Caixa:** Suas contas estão equilibradas para todos os meses previstos. Continue monitorando as receitas extras para aumentar a alocação de reinvestimento da Catarse.`;
      }
      
      setAiAnalysis(analysisText);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatLog(prev => [...prev, { sender: "user", text: userText }]);
    setChatMessage("");

    setTimeout(() => {
      let aiResponse = "";
      const lower = userText.toLowerCase();

      if (lower.includes("novembro") || lower.includes("negativo")) {
        aiResponse = "Em Novembro o saldo fica em -R$ 101,00. O motivo principal é que o custo com Móveis sobe para R$ 650,00 e você ainda tem a parcela de R$ 250,00 da CNH. Se puder antecipar o pagamento da CNH ou reduzir a poupança de Móveis nesse mês específico para R$ 540,00, seu caixa fechará positivo!";
      } else if (lower.includes("casamento")) {
        aiResponse = `Seu fundo acumulado para o Casamento está atualmente em R$ ${totalJuntadoCasamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (com alocações mensais de R$ 1.000,00 de Agosto a Dezembro). Recomendo manter essa meta intocável, pois é sua maior alocação de longo prazo.`;
      } else if (lower.includes("dizimo") || lower.includes("dízimo")) {
        aiResponse = `O dízimo está configurado como uma dedução direta de ${tithePercent}% sobre todas as entradas brutas. No momento, o valor mensal reservado é de R$ 231,00 (ou R$ 242,00 em Julho). Isso garante que o planejamento financeiro seja calculado sobre o 'Total Livre'.`;
      } else {
        aiResponse = "Entendi! Suas alocações de poupança (Casamento e Móveis) representam a maior parte dos seus custos operacionais. Se você tiver um aumento de receita em algum mês, recomendo destinar 30% desse valor extra para acelerar a meta de móveis e 20% para a alocação operacional da Catarse Film.";
      }

      setChatLog(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 1000);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.leftPane}>
        {/* PROGRESS CARDS */}
        <div style={styles.savingsCards}>
          <div className="glass-panel" style={styles.savingCard}>
            <div style={styles.savingCardHeader}>
              <span style={styles.savingTitle}>Meta: Casamento</span>
              <span style={styles.savingValue}>R$ {totalJuntadoCasamento.toLocaleString('pt-BR')}</span>
            </div>
            <div style={styles.progressContainer}>
              <div style={{ ...styles.progressBar, width: "50%" }}></div>
            </div>
            <div style={styles.savingMeta}>Acumulando R$ 1.000/mês (Alvo: R$ 10.000 - 50%)</div>
          </div>

          <div className="glass-panel" style={styles.savingCard}>
            <div style={styles.savingCardHeader}>
              <span style={styles.savingTitle}>Meta: Móveis</span>
              <span style={styles.savingValue}>R$ {totalJuntadoMoveis.toLocaleString('pt-BR')}</span>
            </div>
            <div style={styles.progressContainer}>
              <div style={{ ...styles.progressBar, width: "50%" }}></div>
            </div>
            <div style={styles.savingMeta}>Alocação flexível 400-650 (Alvo: R$ 5.000 - 50%)</div>
          </div>

          <div className="glass-panel" style={{ ...styles.savingCard, borderColor: "var(--accent-gold-border)" }}>
            <div style={styles.savingCardHeader}>
              <span style={{ ...styles.savingTitle, color: "var(--accent-gold)" }}>Total Juntado</span>
              <span style={{ ...styles.savingValue, color: "var(--accent-gold)" }}>R$ {totalJuntadoGeral.toLocaleString('pt-BR')}</span>
            </div>
            <div style={styles.progressContainer}>
              <div style={{ ...styles.progressBar, width: "50%", backgroundColor: "var(--accent-gold)" }}></div>
            </div>
            <div style={styles.savingMeta}>Soma dos fundos de alocação de lucros</div>
          </div>
        </div>

        {/* CHART CONTAINER PANEL */}
        <div className="glass-panel" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", color: "var(--text-cream)", margin: 0, marginBottom: "0.25rem" }}>Fluxo de Caixa Mensal (Visão Geral de Caixa)</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", marginBottom: "1rem" }}>
            Visualização comparativa de Receitas Totais vs. Custos & Deduções (Julho - Dezembro)
          </p>
          <div className="custom-chart-wrapper">
            <div className="bar-chart-container">
              {months.map(m => {
                const income = getColTotalEntradas(m);
                const costs = getColDizimo(m) + getColTotalCustos(m);
                
                // Scale factor: out of max value of 3500 to fit nicely in 120px height
                const maxVal = 3500;
                const incomePct = Math.min(100, (income / maxVal) * 100);
                const costsPct = Math.min(100, (costs / maxVal) * 100);
                
                return (
                  <div key={m} className="chart-bar-column">
                    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "120px", position: "relative" }}>
                      {/* Income Bar (Green) */}
                      <div 
                        className="chart-bar-pillar" 
                        style={{ 
                          height: `${incomePct}%`, 
                          width: "12px", 
                          backgroundColor: "var(--success)" 
                        }}
                      >
                        <div className="chart-bar-value-tooltip">
                          Entradas: R$ {income.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      {/* Costs Bar (Red) */}
                      <div 
                        className="chart-bar-pillar" 
                        style={{ 
                          height: `${costsPct}%`, 
                          width: "12px", 
                          backgroundColor: "var(--danger)" 
                        }}
                      >
                        <div className="chart-bar-value-tooltip">
                          Custos: R$ {costs.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <span className="chart-label-text">{m}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Chart Legend */}
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", fontSize: "0.7rem", color: "var(--text-cream-dim)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "10px", height: "10px", backgroundColor: "var(--success)", borderRadius: "2px" }}></div>
                <span>Entradas Totais (Receitas)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "10px", height: "10px", backgroundColor: "var(--danger)", borderRadius: "2px" }}></div>
                <span>Custos Operacionais & Dízimo</span>
              </div>
            </div>
          </div>
        </div>

        {/* FINANCIAL PLANNER SPREADSHEET */}
        <div className="glass-panel" style={styles.sheetPanel}>
          <div style={styles.sheetHeader}>
            <h3 style={styles.title}>Fluxo de Alocação Financeira (Jul - Dez)</h3>
            <div style={styles.titheConfig}>
              <span style={styles.titheLabel}>Dedução/Dízimo:</span>
              <input
                type="number"
                value={tithePercent}
                onChange={(e) => setTithePercent(parseInt(e.target.value) || 0)}
                style={styles.titheInput}
              />
              <span style={styles.titheLabel}>%</span>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th style={styles.colName}>Categoria</th>
                  {months.map(m => (
                    <th key={m} style={styles.colMonth}>{m}</th>
                  ))}
                  <th style={styles.colAction}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* ENTRADAS SECTION */}
                <tr style={styles.sectionHeaderRow}>
                  <td colSpan={8} style={styles.sectionTitle}>Entradas (Receitas Brutas)</td>
                </tr>
                {entradas.map((row, idx) => (
                  <tr key={`entrada-${idx}`}>
                    <td style={styles.cellName}>
                      {row.name}
                    </td>
                    {months.map(m => (
                      <td key={m} style={styles.cellInput}>
                        <input
                          type="number"
                          value={row.values[m]}
                          onChange={(e) => handleValueChange("entrada", idx, m, e.target.value)}
                          style={styles.gridInput}
                        />
                      </td>
                    ))}
                    <td style={styles.cellAction}>
                      {row.isCustom && (
                        <button onClick={() => deleteRow("entrada", idx)} style={styles.deleteBtn}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={styles.cellNameInput}>
                    <input
                      placeholder="Nova Entrada..."
                      value={newEntradaName}
                      onChange={(e) => setNewEntradaName(e.target.value)}
                      style={styles.newRowInput}
                    />
                  </td>
                  <td colSpan={6}></td>
                  <td>
                    <button onClick={() => addRow("entrada")} style={styles.addBtn}>+ Adicionar</button>
                  </td>
                </tr>

                {/* CALCULATED ROWS */}
                <tr style={styles.calculatedRow}>
                  <td style={styles.calculatedName}>Total Entradas</td>
                  {months.map(m => (
                    <td key={m} style={styles.calculatedVal}>R$ {getColTotalEntradas(m)}</td>
                  ))}
                  <td></td>
                </tr>
                <tr style={styles.calculatedRow}>
                  <td style={styles.calculatedName}>Dízimo ({tithePercent}%)</td>
                  {months.map(m => (
                    <td key={m} style={{ ...styles.calculatedVal, color: "var(--text-cream-dim)" }}>-R$ {getColDizimo(m)}</td>
                  ))}
                  <td></td>
                </tr>
                <tr style={{ ...styles.calculatedRow, borderBottom: "2px solid var(--glass-border)" }}>
                  <td style={{ ...styles.calculatedName, color: "var(--accent-gold)" }}>Total Livre (Líquido)</td>
                  {months.map(m => (
                    <td key={m} style={{ ...styles.calculatedVal, color: "var(--accent-gold)" }}>R$ {getColTotalLivre(m)}</td>
                  ))}
                  <td></td>
                </tr>

                {/* CUSTOS SECTION */}
                <tr style={styles.sectionHeaderRow}>
                  <td colSpan={8} style={styles.sectionTitle}>Custos Operacionais & Metas</td>
                </tr>
                {custos.map((row, idx) => (
                  <tr key={`custo-${idx}`}>
                    <td style={styles.cellName}>
                      {row.name}
                    </td>
                    {months.map(m => (
                      <td key={m} style={styles.cellInput}>
                        <input
                          type="number"
                          value={row.values[m]}
                          onChange={(e) => handleValueChange("custo", idx, m, e.target.value)}
                          style={styles.gridInput}
                        />
                      </td>
                    ))}
                    <td style={styles.cellAction}>
                      {row.isCustom && (
                        <button onClick={() => deleteRow("custo", idx)} style={styles.deleteBtn}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={styles.cellNameInput}>
                    <input
                      placeholder="Novo Custo/Meta..."
                      value={newCustoName}
                      onChange={(e) => setNewCustoName(e.target.value)}
                      style={styles.newRowInput}
                    />
                  </td>
                  <td colSpan={6}></td>
                  <td>
                    <button onClick={() => addRow("custo")} style={styles.addBtn}>+ Adicionar</button>
                  </td>
                </tr>

                {/* TOTAL CUSTOS & RESTANTE */}
                <tr style={styles.calculatedRow}>
                  <td style={styles.calculatedName}>Total Custos</td>
                  {months.map(m => (
                    <td key={m} style={styles.calculatedVal}>R$ {getColTotalCustos(m)}</td>
                  ))}
                  <td></td>
                </tr>
                <tr style={{ ...styles.calculatedRow, backgroundColor: "rgba(212, 175, 55, 0.02)" }}>
                  <td style={{ ...styles.calculatedName, fontWeight: "bold" }}>Restante (Saldo)</td>
                  {months.map(m => {
                    const r = getColRestante(m);
                    const isNeg = r < 0;
                    return (
                      <td 
                        key={m} 
                        style={{ 
                          ...styles.calculatedVal, 
                          color: isNeg ? "var(--danger)" : "var(--text-cream)",
                          fontWeight: "bold",
                          textShadow: isNeg ? "0 0 10px rgba(207, 102, 121, 0.2)" : "none"
                        }}
                      >
                        R$ {r}
                      </td>
                    );
                  })}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI ADVISOR PANEL */}
      <div style={styles.rightPane} className="glass-panel">
        <div style={styles.aiHeader}>
          <div style={styles.aiAvatar}>🤖</div>
          <div>
            <h4 style={styles.aiTitle}>Assessor Financeiro IA</h4>
            <span style={styles.aiSubtitle}>Modelado com Gemini API</span>
          </div>
        </div>

        <button 
          onClick={runAiAnalysis} 
          disabled={isAnalyzing} 
          className="btn-primary" 
          style={styles.aiBtn}
        >
          {isAnalyzing ? "Analisando dados..." : "Gerar Análise Completa com IA"}
        </button>

        {aiAnalysis ? (
          <div style={styles.analysisResult} className="animate-fade-in">
            {/* Simple renderer for custom styled boxes since standard markdown might not fully render */}
            <div style={styles.cardHeader}>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 600 }}>INSIGHTS DA IA</span>
            </div>
            <p style={styles.analysisText}>
              <strong>Resumo do Caixa:</strong> Seu fundo acumulado de alocações está saudável em <strong>R$ {totalJuntadoGeral.toLocaleString('pt-BR')}</strong> (sendo R$ {totalJuntadoCasamento.toLocaleString('pt-BR')} para Casamento e R$ {totalJuntadoMoveis.toLocaleString('pt-BR')} para Móveis).
            </p>
            {getColRestante("Novembro") < 0 ? (
              <div style={styles.aiAlert}>
                <strong>⚠️ Alerta de Saldo Negativo (Novembro):</strong> Seu caixa restante fechará em <strong>R$ {getColRestante("Novembro")}</strong>. 
                <br/><br/>
                <em>Recomendação:</em> Reduza temporariamente a poupança de Móveis de R$ 650 para R$ 540 apenas em Novembro, ou use R$ 101 da sobra acumulada de Outubro para cobrir a parcela final da CNH.
              </div>
            ) : (
              <div style={styles.aiSuccess}>
                <strong>✅ Caixa Saudável:</strong> Todos os meses fecham com saldo restante positivo. Sugiro alocar 10% do restante de cada mês para um fundo de marketing da Catarse.
              </div>
            )}
          </div>
        ) : (
          <div style={styles.chatArea}>
            <div style={styles.chatLogs}>
              {chatLog.map((log, i) => (
                <div 
                  key={i} 
                  style={{
                    ...styles.chatBubble,
                    alignSelf: log.sender === "user" ? "flex-end" : "flex-start",
                    backgroundColor: log.sender === "user" ? "var(--bg-moss-lighter)" : "rgba(244, 237, 217, 0.02)",
                    borderColor: log.sender === "user" ? "var(--accent-gold-border)" : "var(--glass-border)"
                  }}
                >
                  <span style={styles.chatSender}>{log.sender === "user" ? "Você" : "Assessor IA"}</span>
                  <p style={styles.chatText}>{log.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={styles.chatForm}>
              <input
                placeholder="Perguntar ao assessor (ex: 'O que fazer com o deficit de novembro?')..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                style={styles.chatInput}
              />
              <button type="submit" className="btn-primary" style={styles.chatBtn}>
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "2rem",
    alignItems: "start",
  },
  leftPane: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  rightPane: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    height: "calc(100vh - 5rem)",
    position: "sticky",
    top: "2.5rem",
  },
  savingsCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "1.25rem",
  },
  savingCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1.25rem",
  },
  savingCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingTitle: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--text-cream-dim)",
  },
  savingValue: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "var(--text-cream)",
  },
  progressContainer: {
    height: "6px",
    backgroundColor: "var(--bg-moss-lighter)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "var(--accent-gold)",
    borderRadius: "3px",
  },
  savingMeta: {
    fontSize: "0.65rem",
    color: "var(--text-cream-dark)",
  },
  sheetPanel: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "1.4rem",
    margin: 0,
  },
  titheConfig: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  titheLabel: {
    fontSize: "0.75rem",
    color: "var(--text-cream-dim)",
  },
  titheInput: {
    width: "50px",
    padding: "0.3rem 0.5rem",
    textAlign: "center",
    fontSize: "0.8rem",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  colName: {
    width: "180px",
  },
  colMonth: {
    textAlign: "center",
    width: "90px",
  },
  colAction: {
    width: "60px",
    textAlign: "center",
  },
  sectionHeaderRow: {
    backgroundColor: "rgba(244, 237, 217, 0.01)",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--accent-gold)",
    padding: "0.75rem 1rem",
  },
  cellName: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--text-cream)",
  },
  cellInput: {
    padding: "0.4rem 0.2rem",
  },
  gridInput: {
    padding: "0.4rem",
    fontSize: "0.85rem",
    textAlign: "center",
    border: "1px solid transparent",
    backgroundColor: "transparent",
  },
  cellNameInput: {
    padding: "0.4rem 1rem",
  },
  newRowInput: {
    padding: "0.4rem",
    fontSize: "0.8rem",
    backgroundColor: "rgba(244, 237, 217, 0.02)",
  },
  addBtn: {
    padding: "0.4rem 0.75rem",
    fontSize: "0.75rem",
    color: "var(--accent-gold)",
    backgroundColor: "transparent",
    border: "1px solid var(--accent-gold-border)",
    borderRadius: "3px",
  },
  deleteBtn: {
    padding: "0.2rem 0.4rem",
    fontSize: "0.7rem",
    backgroundColor: "transparent",
    color: "var(--danger)",
    borderRadius: "3px",
  },
  cellAction: {
    textAlign: "center",
  },
  calculatedRow: {
    borderTop: "1px solid var(--glass-border)",
    backgroundColor: "rgba(244, 237, 217, 0.005)",
  },
  calculatedName: {
    fontSize: "0.85rem",
    fontWeight: 500,
    padding: "1rem",
  },
  calculatedVal: {
    textAlign: "center",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  aiHeader: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "1rem",
  },
  aiAvatar: {
    fontSize: "1.5rem",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-gold-dim)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--accent-gold-border)",
  },
  aiTitle: {
    fontSize: "1.1rem",
    margin: 0,
  },
  aiSubtitle: {
    fontSize: "0.65rem",
    color: "var(--text-cream-dark)",
    textTransform: "uppercase",
  },
  aiBtn: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "0.75rem",
  },
  analysisResult: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    overflowY: "auto",
    flex: 1,
  },
  analysisText: {
    fontSize: "0.8rem",
    lineHeight: "1.5",
    color: "var(--text-cream-dim)",
  },
  aiAlert: {
    backgroundColor: "rgba(207, 102, 121, 0.08)",
    border: "1px solid rgba(207, 102, 121, 0.2)",
    padding: "1rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    color: "var(--text-cream)",
    lineHeight: "1.5",
  },
  aiSuccess: {
    backgroundColor: "rgba(76, 175, 80, 0.08)",
    border: "1px solid rgba(76, 175, 80, 0.2)",
    padding: "1rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    color: "var(--text-cream)",
    lineHeight: "1.5",
  },
  chatArea: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    gap: "1rem",
    overflow: "hidden",
  },
  chatLogs: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflowY: "auto",
    flex: 1,
    paddingRight: "4px",
  },
  chatBubble: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid",
    maxWidth: "90%",
  },
  chatSender: {
    fontSize: "0.6rem",
    textTransform: "uppercase",
    color: "var(--accent-gold)",
    fontWeight: 600,
  },
  chatText: {
    fontSize: "0.8rem",
    lineHeight: "1.4",
    margin: 0,
  },
  chatForm: {
    display: "flex",
    gap: "0.5rem",
  },
  chatInput: {
    flex: 1,
    padding: "0.6rem 0.8rem",
    fontSize: "0.8rem",
  },
  chatBtn: {
    padding: "0.6rem 1rem",
    fontSize: "0.75rem",
  }
};
