import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabase";

const LANGUAGES = [
  { code: "italiano", label: "🇮🇹 Italiano" },
  { code: "spagnolo", label: "🇪🇸 Spagnolo" },
];

const ESEMPIO_EN = `With size US 8/5mm needles, cast on 78 (90: 98: 106) sts.
Row 1 (RS) K2, *p2, k2; rep from * to end.
Row 2 (WS) K the knit and p the purl sts.`;

const ESEMPIO_IT = `Con i ferri da 5.00 mm (US 8), avviare 78 (90: 98: 106) m.
Ferro 1 (DL) 2dir, *2rov, 2dir; rip da * fino alla fine.
Ferro 2 (RL) Lavorare a diritto le m a diritto e a rovescio le m a rovescio.`;

const LIMITE_GRATUITO = 1;

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("italiano");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [traduzioniUsate, setTraduzioniUsate] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) caricaContatore(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) caricaContatore(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const caricaContatore = async (userId) => {
    const { data } = await supabase
      .from("user_translations")
      .select("traduzioni_effettuate")
      .eq("user_id", userId)
      .single();
    if (data) setTraduzioniUsate(data.traduzioni_effettuate);
  };

  const incrementaContatore = async (userId) => {
    const { data } = await supabase
      .from("user_translations")
      .select("id, traduzioni_effettuate")
      .eq("user_id", userId)
      .single();

    if (data) {
      await supabase
        .from("user_translations")
        .update({
          traduzioni_effettuate: data.traduzioni_effettuate + 1,
          data_ultimo_utilizzo: new Date().toISOString(),
        })
        .eq("user_id", userId);
      setTraduzioniUsate(data.traduzioni_effettuate + 1);
    } else {
      await supabase
        .from("user_translations")
        .insert({ user_id: userId, traduzioni_effettuate: 1 });
      setTraduzioniUsate(1);
    }
  };

  const loginGoogle = async () => {
    setAuthLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google" });
    setAuthLoading(false);
  };

  const loginEmail = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setTraduzioniUsate(0);
    setOutput("");
    setShowPaywall(false);
  };

  const translate = async () => {
    if (!input.trim()) return;
    if (traduzioniUsate >= LIMITE_GRATUITO) {
      setShowPaywall(true);
      return;
    }
    setLoading(true);
    setOutput(""); setError(""); setShowPaywall(false);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, language: selectedLang }),
      });
      const data = await response.json();
      if (data.error) setError("Errore: " + data.error);
      else {
        setOutput(data.translation || "");
        await incrementaContatore(user.id);
      }
    } catch (err) {
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

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span className="logo-icon">🧶</span>
            <h1>KnitTranslate</h1>
            <span className="badge">AI Beta</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {user && (
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                {user.email}
              </span>
            )}
            {user && (
              <button onClick={logout} style={{
                fontSize: "0.75rem", color: "#94a3b8", background: "none",
                border: "1px solid #334155", borderRadius: "9999px",
                padding: "0.25rem 0.75rem", cursor: "pointer"
              }}>
                Esci
              </button>
            )}
            <div className="subtitle">Traduzione professionale di pattern di maglia</div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {!user ? (
          <div style={{
            maxWidth: "420px", margin: "3rem auto", background: "white",
            borderRadius: "1rem", padding: "2rem", boxShadow: "0 4px 24px rgb(0 0 0 / 0.08)"
          }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: "700", color: "#0f172a" }}>
              {authMode === "login" ? "Accedi a KnitTranslate" : "Crea il tuo account"}
            </h2>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748b" }}>
              La prima traduzione è gratuita e completa.
            </p>

            <button onClick={loginGoogle} disabled={authLoading} style={{
              width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
              border: "1px solid #e2e8f0", background: "white", cursor: "pointer",
              fontSize: "0.9rem", fontWeight: "500", display: "flex",
              alignItems: "center", justifyContent: "center", gap: "0.5rem",
              marginBottom: "1rem", transition: "all 0.2s"
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Continua con Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>oppure</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
            </div>

            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                border: "1px solid #e2e8f0", fontSize: "0.9rem", marginBottom: "0.75rem",
                boxSizing: "border-box", outline: "none"
              }}
            />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                border: "1px solid #e2e8f0", fontSize: "0.9rem", marginBottom: "1rem",
                boxSizing: "border-box", outline: "none"
              }}
            />

            {authError && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{authError}</p>}

            <button onClick={loginEmail} disabled={authLoading} style={{
              width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
              background: "#4f46e5", color: "white", border: "none",
              fontSize: "0.9rem", fontWeight: "600", cursor: "pointer", marginBottom: "1rem"
            }}>
              {authLoading ? "..." : authMode === "login" ? "Accedi" : "Registrati"}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
              {authMode === "login" ? "Non hai un account? " : "Hai già un account? "}
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                style={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
                {authMode === "login" ? "Registrati" : "Accedi"}
              </button>
            </p>
          </div>
        ) : (
          <>
            {traduzioniUsate >= LIMITE_GRATUITO && (
              <div style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                borderRadius: "1rem", padding: "1.5rem 2rem",
                marginBottom: "2rem", color: "white", textAlign: "center"
              }}>
                <p style={{ margin: "0 0 0.5rem", fontWeight: "700", fontSize: "1.1rem" }}>
                  Hai usato la tua traduzione gratuita 🎉
                </p>
                <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", opacity: 0.9 }}>
                  Passa a Premium per tradurre pattern illimitati
                </p>
                <button style={{
                  background: "white", color: "#4f46e5", border: "none",
                  borderRadius: "9999px", padding: "0.6rem 1.5rem",
                  fontWeight: "700", cursor: "pointer", fontSize: "0.9rem"
                }}>
                  Attiva Premium — €2.99
                </button>
              </div>
            )}

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
              <button onClick={translate}
                disabled={loading || !input.trim() || traduzioniUsate >= LIMITE_GRATUITO}
                className="translate-btn">
                {loading ? (
                  <>
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                      <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Elaborazione...
                  </>
                ) : traduzioniUsate >= LIMITE_GRATUITO ? "Passa a Premium →" : "Traduci Pattern →"}
              </button>
              <p className="footer-note">
                Terminologia verificata da una traduttrice esperta di maglia — non una traduzione automatica
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
