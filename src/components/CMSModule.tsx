import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ClientGalleryModule, { PhotoItem } from "./ClientGalleryModule";

interface FragmentItem {
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface ClientProject {
  id: number;
  coupleName: string;
  genre: string;
  eventDate: string;
  stage: "Contrato" | "Captura" | "Montagem" | "Color Grading" | "Finalizado";
  briefingEnabled: boolean;
  extrasEnabled: boolean;
  hasFilms: boolean;
  hasPhotos: boolean;
  photos: PhotoItem[];
  favoritePhotoIds: string[];
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
  const [genre, setGenre] = useState<string>("Catarse Film");
  const [eventDate, setEventDate] = useState("");
  const [stage, setStage] = useState<ClientProject["stage"]>("Contrato");
  
  // Delivery mode toggles
  const [hasFilms, setHasFilms] = useState(true);
  const [hasPhotos, setHasPhotos] = useState(true);

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

  // Photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [favoritePhotoIds, setFavoritePhotoIds] = useState<string[]>([]);
  
  // Single photo fields
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCategory, setPhotoCategory] = useState("Cerimônia");

  // New fragment fields
  const [fragTitle, setFragTitle] = useState("");
  const [fragDuration, setFragDuration] = useState("");
  const [fragThumb, setFragThumb] = useState("");
  const [fragVideo, setFragVideo] = useState("");

  // Modals state
  const [showR2Modal, setShowR2Modal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadingBatch, setUploadingBatch] = useState(false);

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
          const rawPhotos = parseJson(c.photos);
          const rawFavs = parseJson(c.favorite_photo_ids);

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

          const pList = Array.isArray(rawPhotos)
            ? rawPhotos
                .filter(p => p && typeof p === "object")
                .map((p: any, idx: number) => ({
                  id: p.id || `photo-${idx}-${Date.now()}`,
                  url: p.url || "",
                  thumbUrl: p.thumbUrl || p.thumb || p.url || "",
                  title: p.title || `Foto #${idx + 1}`,
                  category: p.category || "Geral",
                  createdAt: p.createdAt || p.created_at || ""
                }))
            : [];

