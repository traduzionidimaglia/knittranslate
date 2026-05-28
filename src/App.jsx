import { useState } from "react";
import "./App.css";

const LANGUAGES = [
  { code: "italiano", label: "🇮🇹 Italiano" },
  { code: "spagnolo", label: "🇪🇸 Spagnolo" },
];

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("italiano");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const translate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput(""); setError("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, language: selectedLang }),
      });
      const data = await response.json();
      if (data.error) setError("Errore: " + data.error);
      else setOutput(data.translation || "");
    } catch (err) {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
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
          <div className="subtitle">
            Traduzione professionale di pattern di maglia
          </div>
        </div>
      </header>
      <main className="main-content">
        <div className="lang-section">
          <span className="section-label">Lingua di destinazione</span>
          <div className="lang-pills">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`lang-btn ${selectedLang === lang.code ? 'active' : ''}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid-container">
          <div className="input-box">
            <div className="box-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label className="section-label" style={{ marginBottom: 0 }}>Pattern Originale</label>
                <div className="lang-pills" style={{ padding: '0.15rem' }}>
                  <span className="lang-btn active" style={{ cursor: 'default', padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'inline-block' }}>
                    🇬🇧 Inglese
                  </span>
                </div>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
            <textarea
              readOnly
              value={error || output}
              placeholder="La traduzione apparirà qui..."
              className={`custom-textarea output-textarea ${error ? 'error-text' : ''}`}
            />
          </div>
        </div>
        <div className="action-section">
          <button
            onClick={translate}
            disabled={loading || !input.trim()}
            className="translate-btn"
          >
            {loading ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                  <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Elaborazione...
              </>
            ) : (
              "Traduci Pattern →"
            )}
          </button>

          <p className="footer-note">
            Terminologia verificata da una traduttrice esperta di maglia — non una traduzione automatica
          </p>
        </div>
      </main>
    </div>
  );
}
