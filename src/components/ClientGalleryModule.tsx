import React, { useState } from "react";

export interface PhotoItem {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  category?: string;
  createdAt?: string;
}

export interface FragmentItem {
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface ClientProjectData {
  id: number | string;
  coupleName: string;
  genre: string;
  eventDate: string;
  stage: string;
  hasFilms: boolean;
  hasPhotos: boolean;
  briefingEnabled: boolean;
  extrasEnabled: boolean;
  extrasUnlocked: boolean;
  r2VideoKey: string;
  downloadKey: string;
  posterUrl: string;
  contractUrl?: string;
  questions?: string[];
  fragments?: FragmentItem[];
  photos?: PhotoItem[];
  favoritePhotoIds?: string[];
}

interface ClientGalleryModuleProps {
  project: ClientProjectData;
  onUpdateFavorites?: (favoriteIds: string[]) => void;
  onBackToAdmin?: () => void;
  isPreviewMode?: boolean;
}

export default function ClientGalleryModule({
  project,
  onUpdateFavorites,
  onBackToAdmin,
  isPreviewMode = false,
}: ClientGalleryModuleProps) {
  // Determine initial active tab based on what's enabled
  const initialTab = project.hasFilms ? "films" : project.hasPhotos ? "photos" : "films";
  const [activeTab, setActiveTab] = useState<"films" | "photos">(initialTab);

  // Photos & Favorites state
  const [favorites, setFavorites] = useState<string[]>(project.favoritePhotoIds || []);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Share modal state
  const [sharePhoto, setSharePhoto] = useState<PhotoItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Briefing form state
  const [briefingAnswers, setBriefingAnswers] = useState<{ [key: string]: string }>({});
  const [briefingSaved, setBriefingSaved] = useState(false);

  // Categories extraction
  const allPhotos = project.photos || [];
  const categories = ["Todas", "Favoritas (❤️)", ...Array.from(new Set(allPhotos.map((p) => p.category || "Geral").filter(Boolean)))];

  // Filtered photos
  const filteredPhotos = allPhotos.filter((p) => {
    if (selectedCategory === "Favoritas (❤️)") {
      return favorites.includes(p.id);
    }
    if (selectedCategory !== "Todas") {
      return (p.category || "Geral") === selectedCategory;
    }
    return true;
  });

  const toggleFavorite = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (favorites.includes(photoId)) {
      updated = favorites.filter((id) => id !== photoId);
    } else {
      updated = [...favorites, photoId];
    }
    setFavorites(updated);
    if (onUpdateFavorites) {
      onUpdateFavorites(updated);
    }
  };

  const handleDownloadPhoto = (url: string, filename: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "catarse-foto.jpg";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadBatchFavorites = () => {
    const favPhotos = allPhotos.filter((p) => favorites.includes(p.id));
    if (favPhotos.length === 0) {
      alert("Nenhuma foto favoritada ainda. Clique no ❤️ em suas fotos preferidas!");
      return;
    }
    alert(`Iniciando o download de ${favPhotos.length} fotos favoritadas em alta resolução...`);
    favPhotos.forEach((photo, idx) => {
      setTimeout(() => {
        handleDownloadPhoto(photo.url, `catarse-favorita-${idx + 1}.jpg`);
      }, idx * 400);
    });
  };

  const handleShareClick = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSharePhoto(photo);
    setCopiedLink(false);
  };

