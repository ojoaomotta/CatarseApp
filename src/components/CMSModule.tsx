import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface FragmentItem {
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface ClientProject {
  id: number;
  coupleName: string;
  genre: "Catarse Film" | "Catarse Ensaios" | "Catarsinhos" | "Catarse Eventos" | "Catarse Partos";
  eventDate: string;
  stage: "Contrato" | "Captura" | "Montagem" | "Color Grading" | "Finalizado";
  briefingEnabled: boolean;
  extrasEnabled: boolean;
  r2VideoKey: string;
  downloadKey: string;
  posterUrl: string;
  username: string;
  pass: string;
  questions: string[];
  fragments: FragmentItem[];
  extrasUnlocked: boolean;
}

export default function CMSModule() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [coupleName, setCoupleName] = useState("");
  const [genre, setGenre] = useState<ClientProject["genre"]>("Catarse Film");
  const [eventDate, setEventDate] = useState("");
  const [stage, setStage] = useState<ClientProject["stage"]>("Contrato");
  const [briefingEnabled, setBriefingEnabled] = useState(false);
  const [extrasEnabled, setExtrasEnabled] = useState(false);
  const [r2VideoKey, setR2VideoKey] = useState("");
  const [downloadKey, setDownloadKey] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [pUsername, setPUsername] = useState("");
  const [pPass, setPPass] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [extrasUnlocked, setExtrasUnlocked] = useState(false);

  // New fragment fields
  const [fragTitle, setFragTitle] = useState("");
  const [fragDuration, setFragDuration] = useState("");
  const [fragThumb, setFragThumb] = useState("");
  const [fragVideo, setFragVideo] = useState("");

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro Supabase fetch:", error);
      } else if (data) {
        const mapped = data.map((c: any) => {
          // Safe JSON parser for legacy data
          const parseJson = (val: any) => {
            if (val === null || val === undefined) return [];
            if (typeof val === "string") {
              try {
                return JSON.parse(val);
              } catch {
                return [];
              }
            }
            return val;
          };

          const rawQuestions = parseJson(c.briefing_questions);
          const rawExtras = parseJson(c.extras);

          const qList = Array.isArray(rawQuestions) ? rawQuestions.filter(q => typeof q === "string") : [];
          
          const fList = Array.isArray(rawExtras)
            ? rawExtras
                .filter(f => f && typeof f === "object")
                .map((f: any) => ({
                  title: f.title || "",
                  duration: f.duration || "",
                  thumbnailUrl: f.thumb || f.thumbnailUrl || "",
                  videoUrl: f.video_url || f.videoUrl || ""
                }))
            : [];

          // Map "Finalizado / Pronto para Estreia" to "Finalizado"
          const dbStage = c.status || "Contrato";
          let stageVal: ClientProject["stage"] = "Contrato";
          if (dbStage.includes("Finalizado")) {
            stageVal = "Finalizado";
          } else if (dbStage === "Captura" || dbStage === "Montagem" || dbStage === "Color Grading" || dbStage === "Contrato") {
            stageVal = dbStage;
          }

          return {
            id: c.id,
            coupleName: c.name || "",
            genre: c.project_name || "Catarse Film",
            eventDate: c.event_date || "",
            stage: stageVal,
            briefingEnabled: c.briefing_enabled !== false,
            extrasEnabled: c.extras_enabled !== false,
            r2VideoKey: c.video_url || "",
            downloadKey: c.download_url || "",
            posterUrl: c.video_cover || "",
            username: c.username || "",
            pass: c.password || "",
            questions: qList,
            fragments: fList,
            extrasUnlocked: c.extras_unlocked || false
          };
        });
        
        setProjects(mapped);

        if (mapped.length > 0) {
          setSelectedProjectId(prev => {
            if (prev && mapped.some(p => p.id === prev)) return prev;
            return mapped[0].id;
          });
        }
      }
    } catch (err) {
      console.error("Exception loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProject && !isCreating) {
      setCoupleName(activeProject.coupleName);
      setGenre(activeProject.genre);
      setEventDate(activeProject.eventDate || "");
      setStage(activeProject.stage);
      setBriefingEnabled(activeProject.briefingEnabled);
      setExtrasEnabled(activeProject.extrasEnabled);
      setR2VideoKey(activeProject.r2VideoKey);
      setDownloadKey(activeProject.downloadKey);
      setPosterUrl(activeProject.posterUrl || "/wedding_scene.jpg");
      setPUsername(activeProject.username);
      setPPass(activeProject.pass);
      setQuestions(activeProject.questions || []);
      setFragments(activeProject.fragments || []);
      setExtrasUnlocked(activeProject.extrasUnlocked);
    }
  }, [selectedProjectId, activeProject, isCreating]);

  const handleSelectProject = (id: number) => {
    setIsCreating(false);
    setSelectedProjectId(id);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedProjectId(null);
    setCoupleName("");
    setGenre("Catarse Film");
    setEventDate("");
    setStage("Contrato");
    setBriefingEnabled(false);
    setExtrasEnabled(false);
    setR2VideoKey("");
    setDownloadKey("");
    setPosterUrl("/wedding_scene.jpg");
    setPUsername("");
    setPPass("");
    setQuestions([]);
    setFragments([]);
    setExtrasUnlocked(false);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName) return alert("Preencha o nome do casal.");

    const dbStatus = stage === "Finalizado" ? "Finalizado / Pronto para Estreia" : stage;

    const payload = {
      name: coupleName,
      project_name: genre,
      event_date: eventDate,
      status: dbStatus,
      briefing_enabled: briefingEnabled,
      extras_enabled: extrasEnabled,
      video_url: r2VideoKey,
      download_url: downloadKey,
      video_cover: posterUrl,
      username: pUsername || coupleName.toLowerCase().replace(/\s+/g, ""),
      password: pPass || "123456",
      briefing_questions: questions,
      extras: fragments.map(f => ({
        title: f.title,
        duration: f.duration,
        thumb: f.thumbnailUrl,
        video_url: f.videoUrl
      })),
      extras_unlocked: extrasUnlocked
    };

    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from("clients")
          .insert([payload])
          .select();

        if (error) {
          alert("Erro ao cadastrar no Supabase: " + error.message);
        } else {
          alert("Projeto cadastrado no Supabase com sucesso!");
          setIsCreating(false);
          await fetchProjects();
          if (data && data[0]) {
            setSelectedProjectId(data[0].id);
          }
        }
      } else if (selectedProjectId) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", selectedProjectId);

        if (error) {
          alert("Erro ao atualizar no Supabase: " + error.message);
        } else {
          alert("Projeto atualizado no Supabase com sucesso!");
          await fetchProjects();
        }
      }
    } catch (err) {
      alert("Exceção ao salvar dados no Supabase: " + err);
    }
  };

  const handleDelete = async () => {
    if (!selectedProjectId) return;
    if (confirm("Deseja realmente deletar este projeto do Supabase?")) {
      try {
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", selectedProjectId);

        if (error) {
          alert("Erro ao deletar do Supabase: " + error.message);
        } else {
          alert("Projeto removido do Supabase com sucesso!");
          setIsCreating(false);
          setSelectedProjectId(null);
          await fetchProjects();
        }
      } catch (err) {
        alert("Exceção ao deletar: " + err);
      }
    }
  };

  const handleAddQuestion = () => {
    const q = prompt("Digite a nova pergunta personalizada:");
    if (q && q.trim()) {
      setQuestions([...questions, q.trim()]);
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleAddFragment = () => {
    if (!fragTitle || !fragVideo) return alert("Título e URL de vídeo são obrigatórios para o fragmento.");
    const newFrag: FragmentItem = {
      title: fragTitle,
      duration: fragDuration || "N/A",
      thumbnailUrl: fragThumb || "/wedding_scene.jpg",
      videoUrl: fragVideo
    };
    setFragments([...fragments, newFrag]);
    setFragTitle("");
    setFragDuration("");
    setFragThumb("");
    setFragVideo("");
  };

  const handleRemoveFragment = (idx: number) => {
    setFragments(fragments.filter((_, i) => i !== idx));
  };

  const handleSaveFragments = async () => {
    if (!selectedProjectId) return;
    try {
      const { error } = await supabase
        .from("clients")
        .update({ 
          extras: fragments.map(f => ({
            title: f.title,
            duration: f.duration,
            thumb: f.thumbnailUrl,
            video_url: f.videoUrl
          })), 
          extras_unlocked: extrasUnlocked 
        })
        .eq("id", selectedProjectId);

      if (error) {
        alert("Erro ao salvar fragmentos no Supabase: " + error.message);
      } else {
        alert("Configurações de fragmentos atualizadas no Supabase com sucesso!");
        await fetchProjects();
      }
    } catch (err) {
      alert("Exceção ao salvar fragmentos: " + err);
    }
  };

  return (
    <div className="split-layout animate-fade-in">
      {/* LEFT COLUMN: Project List */}
      <aside className="split-sidebar">
        <div style={styles.sidebarHeader}>
          <strong style={styles.sidebarTitle}>Trabalhos ({projects.length})</strong>
          <button onClick={handleStartCreate} style={styles.addBtn}>
            + NOVO
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-cream-dim)", fontSize: "0.8rem" }}>
            Conectando ao Supabase...
          </p>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                className={`project-card ${selectedProjectId === p.id ? "active" : ""}`}
              >
                <strong className="project-card-title">{p.genre === "Catarse Film" ? "Valentine's Film" : p.genre}</strong>
                <span className="project-card-subtitle">{p.coupleName}</span>
                
                <div className="project-card-meta">
                  User: {p.username} &nbsp; Pass: {p.pass}
                </div>

                <span className="project-card-badge">
                  {p.stage}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* RIGHT COLUMN: Project Details/Form Editor */}
      <main className="split-detail-pane">
        <div className="back-btn-container">
          <button 
            className="back-btn" 
            onClick={() => projects.length > 0 && handleSelectProject(projects[0].id)}
          >
            ← Voltar
          </button>
          
          <h2 className="editor-title">
            {isCreating ? "Novo Trabalho" : "Editar Trabalho"}
          </h2>
          
          <span className="editor-metadata">
            {isCreating ? "NOVO REGISTRO" : `IDENTIFICADOR: ${selectedProjectId}`}
          </span>
        </div>

        <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* 1. DADOS BÁSICOS DO PROJETO */}
          <div className="form-section-card">
            <h4 className="form-section-title">1. Dados Básicos do Projeto</h4>
            
            <div className="form-input-group">
              <label className="form-input-label">Nome dos Noivos (Exibição)</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={coupleName} 
                onChange={(e) => setCoupleName(e.target.value)} 
                placeholder="Evilly e Davi"
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label">Título do Filme</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={genre} 
                onChange={(e) => setGenre(e.target.value as any)} 
                placeholder="Valentine's Film"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-grid">
              <div className="form-input-group">
                <label className="form-input-label">Data do Casamento</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="form-input-group">
                <label className="form-input-label">Etapa de Produção</label>
                <select 
                  className="form-input-control" 
                  value={stage} 
                  onChange={(e) => setStage(e.target.value as any)}
                >
                  <option value="Contrato">Contrato</option>
                  <option value="Captura">Captura</option>
                  <option value="Montagem">Montagem</option>
                  <option value="Color Grading">Color Grading</option>
                  <option value="Finalizado">Finalizado / Pronto para Estreia</option>
                </select>
              </div>
            </div>

            <div className="switches-row">
              <div 
                className="switch-box-card" 
                onClick={() => setBriefingEnabled(!briefingEnabled)}
                style={{ borderColor: briefingEnabled ? "var(--accent-gold-border)" : "rgba(234,234,234,0.06)" }}
              >
                <div className="switch-info">
                  <span className="switch-title">Briefing Habilitado</span>
                  <span className="switch-desc">Exibe botão de roteiro</span>
                </div>
                <div style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: briefingEnabled ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "var(--transition-smooth)"
                }}>
                  <div style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: briefingEnabled ? "var(--bg-black)" : "var(--text-cream)",
                    position: "absolute",
                    top: "3px",
                    left: briefingEnabled ? "19px" : "3px",
                    transition: "var(--transition-smooth)"
                  }} />
                </div>
              </div>

              <div 
                className="switch-box-card" 
                onClick={() => setExtrasEnabled(!extrasEnabled)}
                style={{ borderColor: extrasEnabled ? "var(--accent-gold-border)" : "rgba(234,234,234,0.06)" }}
              >
                <div className="switch-info">
                  <span className="switch-title">Extras Habilitados</span>
                  <span className="switch-desc">Exibe botão de fragmentos</span>
                </div>
                <div style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: extrasEnabled ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "var(--transition-smooth)"
                }}>
                  <div style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: extrasEnabled ? "var(--bg-black)" : "var(--text-cream)",
                    position: "absolute",
                    top: "3px",
                    left: extrasEnabled ? "19px" : "3px",
                    transition: "var(--transition-smooth)"
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. CREDENCIAIS DE ACESSO DO CLIENTE */}
          <div className="form-section-card">
            <h4 className="form-section-title">2. Credenciais de Acesso do Cliente</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-grid">
              <div className="form-input-group">
                <label className="form-input-label">Usuário (Código Único)</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  value={pUsername} 
                  onChange={(e) => setPUsername(e.target.value)} 
                  placeholder="evillydavi"
                />
              </div>

              <div className="form-input-group">
                <label className="form-input-label">Senha de Acesso</label>
                <input 
                  type="text" 
                  className="form-input-control" 
                  value={pPass} 
                  onChange={(e) => setPPass(e.target.value)} 
                  placeholder="Senha"
                />
              </div>
            </div>
          </div>

          {/* 3. LINKS DE TRANSMISSÃO & ARQUIVOS */}
          <div className="form-section-card">
            <h4 className="form-section-title">3. Links de Transmissão & Arquivos</h4>
            
            <div className="form-input-group">
              <label className="form-input-label">Link do Filme (4K MP4 Cloudflare R2 ou YouTube)</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={r2VideoKey} 
                onChange={(e) => setR2VideoKey(e.target.value)} 
                placeholder="https://pub-...r2.dev/valentines-film.mov"
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label">Capa da Estreia (Poster / Thumbnail)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="form-input-control" 
                  value={posterUrl} 
                  onChange={(e) => setPosterUrl(e.target.value)} 
                  placeholder="https://supabase.../poster.jpg"
                />
                <button type="button" className="select-file-btn" style={{ flexShrink: 0 }}>
                  Subir Imagem
                </button>
              </div>
              {posterUrl && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={posterUrl} alt="Poster preview" className="poster-preview" />
                </div>
              )}
            </div>

            <div className="form-input-group">
              <label className="form-input-label">Link de Download (Master Original 4K)</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={downloadKey} 
                onChange={(e) => setDownloadKey(e.target.value)} 
                placeholder="https://pub-...r2.dev/valentines-film.mov"
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label">Contrato de Serviço (Arquivo PDF)</label>
              <button type="button" className="select-file-btn" style={{ alignSelf: "flex-start" }}>
                Selecionar PDF
              </button>
            </div>
          </div>

          {/* 4. PERGUNTAS CUSTOMIZADAS DO BRIEFING */}
          <div className="form-section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
              <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(234,234,234,0.6)", textTransform: "uppercase", margin: 0 }}>
                4. Perguntas Customizadas do Briefing
              </h4>
              <button type="button" onClick={handleAddQuestion} className="select-file-btn" style={{ padding: "4px 10px" }}>
                + Adicionar Pergunta
              </button>
            </div>

            {questions.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-cream-dim)", fontSize: "0.75rem", fontStyle: "italic", padding: "1.5rem 0" }}>
                Nenhuma pergunta definida para este briefing.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                {questions.map((q, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)", border: "1px solid rgba(234,234,234,0.05)", padding: "0.6rem 0.75rem", borderRadius: "4px" }}>
                    <span style={{ fontSize: "0.8rem" }}>{q}</span>
                    <button type="button" onClick={() => handleRemoveQuestion(idx)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAVE & DELETE MAIN PROJECT BUTTONS */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
            <button type="button" onClick={handleSaveProject} className="btn-primary" style={{ flex: 1, height: "45px", fontSize: "0.8rem" }}>
              Salvar Projeto
            </button>
            {!isCreating && selectedProjectId && (
              <button type="button" onClick={handleDelete} className="btn-secondary" style={{ border: "1px solid var(--danger)", color: "var(--danger)", padding: "0 1.5rem" }}>
                Deletar
              </button>
            )}
          </div>

          {/* EXTRAS SECTION: FRAGMENTOS OCULTOS (EXTRAS) */}
          <div className="form-section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
              <div>
                <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(234,234,234,0.6)", textTransform: "uppercase", margin: 0 }}>
                  Fragmentos Ocultos (Extras)
                </h4>
                <span style={{ fontSize: "0.65rem", color: "var(--text-cream-dim)" }}>Cenas extras liberadas após aprovação</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "var(--text-cream-dim)" }}>ACESSO LIBERADO:</span>
                <div 
                  onClick={() => setExtrasUnlocked(!extrasUnlocked)} 
                  style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: extrasUnlocked ? "var(--success)" : "rgba(255,255,255,0.1)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  <div style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "var(--text-cream)",
                    position: "absolute",
                    top: "3px",
                    left: extrasUnlocked ? "19px" : "3px",
                    transition: "var(--transition-smooth)"
                  }} />
                </div>
              </div>
            </div>

            {/* NEW FRAGMENT BOX */}
            <div style={{ backgroundColor: "rgba(0,0,0,0.1)", border: "1px solid rgba(234,234,234,0.05)", borderRadius: "6px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Novo Fragmento
              </span>
              <input 
                type="text" 
                className="form-input-control" 
                placeholder="Título (Ex: Cenas Cortadas - Pista)" 
                value={fragTitle}
                onChange={(e) => setFragTitle(e.target.value)}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <input 
                  type="text" 
                  className="form-input-control" 
                  placeholder="Duração (Ex: 3m 45s)" 
                  value={fragDuration}
                  onChange={(e) => setFragDuration(e.target.value)}
                />
                <input 
                  type="text" 
                  className="form-input-control" 
                  placeholder="URL Thumbnail (.jpg)" 
                  value={fragThumb}
                  onChange={(e) => setFragThumb(e.target.value)}
                />
              </div>
              <input 
                type="text" 
                className="form-input-control" 
                placeholder="URL do Vídeo (4K R2 ou Vimeo)" 
                value={fragVideo}
                onChange={(e) => setFragVideo(e.target.value)}
              />
              <button type="button" onClick={handleAddFragment} className="select-file-btn" style={{ padding: "8px", width: "100%" }}>
                + Adicionar à Lista
              </button>
            </div>

            {/* FRAGMENTS LIST */}
            {fragments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {fragments.map((f, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(234,234,234,0.05)", padding: "0.6rem 0.75rem", borderRadius: "4px" }}>
                    <div>
                      <strong style={{ fontSize: "0.8rem", color: "var(--text-cream)" }}>{f.title}</strong>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-cream-dim)", marginLeft: "0.5rem" }}>({f.duration})</span>
                      <div style={{ fontSize: "0.6rem", color: "var(--accent-gold)", marginTop: "0.1rem" }}>{f.videoUrl}</div>
                    </div>
                    <button type="button" onClick={() => handleRemoveFragment(idx)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              type="button" 
              onClick={handleSaveFragments}
              className="btn-primary" 
              style={{ height: "40px", fontSize: "0.7rem", marginTop: "0.5rem" }}
            >
              Salvar Configurações de Fragmentos
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebarHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--glass-border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  sidebarTitle: {
    fontSize: "0.85rem",
    color: "var(--text-cream-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  addBtn: {
    padding: "4px 10px",
    backgroundColor: "transparent",
    border: "1px solid var(--accent-gold-border)",
    borderRadius: "4px",
    color: "var(--accent-gold)",
    fontSize: "0.65rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "var(--transition-smooth)",
  }
};