          const favList = Array.isArray(rawFavs) ? rawFavs.filter(id => typeof id === "string") : [];

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
            hasFilms: c.has_films !== false,
            hasPhotos: c.has_photos !== false,
            photos: pList,
            favoritePhotoIds: favList,
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
      setHasFilms(activeProject.hasFilms !== false);
      setHasPhotos(activeProject.hasPhotos !== false);
      setBriefingEnabled(activeProject.briefingEnabled);
      setExtrasEnabled(activeProject.extrasEnabled);
      setR2VideoKey(activeProject.r2VideoKey);
      setDownloadKey(activeProject.downloadKey);
      setPosterUrl(activeProject.posterUrl || "/wedding_scene.jpg");
      setPUsername(activeProject.username);
      setPPass(activeProject.pass);
      setQuestions(activeProject.questions || []);
      setFragments(activeProject.fragments || []);
      setPhotos(activeProject.photos || []);
      setFavoritePhotoIds(activeProject.favoritePhotoIds || []);
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
    setHasFilms(true);
    setHasPhotos(true);
    setBriefingEnabled(false);
    setExtrasEnabled(false);
    setR2VideoKey("");
    setDownloadKey("");
    setPosterUrl("/wedding_scene.jpg");
    setPUsername("");
    setPPass("");
    setQuestions([]);
    setFragments([]);
    setPhotos([]);
    setFavoritePhotoIds([]);
    setExtrasUnlocked(false);
  };

  const handleSaveProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!coupleName) return alert("Preencha o nome do cliente / casal.");

    const dbStatus = stage === "Finalizado" ? "Finalizado / Pronto para Estreia" : stage;

    const payload = {
      name: coupleName,
      project_name: genre,
      event_date: eventDate,
      status: dbStatus,
      briefing_enabled: briefingEnabled,
      extras_enabled: extrasEnabled,
      has_films: hasFilms,
      has_photos: hasPhotos,
      photos: photos,
      favorite_photo_ids: favoritePhotoIds,
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
          alert("Projeto cadastrado com sucesso!");
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
          alert("Projeto atualizado com sucesso!");
          await fetchProjects();
        }
      }
    } catch (err) {
      alert("Exceção ao salvar dados: " + err);
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
          alert("Erro ao deletar: " + error.message);
        } else {
          alert("Projeto removido com sucesso!");
          setIsCreating(false);
          setSelectedProjectId(null);
          await fetchProjects();
        }
      } catch (err) {
        alert("Exceção ao deletar: " + err);
      }
    }
  };

  // Photo handlers
  const handleAddSinglePhoto = () => {
    if (!photoUrl) return alert("Informe a URL da foto em alta resolução.");
    const newPhoto: PhotoItem = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: photoUrl,
      thumbUrl: photoUrl,
      title: photoTitle || `Foto #${photos.length + 1}`,
      category: photoCategory || "Geral",
      createdAt: new Date().toISOString()
    };
    setPhotos([...photos, newPhoto]);
    setPhotoUrl("");
    setPhotoTitle("");
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  const handleBatchPhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingBatch(true);
    const newItems: PhotoItem[] = [];

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        newItems.push({
          id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          url: dataUrl,
          thumbUrl: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          category: photoCategory || "Geral",
          createdAt: new Date().toISOString()
        });

        if (newItems.length === files.length) {
          setPhotos(prev => [...prev, ...newItems]);
          setUploadingBatch(false);
          alert(`${newItems.length} foto(s) adicionada(s) à galeria com sucesso! Clique em "Salvar Projeto" para persistir no banco.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Question & Fragment handlers
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
                <strong className="project-card-title">{p.genre}</strong>
                <span className="project-card-subtitle">{p.coupleName}</span>
                
                <div style={{ display: "flex", gap: "0.4rem", margin: "0.3rem 0" }}>
                  {p.hasFilms !== false && <span style={styles.tagBadge}>🎬 Vídeo</span>}
                  {p.hasPhotos !== false && <span style={styles.tagBadge}>📸 Fotos ({(p.photos || []).length})</span>}
                </div>

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
        <div className="back-btn-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              className="back-btn" 
              onClick={() => projects.length > 0 && handleSelectProject(projects[0].id)}
            >
              ← Voltar
            </button>
            <div>
              <h2 className="editor-title" style={{ margin: 0 }}>
                {isCreating ? "Novo Trabalho" : "Editar Trabalho"}
              </h2>
              <span className="editor-metadata">
                {isCreating ? "NOVO REGISTRO" : `IDENTIFICADOR: ${selectedProjectId}`}
              </span>
            </div>
          </div>

          {!isCreating && selectedProjectId && (
            <button
              onClick={() => setShowPreviewModal(true)}
              className="btn-secondary"
              style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", color: "var(--accent-gold)", borderColor: "var(--accent-gold-border)" }}
            >
              👁️ Visualizar como Cliente
            </button>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* 1. DADOS BÁSICOS DO PROJETO */}
          <div className="form-section-card">
            <h4 className="form-section-title">1. Dados Básicos do Projeto</h4>
            
            <div className="form-input-group">
              <label className="form-input-label">Nome do Cliente / Casal (Exibição)</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={coupleName} 
                onChange={(e) => setCoupleName(e.target.value)} 
                placeholder="Evilly e Davi / Empresa XYZ / Ensaio Gestante"
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label">Tipo de Evento / Título</label>
              <input 
                type="text" 
                className="form-input-control" 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)} 
                placeholder="Catarse Film, Catarse Ensaios, Catarsinhos, Catarse Eventos..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-grid">
              <div className="form-input-group">
                <label className="form-input-label">Data do Evento</label>
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

            {/* SELEÇÃO DO MODO DE ENTREGA (VÍDEO / FOTOS / AMBOS) */}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(234,234,234,0.05)" }}>
              <label className="form-input-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                MODALIDADES DE ENTREGA DO CLIENTE
              </label>
              <div className="switches-row">
                <div 
                  className="switch-box-card" 
                  onClick={() => setHasFilms(!hasFilms)}
                  style={{ borderColor: hasFilms ? "var(--accent-gold-border)" : "rgba(234,234,234,0.06)" }}
                >
                  <div className="switch-info">
                    <span className="switch-title">🎬 Filmes (Vídeos)</span>
                    <span className="switch-desc">Player 4K, Trailer & Briefing</span>
                  </div>
                  <div style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: hasFilms ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "var(--transition-smooth)"
                  }}>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: hasFilms ? "var(--bg-black)" : "var(--text-cream)",
                      position: "absolute",
                      top: "3px",
                      left: hasFilms ? "19px" : "3px",
                      transition: "var(--transition-smooth)"
                    }} />
                  </div>
                </div>

                <div 
                  className="switch-box-card" 
                  onClick={() => setHasPhotos(!hasPhotos)}
                  style={{ borderColor: hasPhotos ? "var(--accent-gold-border)" : "rgba(234,234,234,0.06)" }}
                >
                  <div className="switch-info">
                    <span className="switch-title">📸 Fotos (Álbum HD)</span>
                    <span className="switch-desc">Galeria, Favoritos & Download</span>
                  </div>
                  <div style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: hasPhotos ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "var(--transition-smooth)"
                  }}>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: hasPhotos ? "var(--bg-black)" : "var(--text-cream)",
                      position: "absolute",
                      top: "3px",
                      left: hasPhotos ? "19px" : "3px",
                      transition: "var(--transition-smooth)"
                    }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="switches-row" style={{ marginTop: "0.75rem" }}>
              <div 
                className="switch-box-card" 
                onClick={() => setBriefingEnabled(!briefingEnabled)}
                style={{ borderColor: briefingEnabled ? "var(--accent-gold-border)" : "rgba(234,234,234,0.06)" }}
              >
                <div className="switch-info">
                  <span className="switch-title">Briefing Habilitado</span>
                  <span className="switch-desc">Exibe questionário de roteiro</span>
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
                <label className="form-input-label">Usuário (Código Único de Login)</label>
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

          {/* 3. GALERIA DE FOTOS (SE HABILITADO) */}
          {hasPhotos && (
            <div className="form-section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-gold)", textTransform: "uppercase", margin: 0 }}>
                    3. Galeria de Fotos em Alta Resolução ({photos.length} Fotos)
                  </h4>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-cream-dim)" }}>
                    Faça upload direto em lote pelo navegador ou via automação Cloudflare R2
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowR2Modal(true)}
                  className="select-file-btn"
                  style={{ padding: "4px 10px", fontSize: "0.7rem", color: "var(--accent-gold)", borderColor: "var(--accent-gold-border)" }}
                >
                  ⚡ Automação R2 Mac
                </button>
              </div>

              {/* UPLOADER EM LOTE DIRETO NO NAVEGADOR */}
              <div style={{ backgroundColor: "rgba(0,0,0,0.2)", border: "2px dashed var(--accent-gold-border)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", marginTop: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📂</span>
                <h5 style={{ margin: "0.5rem 0 0.2rem", color: "var(--text-cream)", fontSize: "0.9rem" }}>
                  Arraste ou Selecione Fotos em Lote
                </h5>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-cream-dim)", marginBottom: "1rem" }}>
                  Selecione dezenas ou centenas de imagens (.jpg, .png, .webp) para enviar de uma vez só!
                </p>

                <label className="btn-primary" style={{ display: "inline-block", padding: "0.6rem 1.25rem", cursor: "pointer", fontSize: "0.8rem" }}>
                  {uploadingBatch ? "Carregando Fotos..." : "📁 Selecionar Várias Fotos"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBatchPhotoFiles}
                    style={{ display: "none" }}
                    disabled={uploadingBatch}
                  />
                </label>
              </div>

              {/* UPLOAD MANUAL DE FOTO ÚNICA POR URL */}
              <div style={{ backgroundColor: "rgba(0,0,0,0.1)", border: "1px solid rgba(234,234,234,0.05)", borderRadius: "6px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  + Adicionar Foto por URL Direta
                </span>
                
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                  <input 
                    type="text" 
                    className="form-input-control" 
                    placeholder="URL da Imagem em Alta Resolução (Ex: https://pub-...r2.dev/foto1.jpg)" 
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <select
                    className="form-input-control"
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                  >
                    <option value="Cerimônia">Cerimônia</option>
                    <option value="Recepção">Recepção</option>
                    <option value="Ensaio">Ensaio</option>
                    <option value="Making Of">Making Of</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input 
                    type="text" 
                    className="form-input-control" 
                    placeholder="Título / Nome da Foto (Ex: Foto 001)" 
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSinglePhoto} className="select-file-btn" style={{ padding: "0 1.25rem" }}>
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* LISTA E PREVIEW DAS FOTOS */}
              {photos.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)" }}>
                      Fotos no Álbum ({photos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Deseja realmente remover TODAS as fotos da galeria?")) setPhotos([]);
                      }}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      🗑️ Limpar Galeria
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.75rem", maxHeight: "250px", overflowY: "auto", padding: "0.5rem", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
                    {photos.map((p, idx) => (
                      <div key={p.id || idx} style={{ position: "relative", width: "100%", height: "90px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
                        <img src={p.thumbUrl || p.url} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(p.id)}
                          style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.7)", border: "none", color: "var(--danger)", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", fontSize: "0.7rem" }}
                        >
                          ✕
                        </button>
                        <span style={{ position: "absolute", bottom: "2px", left: "2px", backgroundColor: "rgba(0,0,0,0.7)", color: "var(--text-cream)", fontSize: "0.6rem", padding: "1px 4px", borderRadius: "2px", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. LINKS DE TRANSMISSÃO & VÍDEOS (SE HABILITADO) */}
          {hasFilms && (
            <div className="form-section-card">
              <h4 className="form-section-title">4. Links de Transmissão & Vídeos 4K</h4>
              
              <div className="form-input-group">
                <label className="form-input-label">Link do Filme (4K MP4 Cloudflare R2 ou Vimeo)</label>
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
            </div>
          )}

          {/* 5. PERGUNTAS CUSTOMIZADAS DO BRIEFING */}
          {briefingEnabled && (
            <div className="form-section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(234,234,234,0.05)", paddingBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(234,234,234,0.6)", textTransform: "uppercase", margin: 0 }}>
                  5. Perguntas Customizadas do Briefing
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
          )}

          {/* SAVE & DELETE MAIN PROJECT BUTTONS */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
            <button type="button" onClick={() => handleSaveProject()} className="btn-primary" style={{ flex: 1, height: "45px", fontSize: "0.85rem" }}>
              💾 Salvar Projeto
            </button>
            {!isCreating && selectedProjectId && (
              <button type="button" onClick={handleDelete} className="btn-secondary" style={{ border: "1px solid var(--danger)", color: "var(--danger)", padding: "0 1.5rem" }}>
                Deletar
              </button>
            )}
          </div>

          {/* EXTRAS SECTION: FRAGMENTOS OCULTOS */}
          {extrasEnabled && (
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
            </div>
          )}
        </form>
      </main>

      {/* R2 MAC AUTOMATION MODAL */}
      {showR2Modal && (
        <div style={styles.modalBackdrop} onClick={() => setShowR2Modal(false)}>
          <div style={styles.modalContent} className="glass-panel gold-glow" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--accent-gold)" }}>
                ⚡ Automação de Upload R2 no Mac
              </h3>
              <button style={{ background: "none", border: "none", color: "var(--text-cream-dim)", cursor: "pointer", fontSize: "1.2rem" }} onClick={() => setShowR2Modal(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-cream-dim)", lineHeight: 1.5, marginTop: "0.5rem" }}>
              Para enviar pastas completas com centenas de fotos em máxima resolução diretamente ao <strong>Cloudflare R2</strong> e atualizar este cliente automaticamente sem colar link por link:
            </p>

            <div style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--accent-gold)", border: "1px solid var(--accent-gold-border)", whiteSpace: "pre-wrap" }}>
              {`# Execute o script automatizado no seu Mac:
cd ~/Desktop/Catarse\\ App/scripts
python3 catarse_r2_uploader.py --client "${pUsername || "usuario_cliente"}" --folder "/Caminho/Para/Sua/Pasta/De/Fotos"`}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button onClick={() => setShowR2Modal(false)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT PORTAL PREVIEW MODAL */}
      {showPreviewModal && activeProject && (
        <div style={styles.modalBackdrop}>
          <div style={{ width: "95%", height: "92vh", backgroundColor: "var(--bg-black)", borderRadius: "12px", border: "1px solid var(--accent-gold-border)", padding: "1.5rem", overflowY: "auto" }}>
            <ClientGalleryModule
              project={{
                id: activeProject.id,
                coupleName: coupleName || activeProject.coupleName,
                genre: genre || activeProject.genre,
                eventDate: eventDate || activeProject.eventDate,
                stage: stage || activeProject.stage,
                hasFilms: hasFilms,
                hasPhotos: hasPhotos,
                briefingEnabled: briefingEnabled,
                extrasEnabled: extrasEnabled,
                extrasUnlocked: extrasUnlocked,
                r2VideoKey: r2VideoKey,
                downloadKey: downloadKey,
                posterUrl: posterUrl,
                questions: questions,
                fragments: fragments,
                photos: photos,
                favoritePhotoIds: favoritePhotoIds,
              }}
              isPreviewMode={true}
              onBackToAdmin={() => setShowPreviewModal(false)}
            />
          </div>
        </div>
      )}
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
  },
  tagBadge: {
    fontSize: "0.6rem",
    padding: "1px 6px",
    borderRadius: "4px",
    backgroundColor: "var(--accent-gold-dim)",
    color: "var(--accent-gold)",
    border: "1px solid var(--accent-gold-border)",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(6px)",
    zIndex: 99999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: "520px",
    padding: "1.75rem",
    borderRadius: "12px",
    backgroundColor: "var(--bg-moss)",
    border: "1px solid var(--accent-gold-border)",
  },
};