  const handleNativeShare = async () => {
    if (!sharePhoto) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Catarse — ${sharePhoto.title}`,
          text: `Confira esta foto linda do nosso álbum com a Catarse!`,
          url: sharePhoto.url,
        });
      } catch (err) {
        console.log("Compartilhamento nativo cancelado");
      }
    } else {
      copyShareLink();
    }
  };

  const copyShareLink = () => {
    if (!sharePhoto) return;
    navigator.clipboard.writeText(sharePhoto.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!sharePhoto) return;
    const text = encodeURIComponent(
      `Olha essa foto incrível da Catarse! 📸✨\n${sharePhoto.url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Keyboard navigation for Lightbox
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === "ArrowLeft") {
      setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    } else if (e.key === "ArrowRight") {
      setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    } else if (e.key === "Escape") {
      setLightboxIndex(null);
    }
  };

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div
      style={styles.container}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="animate-fade-in"
    >
      {/* PREVIEW BAR FOR ADMIN */}
      {isPreviewMode && (
        <div style={styles.previewBar}>
          <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 600 }}>
            👁️ Modo Pré-visualização do Cliente ({project.coupleName})
          </span>
          {onBackToAdmin && (
            <button onClick={onBackToAdmin} className="btn-secondary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>
              ← Voltar ao Painel Admin
            </button>
          )}
        </div>
      )}

      {/* HEADER PORTAL CLIENTE */}
      <header style={styles.headerCard} className="glass-panel gold-glow">
        <div style={styles.headerLeft}>
          <span style={styles.brandingLogo}>catarse</span>
          <span style={styles.brandingTag}>| PORTAL EXCLUSIVO</span>
          <h1 style={styles.coupleTitle}>{project.coupleName}</h1>
          <p style={styles.subtitle}>
            {project.genre} • {project.eventDate || "Data Especial"}
          </p>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.statusBadge}>{project.stage}</span>
        </div>
      </header>

      {/* DELIVERY MODE TABS (FILMES / FOTOS) */}
      <div style={styles.tabsContainer}>
        {project.hasFilms && (
          <button
            onClick={() => setActiveTab("films")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "films" ? styles.tabBtnActive : {}),
            }}
          >
            🎬 Filme & Vídeo
          </button>
        )}

        {project.hasPhotos && (
          <button
            onClick={() => setActiveTab("photos")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "photos" ? styles.tabBtnActive : {}),
            }}
          >
            📸 Álbum de Fotos ({allPhotos.length})
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: FILMES & VÍDEOS */}
      {/* ============================================================ */}
      {activeTab === "films" && project.hasFilms && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* MAIN 4K VIDEO PLAYER */}
          <div className="glass-panel" style={styles.videoCard}>
            <h3 style={styles.sectionTitle}>Obra Principal em Alta Definição</h3>
            {project.r2VideoKey ? (
              <div style={styles.playerWrapper}>
                <video
                  src={project.r2VideoKey}
                  poster={project.posterUrl || "/wedding_scene.jpg"}
                  controls
                  controlsList="nodownload"
                  style={styles.videoElement}
                />
              </div>
            ) : (
              <div style={styles.noMediaBox}>
                <span style={{ fontSize: "2.5rem" }}>🎬</span>
                <p style={{ margin: "0.5rem 0 0", color: "var(--text-cream-dim)", fontSize: "0.85rem" }}>
                  O filme final está em fase de {project.stage.toLowerCase()}. Em breve estará disponível aqui!
                </p>
              </div>
            )}

            {/* VIDEO DOWNLOAD & CONTRACT ACTIONS */}
            <div style={styles.mediaActionsRow}>
              {project.downloadKey && (
                <button
                  onClick={() => handleDownloadPhoto(project.downloadKey, `${project.coupleName}-Filme-4K.mov`)}
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.8rem", fontSize: "0.85rem" }}
                >
                  ⏬ Baixar Filme Master 4K Original
                </button>
              )}

              {project.contractUrl && (
                <button
                  onClick={() => window.open(project.contractUrl, "_blank")}
                  className="btn-secondary"
                  style={{ padding: "0.8rem 1.5rem", fontSize: "0.85rem" }}
                >
                  📄 Ver Contrato (PDF)
                </button>
              )}
            </div>
          </div>

          {/* FRAGMENTOS OCULTOS (EXTRAS) */}
          {project.extrasEnabled && (
            <div className="glass-panel" style={styles.cardSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={styles.sectionTitle}>Fragmentos Ocultos (Cenas Extras)</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)", margin: 0 }}>
                    Cenas inéditas e momentos de bastidores registrados pela Catarse.
                  </p>
                </div>
                {!project.extrasUnlocked && (
                  <span style={styles.lockedBadge}>🔒 Bloqueado</span>
                )}
              </div>

              {!project.extrasUnlocked ? (
                <div style={styles.lockedBox}>
                  <span style={{ fontSize: "2rem" }}>🔒</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-cream-dim)" }}>
                    Os fragmentos ocultos serão liberados pela equipe da Catarse após o lançamento da obra principal.
                  </p>
                </div>
              ) : (project.fragments || []).length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-cream-dim)", textAlign: "center", padding: "1rem" }}>
                  Nenhum fragmento cadastrado ainda.
                </p>
              ) : (
                <div style={styles.fragmentsGrid}>
                  {(project.fragments || []).map((frag, idx) => (
                    <div key={idx} style={styles.fragmentCard} className="glass-panel">
                      <div style={styles.fragThumbBox}>
                        <img src={frag.thumbnailUrl || "/wedding_scene.jpg"} alt={frag.title} style={styles.fragThumb} />
                        <span style={styles.fragDuration}>{frag.duration}</span>
                      </div>
                      <div style={{ padding: "0.75rem" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-cream)" }}>{frag.title}</h4>
                        <button
                          onClick={() => window.open(frag.videoUrl, "_blank")}
                          className="btn-secondary"
                          style={{ width: "100%", marginTop: "0.5rem", padding: "0.4rem", fontSize: "0.75rem" }}
                        >
                          ▶ Assistir Fragmento
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BRIEFING INTERATIVO */}
          {project.briefingEnabled && (
            <div className="glass-panel" style={styles.cardSection}>
              <h3 style={styles.sectionTitle}>Roteiro & Briefing do Evento</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-cream-dim)", marginBottom: "1rem" }}>
                Responda às perguntas para nos orientar quanto aos momentos mais importantes.
              </p>

              {(project.questions || []).length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-cream-dim)" }}>
                  Nenhuma pergunta pendente no briefing.
                </p>
              ) : briefingSaved ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--success)", fontSize: "0.9rem" }}>
                  ✓ Suas respostas do briefing foram salvas e enviadas à equipe da Catarse!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {(project.questions || []).map((q, idx) => (
                    <div key={idx} style={styles.questionBox}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-gold)" }}>{q}</label>
                      <textarea
                        rows={2}
                        value={briefingAnswers[q] || ""}
                        onChange={(e) => setBriefingAnswers({ ...briefingAnswers, [q]: e.target.value })}
                        placeholder="Digite sua resposta..."
                        style={styles.textArea}
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setBriefingSaved(true);
                      alert("Briefing enviado com sucesso!");
                    }}
                    className="btn-primary"
                    style={{ alignSelf: "flex-end", padding: "0.7rem 1.5rem", fontSize: "0.8rem" }}
                  >
                    Enviar Respostas do Briefing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: GALERIA DE FOTOS PROFISSIONAL */}
      {/* ============================================================ */}
      {activeTab === "photos" && project.hasPhotos && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* GALERIA HEADER & BARRA DE AÇÕES */}
          <div className="glass-panel" style={styles.galleryActionBar}>
            <div style={styles.galleryStatsInfo}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-gold)" }}>
                  Álbum Fotográfico Catarse
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-cream-dim)" }}>
                  {allPhotos.length} fotos em máxima resolução • {favorites.length} favoritadas (❤️)
                </span>
              </div>
            </div>

            <div style={styles.batchButtonsGroup}>
              <button onClick={handleDownloadBatchFavorites} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.6rem 1rem" }}>
                ❤️ Baixar Fotos Favoritadas ({favorites.length})
              </button>

              {allPhotos.length > 0 && (
                <button
                  onClick={() => {
                    alert(`Iniciando o download de todas as ${allPhotos.length} fotos do álbum...`);
                    allPhotos.forEach((p, idx) => {
                      setTimeout(() => handleDownloadPhoto(p.url, `catarse-foto-${idx + 1}.jpg`), idx * 350);
                    });
                  }}
                  className="btn-primary"
                  style={{ fontSize: "0.78rem", padding: "0.6rem 1rem" }}
                >
                  ⏬ Baixar Álbum Completo (HD)
                </button>
              )}
            </div>
          </div>

          {/* FILTROS DE CATEGORIA */}
          <div style={styles.categoriesBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.catPill,
                  ...(selectedCategory === cat ? styles.catPillActive : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* PHOTO GRID */}
          {filteredPhotos.length === 0 ? (
            <div style={styles.noMediaBox}>
              <span style={{ fontSize: "2.5rem" }}>📸</span>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-cream-dim)", fontSize: "0.85rem" }}>
                {selectedCategory === "Favoritas (❤️)"
                  ? "Você ainda não marcou nenhuma foto como favorita. Clique no ❤️ em suas fotos preferidas!"
                  : "Nenhuma foto nesta categoria no momento."}
              </p>
            </div>
          ) : (
            <div style={styles.photoGrid}>
              {filteredPhotos.map((photo, idx) => {
                const isFav = favorites.includes(photo.id);
                return (
                  <div
                    key={photo.id || idx}
                    style={styles.photoCard}
                    className="glass-panel"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <div style={styles.photoImgWrapper}>
                      <img
                        src={photo.thumbUrl || photo.url}
                        alt={photo.title || "Foto Catarse"}
                        style={styles.photoImg}
                        loading="lazy"
                      />
                      <div style={styles.photoOverlay}>
                        <button
                          onClick={(e) => toggleFavorite(photo.id, e)}
                          title={isFav ? "Remover dos Favoritos" : "Favoritar Foto"}
                          style={{
                            ...styles.iconActionBtn,
                            ...(isFav ? styles.favActiveBtn : {}),
                          }}
                        >
                          {isFav ? "❤️" : "🤍"}
                        </button>

                        <button
                          onClick={(e) => handleShareClick(photo, e)}
                          title="Compartilhar"
                          style={styles.iconActionBtn}
                        >
                          🔗
                        </button>

                        <button
                          onClick={(e) => handleDownloadPhoto(photo.url, `${photo.title || "catarse"}.jpg`, e)}
                          title="Baixar em Alta Resolução"
                          style={styles.iconActionBtn}
                        >
                          ⏬
                        </button>
                      </div>
                    </div>

                    <div style={styles.photoInfoBox}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-cream)" }}>
                        {photo.title || `Foto #${idx + 1}`}
                      </span>
                      {photo.category && (
                        <span style={styles.catTag}>{photo.category}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* LIGHTBOX FULLSCREEN VIEWER */}
      {/* ============================================================ */}
      {currentLightboxPhoto && (
        <div style={styles.lightboxBackdrop} onClick={() => setLightboxIndex(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.lightboxCloseBtn} onClick={() => setLightboxIndex(null)}>
              ✕
            </button>

            {/* PREV / NEXT BUTTONS */}
            <button
              style={styles.lightboxNavPrev}
              onClick={() => setLightboxIndex(lightboxIndex! > 0 ? lightboxIndex! - 1 : filteredPhotos.length - 1)}
            >
              ❮
            </button>
            <button
              style={styles.lightboxNavNext}
              onClick={() => setLightboxIndex(lightboxIndex! < filteredPhotos.length - 1 ? lightboxIndex! + 1 : 0)}
            >
              ❯
            </button>

            <img
              src={currentLightboxPhoto.url}
              alt={currentLightboxPhoto.title}
              style={styles.lightboxImage}
            />

            <div style={styles.lightboxFooter}>
              <div>
                <h4 style={{ margin: 0, color: "var(--accent-gold)", fontSize: "1rem" }}>
                  {currentLightboxPhoto.title || `Foto #${lightboxIndex! + 1}`}
                </h4>
                <span style={{ fontSize: "0.75rem", color: "var(--text-cream-dim)" }}>
                  {currentLightboxPhoto.category || "Alta Resolução"} • Foto {lightboxIndex! + 1} de {filteredPhotos.length}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => toggleFavorite(currentLightboxPhoto.id)}
                  className="btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                >
                  {favorites.includes(currentLightboxPhoto.id) ? "❤️ Favoritada" : "🤍 Favoritar"}
                </button>

                <button
                  onClick={() => handleShareClick(currentLightboxPhoto)}
                  className="btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                >
                  🔗 Compartilhar
                </button>

                <button
                  onClick={() => handleDownloadPhoto(currentLightboxPhoto.url, `${currentLightboxPhoto.title || "foto-catarse"}.jpg`)}
                  className="btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                >
                  ⏬ Baixar Máxima Resolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SOCIAL SHARE MODAL */}
      {/* ============================================================ */}
      {sharePhoto && (
        <div style={styles.shareBackdrop} onClick={() => setSharePhoto(null)}>
          <div style={styles.shareCard} className="glass-panel gold-glow" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--accent-gold)" }}>
                Compartilhar Foto
              </h3>
              <button style={{ background: "none", border: "none", color: "var(--text-cream-dim)", cursor: "pointer", fontSize: "1.2rem" }} onClick={() => setSharePhoto(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1rem 0" }}>
              <img src={sharePhoto.thumbUrl || sharePhoto.url} alt="Share preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--accent-gold-border)" }} />
              <div>
                <strong style={{ fontSize: "0.9rem", color: "var(--text-cream)" }}>{sharePhoto.title || "Foto da Catarse"}</strong>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-cream-dim)" }}>
                  Link direto em alta resolução pronto para envio.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={handleWhatsAppShare} className="btn-primary" style={{ backgroundColor: "#25D366", color: "#fff", border: "none" }}>
                💬 Compartilhar via WhatsApp
              </button>

              <button onClick={handleNativeShare} className="btn-secondary">
                📲 Usar Compartilhamento do Sistema (iOS / Mac / Android)
              </button>

              <button onClick={copyShareLink} className="btn-secondary">
                {copiedLink ? "✓ Link Copiado!" : "📋 Copiar Link Direto da Foto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    width: "100%",
    minHeight: "100vh",
    outline: "none",
  },
  previewBar: {
    backgroundColor: "rgba(212, 205, 168, 0.12)",
    border: "1px solid var(--accent-gold-border)",
    padding: "0.6rem 1.25rem",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCard: {
    padding: "2rem",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--bg-moss)",
    border: "1px solid var(--accent-gold-border)",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  brandingLogo: {
    fontFamily: "var(--font-serif)",
    fontSize: "1.2rem",
    fontWeight: "bold",
    letterSpacing: "0.1em",
    color: "var(--accent-gold)",
  },
  brandingTag: {
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    color: "var(--text-cream-dim)",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  coupleTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--text-cream)",
    fontFamily: "var(--font-serif)",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.85rem",
    color: "var(--accent-gold)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    backgroundColor: "var(--accent-gold-dim)",
    border: "1px solid var(--accent-gold-border)",
    color: "var(--accent-gold)",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  tabsContainer: {
    display: "flex",
    gap: "0.75rem",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "0.5rem",
  },
  tabBtn: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    backgroundColor: "transparent",
    border: "1px solid transparent",
    color: "var(--text-cream-dim)",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "var(--transition-smooth)",
  },
  tabBtnActive: {
    backgroundColor: "var(--accent-gold-dim)",
    borderColor: "var(--accent-gold-border)",
    color: "var(--accent-gold)",
  },
  videoCard: {
    padding: "1.5rem",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    backgroundColor: "var(--bg-black)",
    border: "1px solid var(--glass-border)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--accent-gold)",
  },
  playerWrapper: {
    position: "relative",
    width: "100%",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#000",
    border: "1px solid var(--glass-border)",
  },
  videoElement: {
    width: "100%",
    maxHeight: "550px",
    display: "block",
    objectFit: "contain",
  },
  noMediaBox: {
    padding: "3rem 1.5rem",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: "8px",
    border: "1px dashed var(--glass-border)",
  },
  mediaActionsRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  cardSection: {
    padding: "1.5rem",
    borderRadius: "12px",
    backgroundColor: "var(--bg-black)",
    border: "1px solid var(--glass-border)",
  },
  lockedBadge: {
    fontSize: "0.7rem",
    color: "var(--danger)",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: "4px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(239,68,68,0.2)",
  },
  lockedBox: {
    textAlign: "center",
    padding: "2rem",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  fragmentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
    marginTop: "1rem",
  },
  fragmentCard: {
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid var(--glass-border)",
  },
  fragThumbBox: {
    position: "relative",
    width: "100%",
    height: "130px",
    backgroundColor: "#000",
  },
  fragThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  fragDuration: {
    position: "absolute",
    bottom: "6px",
    right: "6px",
    backgroundColor: "rgba(0,0,0,0.8)",
    color: "var(--text-cream)",
    fontSize: "0.65rem",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  questionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid var(--glass-border)",
  },
  textArea: {
    backgroundColor: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "6px",
    padding: "0.6rem",
    color: "var(--text-cream)",
    fontSize: "0.85rem",
    resize: "vertical",
    outline: "none",
  },
  galleryActionBar: {
    padding: "1.25rem 1.5rem",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--bg-black)",
    border: "1px solid var(--accent-gold-border)",
    flexWrap: "wrap",
    gap: "1rem",
  },
  galleryStatsInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  batchButtonsGroup: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  categoriesBar: {
    display: "flex",
    gap: "0.5rem",
    overflowX: "auto",
    paddingBottom: "0.5rem",
  },
  catPill: {
    padding: "6px 14px",
    borderRadius: "20px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-cream-dim)",
    fontSize: "0.78rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "var(--transition-smooth)",
  },
  catPillActive: {
    backgroundColor: "var(--accent-gold-dim)",
    borderColor: "var(--accent-gold-border)",
    color: "var(--accent-gold)",
    fontWeight: 600,
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1.25rem",
  },
  photoCard: {
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid var(--glass-border)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  photoImgWrapper: {
    position: "relative",
    width: "100%",
    height: "240px",
    backgroundColor: "#050505",
    overflow: "hidden",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  photoOverlay: {
    position: "absolute",
    top: "8px",
    right: "8px",
    display: "flex",
    gap: "6px",
    zIndex: 2,
  },
  iconActionBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  favActiveBtn: {
    backgroundColor: "rgba(239,68,68,0.25)",
    borderColor: "rgba(239,68,68,0.5)",
  },
  photoInfoBox: {
    padding: "0.75rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  catTag: {
    fontSize: "0.65rem",
    padding: "2px 8px",
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "var(--accent-gold)",
  },
  lightboxBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(8px)",
    zIndex: 99999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxContent: {
    position: "relative",
    width: "92%",
    maxWidth: "1100px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: "-40px",
    right: "0",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "1.8rem",
    cursor: "pointer",
  },
  lightboxNavPrev: {
    position: "absolute",
    left: "-50px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxNavNext: {
    position: "absolute",
    right: "-50px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    maxWidth: "100%",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: "8px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
  },
  lightboxFooter: {
    width: "100%",
    marginTop: "1rem",
    padding: "0.8rem 1.25rem",
    backgroundColor: "rgba(10,10,10,0.85)",
    border: "1px solid var(--accent-gold-border)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  shareBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    zIndex: 100000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  shareCard: {
    width: "90%",
    maxWidth: "420px",
    padding: "1.5rem",
    borderRadius: "12px",
    backgroundColor: "var(--bg-moss)",
    border: "1px solid var(--accent-gold-border)",
  },
};
