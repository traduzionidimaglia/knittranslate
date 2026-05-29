import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabase";

const LANGUAGES = [
  { code: "italiano", label: "🇮🇹 Italiano" },
  { code: "spagnolo", label: "🇪🇸 Spagnolo" },
];

const ESEMPIO_EN = `SECTION 7 - Wavy Border
Row 1 (RS): Using MC, k3, yo, k12, slm, *(yo twice,
k2tog) 8 times, yo twice, sk2p, yo twice, (k2tog, yo twice)
8 times, slm, k1, slm; repeat from * 11 more times, (yo
twice, k2tog) 8 times, yo twice, sk2p, yo twice, (k2tog, yo
twice) 8 times, slm, k12, yo, sl3 wyif. 733 sts.`;

const ESEMPIO_IT = `SEZIONE 7 - Bordo Ondulato
Ferro 1 (DL): Usando MC, 3dir, gettato, 12dir, passare marcapunti, *(gettato due volte, 2assdir) 8 volte, gettato due volte, accav doppia, gettato due volte, (2assdir, gettato due volte) 8 volte, passare marcapunti, 1dir, passare marcapunti; ripetere da * altre 11 volte, (gettato due volte, 2assdir) 8 volte, gettato due volte, accav doppia, gettato due volte, (2assdir, gettato due volte) 8 volte, passare marcapunti, 12dir, gettato, passare 3 m con il filo davanti. 733 m.`;

