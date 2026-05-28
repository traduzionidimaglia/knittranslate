import { useState } from "react";

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
    <div style={{ minHeight: "100vh", background: "#faf8f5", fontFamily: "'Georgia', serif", color: "#2a2218" }}>
      <header style={{ padding: "20px 40px", background: "#2a2218", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>🧶</span>
        <h1 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#faf8f5", letterSpacing: "0.04em" }}>KnitTranslate</h1>
        <span style={{ fontSize: "10px", background: "#c8a96e", color: "#2a2218", padding: "2px 8px", borderRadius: "2px", fontFamily: "monospace", fontWeight: "700" }}>AI BETA</span>
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#a89880", fontStyle: "italic" }}>Traduzione professionale di pattern di maglia ai ferri</span>
      </header>

      <main style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a6e62", fontFamily: "monospace" }}>Lingua di destinazione</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {LANGUAGES.map((lang) => (
              <button key={lang.code} onClick={() => setSelectedLang(lang.code)} style={{
                padding: "6px 14px", border: selectedLang === lang.code ? "2px solid #2a2218" : "2px solid #d4cdc4",
                background: selectedLang === lang.code ? "#2a2218" : "transparent",
                color: selectedLang === lang.code ? "#faf8f5" : "#2a2218",
                borderRadius: "2px", cursor: "pointer", fontSize: "13px", fontFamily: "'Georgia', serif",
              }}>{lang.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a6e62", fontFamily: "monospace" }}>Pattern originale (EN)</p>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={"Back\nWith size US 8/5mm needles, cast on 78 sts..."}
              style={{ width: "100%", height: "460px", border: "2px solid #d4cdc4", borderRadius: "2px", padding: "18px", fontSize: "12.5px", lineHeight: "1.75", fontFamily: "'Courier New', monospace", background: "#fff", color: "#2a2218", resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a6e62", fontFamily: "monospace" }}>Traduzione</p>
              {output && <button onClick={copyToClipboard} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "11px", color: copied ? "#5a8a5a" : "#7a6e62", fontFamily: "monospace" }}>{copied ? "✓ Copiato" : "Copia testo"}</button>}
            </div>
            <div style={{ width: "100%", height: "460px", border: "2px solid #d4cdc4", borderRadius: "2px", padding: "18px", fontSize: "12.5px", lineHeight: "1.75", fontFamily: "'Courier New', monospace", background: loading ? "#f5f3f0" : "#fffdf9", color: "#2a2218", overflowY: "auto", boxSizing: "border-box", whiteSpace: "pre-wrap" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", color: "#7a6e62" }}>
                  <span style={{ fontSize: "28px", display: "inline-block", animation: "spin 2s linear infinite" }}>🧶</span>
                  <span style={{ fontSize: "12px", fontStyle: "italic" }}>Traduzione in corso...</span>
                </div>
              ) : error ? <span style={{ color: "#c0392b" }}>{error}</span>
                : output ? output
                : <span style={{ color: "#b0a898", fontStyle: "italic", fontSize: "12px" }}>La traduzione apparirà qui...</span>}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={translate} disabled={loading || !input.trim()} style={{
            padding: "13px 44px", background: loading || !input.trim() ? "#a89880" : "#2a2218",
            color: "#faf8f5", border: "none", borderRadius: "2px", fontSize: "14px",
            fontFamily: "'Georgia', serif", letterSpacing: "0.06em",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          }}>
            {loading ? "Traduzione in corso..." : "Traduci Pattern →"}
          </button>
          <p style={{ marginTop: "12px", fontSize: "11px", color: "#a89880", fontStyle: "italic" }}>
            Calibrato da una traduttrice professionista specializzata in pattern di maglia
          </p>
        </div>
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } button:hover:not(:disabled) { opacity: 0.85; }`}</style>
    </div>
  );
}