const PIANI = [
  {
    id: "single",
    nome: "Singolo",
    prezzo: "€4,50",
    prezzoUnitario: "€4,50 / pattern",
    crediti: 1,
    descrizione: "1 pattern tradotto",
    highlight: false,
  },
  {
    id: "pack3",
    nome: "Pacchetto 3",
    prezzo: "€11,49",
    prezzoUnitario: "€3,83 / pattern",
    crediti: 3,
    descrizione: "3 pattern tradotti",
    risparmio: "Risparmi €2,01",
    highlight: true,
  },
  {
    id: "pack10",
    nome: "Pacchetto 10",
    prezzo: "€29,90",
    prezzoUnitario: "€2,99 / pattern",
    crediti: 10,
    descrizione: "10 pattern tradotti",
    risparmio: "Risparmi €15,10",
    highlight: false,
  },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [crediti, setCrediti] = useState(0);
  const [authMode, setAuthMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [confirmMessage, setConfirmMessage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("prezzi");
  const [pianoSelezionato, setPianoSelezionato] = useState(null);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("italiano");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) caricaCrediti(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) caricaCrediti(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const caricaCrediti = async (userId) => {
    const { data } = await supabase
      .from("user_translations")
      .select("traduzioni_effettuate")
      .eq("user_id", userId)
      .single();
    if (data) setCrediti(data.traduzioni_effettuate);
  };

  const scalaCreditoETraduci = async () => {
    const { data } = await supabase
      .from("user_translations")
      .select("id, traduzioni_effettuate")
      .eq("user_id", user.id)
      .single();
    if (data && data.traduzioni_effettuate > 0) {
      await supabase
        .from("user_translations")
        .update({
          traduzioni_effettuate: data.traduzioni_effettuate - 1,
          data_ultimo_utilizzo: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      setCrediti(data.traduzioni_effettuate - 1);
      return true;
    }
    return false;
  };

  const loginEmail = async () => {
    setAuthLoading(true);
    setAuthError("");
    setConfirmMessage(false);
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError("Email o password errati. Riprova.");
      else { setShowModal(false); setModalStep("prezzi"); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else { setConfirmMessage(true); setEmail(""); setPassword(""); }
    }
    setAuthLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCrediti(0);
    setOutput("");
  };

  const handleTraduciClick = () => {
    if (!input.trim()) return;
    if (!user || crediti <= 0) {
      setModalStep("prezzi");
      setShowModal(true);
      return;
    }
    eseguiTraduzione();
  };

  const eseguiTraduzione = async () => {
    setLoading(true);
    setOutput(""); setError("");
    const ok = await scalaCreditoETraduci();
    if (!ok) {
      setModalStep("prezzi");
      setShowModal(true);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, language: selectedLang }),
      });
      const data = await response.json();
      if (data.error) setError("Errore: " + data.error);
      else setOutput(data.translation || "");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const vediEsempio = () => {
    setInput(ESEMPIO_EN);
    setOutput(""); setError("");
    setLoading(true);
    setTimeout(() => { setOutput(ESEMPIO_IT); setLoading(false); }, 600);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selezionaPiano = (piano) => {
    setPianoSelezionato(piano);
    if (!user) {
      setAuthMode("signup");
      setModalStep("auth");
    } else {
      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pianoId: piano.id, userId: user.id, userEmail: user.email })
      })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(d => {
          console.log('Risposta checkout:', d);
          if (d.url) {
            window.location.href = d.url;
          } else {
            alert('Errore: ' + (d.error || 'nessun URL ricevuto'));
          }
        })
        .catch(e => alert('Errore checkout: ' + e.message));
    }
  };

  return (
    <div className="app-container">

      {/* MODAL OVERLAY */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)",
          zIndex: 1000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: "1.25rem", padding: "2rem",
            maxWidth: "500px", width: "100%", position: "relative",
            boxShadow: "0 25px 60px rgb(0 0 0 / 0.3)"
          }}>
            <button onClick={() => { setShowModal(false); setConfirmMessage(false); setAuthError(""); }} style={{
              position: "absolute", top: "1rem", right: "1.25rem",
              background: "none", border: "none", fontSize: "1.25rem",
              cursor: "pointer", color: "#94a3b8", lineHeight: 1
            }}>✕</button>

            {/* STEP 1 — PREZZI */}
            {modalStep === "prezzi" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "2rem" }}>🧶</span>
                  <h2 style={{ margin: "0.5rem 0 0.4rem", fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                    Traduci il tuo pattern
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                    Terminologia verificata da una traduttrice professionista.<br />
                    Scegli il piano più adatto a te.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {PIANI.map((piano) => (
                    <button key={piano.id} onClick={() => selezionaPiano(piano)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "1rem 1.25rem", borderRadius: "0.875rem", cursor: "pointer",
                      border: piano.highlight ? "2px solid #4f46e5" : "2px solid #e2e8f0",
                      background: piano.highlight ? "#eef2ff" : "white",
                      transition: "all 0.15s ease", position: "relative", textAlign: "left"
                    }}>
                      {piano.highlight && (
                        <span style={{
                          position: "absolute", top: "-11px", left: "50%",
                          transform: "translateX(-50%)", whiteSpace: "nowrap",
                          background: "#4f46e5", color: "white",
                          fontSize: "0.62rem", fontWeight: "700",
                          padding: "0.2rem 0.75rem", borderRadius: "9999px",
                          letterSpacing: "0.06em", textTransform: "uppercase"
                        }}>⭐ Più scelto</span>
                      )}
                      <div>
                        <p style={{ margin: "0 0 0.2rem", fontWeight: "700", color: "#0f172a", fontSize: "0.95rem" }}>
                          {piano.nome}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                          {piano.descrizione}
                          {piano.risparmio && (
                            <span style={{ color: "#16a34a", fontWeight: "600", marginLeft: "0.4rem" }}>
                              — {piano.risparmio}
                            </span>
                          )}
                        </p>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", color: "#94a3b8" }}>
                          {piano.prezzoUnitario}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "1rem" }}>
                        <span style={{
                          fontWeight: "800", fontSize: "1.15rem",
                          color: piano.highlight ? "#4f46e5" : "#0f172a"
                        }}>
                          {piano.prezzo}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", textAlign: "center" }}>
                  {!user ? (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Hai già un account?{" "}
                      <button onClick={() => { setAuthMode("login"); setModalStep("auth"); }} style={{
                        color: "#4f46e5", background: "none", border: "none",
                        cursor: "pointer", fontWeight: "600", fontSize: "0.8rem"
                      }}>Accedi</button>
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Traduzioni disponibili: <strong>{crediti}</strong>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2 — AUTH */}
            {modalStep === "auth" && (
              <>
                <button onClick={() => { setModalStep("prezzi"); setAuthError(""); setConfirmMessage(false); }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#64748b", fontSize: "0.82rem", marginBottom: "1rem",
                  display: "flex", alignItems: "center", gap: "0.25rem", padding: 0
                }}>
                  ← Torna ai piani
                </button>

                <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "1.75rem" }}>🧶</span>
                  <h2 style={{ margin: "0.4rem 0 0.3rem", fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                    {authMode === "login" ? "Accedi" : "Crea il tuo account"}
                  </h2>
                  {pianoSelezionato && (
                    <div style={{
                      display: "inline-block", background: "#eef2ff",
                      borderRadius: "9999px", padding: "0.3rem 0.9rem",
                      fontSize: "0.78rem", color: "#4f46e5", fontWeight: "600", marginTop: "0.3rem"
                    }}>
                      Piano selezionato: {pianoSelezionato.nome} — {pianoSelezionato.prezzo}
                    </div>
                  )}
                </div>

                {confirmMessage ? (
                  <div style={{
                    background: "#edf4ed", border: "1px solid #b8d4b8",
                    borderRadius: "0.875rem", padding: "1.5rem", textAlign: "center"
                  }}>
                    <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📧</p>
                    <p style={{ margin: "0 0 0.4rem", fontWeight: "700", color: "#2d6a2d" }}>
                      Controlla la tua email!
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#4a7a4a", lineHeight: 1.5 }}>
                      Ti abbiamo inviato un link di conferma. Clicca sul link per attivare il tuo account e procedere al pagamento.
                    </p>
                  </div>
                ) : (
                  <>
                    <input type="email" placeholder="Email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                        border: "1px solid #e2e8f0", fontSize: "0.9rem",
                        marginBottom: "0.75rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                    <input type="password" placeholder="Password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loginEmail()}
                      style={{
                        width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                        border: "1px solid #e2e8f0", fontSize: "0.9rem",
                        marginBottom: "1rem", boxSizing: "border-box", outline: "none"
                      }}
                    />
                    {authError && (
                      <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                        {authError}
                      </p>
                    )}
                    <button onClick={loginEmail} disabled={authLoading} style={{
                      width: "100%", padding: "0.875rem", borderRadius: "0.875rem",
                      background: "#4f46e5", color: "white", border: "none",
                      fontSize: "0.95rem", fontWeight: "700", cursor: "pointer",
                      marginBottom: "1rem"
                    }}>
                      {authLoading ? "..." : authMode === "login" ? "Accedi" : "Registrati e procedi al pagamento →"}
                    </button>
                    <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                      {authMode === "login" ? "Non hai un account? " : "Hai già un account? "}
                      <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }} style={{
                        color: "#4f46e5", background: "none", border: "none",
                        cursor: "pointer", fontWeight: "600", fontSize: "0.8rem"
                      }}>
                        {authMode === "login" ? "Registrati" : "Accedi"}
                      </button>
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span className="logo-icon">🧶</span>
            <h1>KnitTranslate</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {user && (
              <>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {crediti} {crediti === 1 ? "traduzione" : "traduzioni"} disponibili
                </span>
                <button onClick={() => { setModalStep("prezzi"); setShowModal(true); }} style={{
                  fontSize: "0.75rem", color: "white", background: "#4f46e5",
                  border: "none", borderRadius: "9999px",
                  padding: "0.3rem 0.85rem", cursor: "pointer", fontWeight: "600"
                }}>+ Ricarica</button>
                <button onClick={logout} style={{
                  fontSize: "0.75rem", color: "#94a3b8", background: "none",
                  border: "1px solid #334155", borderRadius: "9999px",
                  padding: "0.25rem 0.75rem", cursor: "pointer"
                }}>Esci</button>
              </>
            )}
            {!user && (
              <button onClick={() => { setAuthMode("login"); setModalStep("auth"); setShowModal(true); }} style={{
                fontSize: "0.75rem", color: "#94a3b8", background: "none",
                border: "1px solid #334155", borderRadius: "9999px",
                padding: "0.25rem 0.75rem", cursor: "pointer"
              }}>Accedi</button>
            )}
            <div className="subtitle">Traduzione professionale di pattern di maglia</div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-content">
        <div className="lang-section">
          <span className="section-label">Lingua di destinazione</span>
          <div className="lang-pills">
            {LANGUAGES.map((lang) => (
              <button key={lang.code} onClick={() => setSelectedLang(lang.code)}
                className={`lang-btn ${selectedLang === lang.code ? "active" : ""}`}>
                {lang.label}
              </button>
            ))}
          </div>
          <button onClick={vediEsempio} className="example-link">
            Guarda una traduzione di esempio →
          </button>
        </div>

        <div className="grid-container">
          <div className="input-box">
            <div className="box-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label className="section-label" style={{ marginBottom: 0 }}>Pattern Originale</label>
                <div className="lang-pills" style={{ padding: "0.15rem" }}>
                  <span className="lang-btn active" style={{ cursor: "default", padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}>
                    🇬🇧 Inglese
                  </span>
                </div>
              </div>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Incolla qui il testo del pattern in inglese..."
              className="custom-textarea"
            />
          </div>

          <div className="output-box">
            <div className="box-header">
              <label className="section-label" style={{ marginBottom: 0 }}>Traduzione</label>
              {output && (
                <button onClick={copyToClipboard} className="copy-btn">
                  {copied ? "✓ Copiato!" : "Copia testo"}
                </button>
              )}
            </div>
            <textarea readOnly value={error || output}
              placeholder="La traduzione apparirà qui..."
              className={`custom-textarea output-textarea ${error ? "error-text" : ""}`}
            />
          </div>
        </div>

        <div className="action-section">
          <button onClick={handleTraduciClick}
            disabled={loading || !input.trim()}
            className="translate-btn">
            {loading ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                  <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Elaborazione...
              </>
            ) : "Traduci Pattern →"}
          </button>
          <p className="footer-note">
            Terminologia verificata da una traduttrice esperta di maglia — non una traduzione automatica
          </p>
        </div>
      </main>
    </div>
  );
}
