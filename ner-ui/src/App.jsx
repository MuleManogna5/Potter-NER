import React, { useState } from "react";

/** label colors for highlighted view */
const LABEL_COLORS = {
  PERSON: { bg: "#9ad0ff", text: "#04263b" },
  ORG:    { bg: "#ffd09a", text: "#402400" },
  GPE:    { bg: "#b2ffb0", text: "#052a10" },
  LOC:    { bg: "#ffd6f0", text: "#3b0032" },
  DATE:   { bg: "#ffd8a8", text: "#3b2700" },
  TIME:   { bg: "#c8f0ff", text: "#042b33" },
  MONEY:  { bg: "#ffe6b8", text: "#3b2b00" },
  DEFAULT:{ bg: "#e0e0e0", text: "#04121a" }
};
function getLabelStyle(label) {
  return LABEL_COLORS[label] || LABEL_COLORS.DEFAULT;
}

/** Component to render highlighted text with entity chips */
function EntityHighlight({ text, entities }) {
  if (!entities || entities.length === 0) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>;
  }
  const segments = [];
  let cursor = 0;
  const sorted = [...entities].sort((a, b) => a.start - b.start);
  for (const e of sorted) {
    const s = Math.max(0, e.start || 0);
    const en = Math.min(text.length, e.end || s);
    if (s > cursor) segments.push({ type: "text", text: text.slice(cursor, s) });
    segments.push({ type: "entity", text: text.slice(s, en), label: e.label, start: s, end: en });
    cursor = en;
  }
  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) });

  return (
    <div style={{ lineHeight: 1.6, wordBreak: "break-word" }}>
      {segments.map((s, i) =>
        s.type === "text" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "2px 8px",
              margin: "0 6px 6px 0",
              borderRadius: 10,
              background: getLabelStyle(s.label).bg,
              color: getLabelStyle(s.label).text,
              boxShadow: `0 6px 18px ${getLabelStyle(s.label).bg}55`,
              fontWeight: 700
            }}
            title={`${s.label} (${s.start}-${s.end})`}
          >
            {s.text}
            <small style={{ marginLeft: 8, fontWeight: 600, opacity: 0.9, fontSize: 12 }}>
              {s.label}
            </small>
          </span>
        )
      )}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState("");         // user-provided tokens (JSON string)
  const [domain, setDomain] = useState("General");  // kept (but not used for switching models yet)
  const [extraSentences, setExtraSentences] = useState(""); // extra sentences for multi-sentence
  const [multi, setMulti] = useState(false);        // explicit multi flag (not exposed in UI)

  const [selectedOption, setSelectedOption] = useState("");
  const [outputFormat, setOutputFormat] = useState(""); // start empty to show placeholder
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // small helper: whitespace tokenizer (replaceable with better tokenizer)
  function simpleTokenize(str) {
    if (!str || !str.trim()) return [];
    return str.trim().split(/\s+/).filter(Boolean);
  }

  // send request to backend (modified: ensure tokens array is always sent)
  async function callPredict() {
    if (!text || text.trim() === "") return;
    setLoading(true);
    setResult(null);

    // combine text + extra sentences if option 2 selected
    let finalText = text.trim();
    if (selectedOption === "multi" && extraSentences && extraSentences.trim() !== "") {
      finalText = finalText + "\n" + extraSentences.trim();
    }

    // attempt to parse tokens JSON if present
    let tokenPayload = null;
    if (tokens && tokens.trim() !== "") {
      try {
        const parsed = JSON.parse(tokens);
        if (Array.isArray(parsed)) tokenPayload = parsed;
        else tokenPayload = null;
      } catch (e) {
        tokenPayload = null;
      }
    }

    // If no valid tokens provided, auto-tokenize here and also update tokens box so user sees them
    if (!tokenPayload) {
      tokenPayload = simpleTokenize(finalText);
      try {
        setTokens(JSON.stringify(tokenPayload));
      } catch (e) {
        /* ignore */
      }
    }

    // decide multi flag: true when Option 2 selected, otherwise fall back to state
    const multiFlag = selectedOption === "multi" ? true : !!multi;

    const body = { text: finalText, tokens: tokenPayload, domain, multi: multiFlag };

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("Backend response:", data); // helpful for debugging

      if (!res.ok) {
        setResult({ error: data.detail || "Server error" });
      } else {
        // normalize result: ensure tokens/text exist for frontend rendering
        const normalized = {
          ...data,
          tokens: Array.isArray(data.tokens) ? data.tokens : tokenPayload,
          text: data.text || finalText,
        };
        setResult(normalized);
      }
    } catch (err) {
      setResult({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  // Utility: auto-tokenize combined text (main + extra sentences if option 2 selected)
  function autoTokenize() {
    const combined =
      selectedOption === "multi" && extraSentences && extraSentences.trim() !== ""
        ? text + " " + extraSentences
        : text;
    const toks = simpleTokenize(combined);
    setTokens(JSON.stringify(toks));
  }

  // Show tokens in the output section (for debugging/visibility)
  function RenderTokens({ tokensArr }) {
    if (!tokensArr || !tokensArr.length) return null;
    return (
      <div style={{ marginTop: 10 }}>
        <strong>Tokens:</strong>
        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tokensArr.map((t, i) => (
            <code key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 6 }}>
              {t}
            </code>
          ))}
        </div>
      </div>
    );
  }

  // Render the output area depending on outputFormat
  function RenderOutput() {
    if (!result) return <div>No result yet — run the model.</div>;
    if (result.error) return <div style={{ color: "#ff8a8a" }}><strong>Error:</strong> {result.error}</div>;

    // tokens display: prefer backend tokens if present, otherwise show normalized tokens
    const tokensToShow = Array.isArray(result.tokens) ? result.tokens : (Array.isArray(result.tokens) ? result.tokens : []);

    if (outputFormat === "JSON") {
      return (
        <>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
          <RenderTokens tokensArr={tokensToShow} />
        </>
      );
    }

    if (outputFormat === "TABLE") {
      return (
        <>
          <h4>Entity Summary</h4>
          <table className="entity-table">
            <thead><tr><th>Label</th><th>Text</th><th>Span</th></tr></thead>
            <tbody>
              {result.entities && result.entities.length ? (
                result.entities.map((e, i) => (
                  <tr key={i}><td>{e.label}</td><td>{e.text}</td><td>{e.start}-{e.end}</td></tr>
                ))
              ) : (
                <tr><td colSpan={3}>No entities found</td></tr>
              )}
            </tbody>
          </table>
          <RenderTokens tokensArr={tokensToShow} />
        </>
      );
    }

    // Highlighted view (default fallback)
    return (
      <>
        <h4>Highlighted text</h4>
        <EntityHighlight text={result.text} entities={result.entities} />
        <RenderTokens tokensArr={tokensToShow} />
      </>
    );
  }

  return (
    <div className="app-card">
      <h1 className="main-title">POTTER NER</h1>

      <label className="text-heading">Text</label>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your text here..."
      />

      {/* Additional Options */}
      <h3 style={{ marginTop: 20, textAlign: "left", fontWeight: 700 }} className="stylish-heading">
        Additional Options
      </h3>

      <div className="options-row">
        <label
          className={`radio-label ${selectedOption === "tokens" ? "active" : ""}`}
          onClick={() => setSelectedOption(selectedOption === "tokens" ? "" : "tokens")}
        >
          <input
            type="radio"
            name="opt"
            checked={selectedOption === "tokens"}
            onChange={() => setSelectedOption("tokens")}
          />
          Custom Tokens
        </label>

        <label
          className={`radio-label ${selectedOption === "multi" ? "active" : ""}`}
          onClick={() => setSelectedOption(selectedOption === "multi" ? "" : "multi")}
        >
          <input
            type="radio"
            name="opt"
            checked={selectedOption === "multi"}
            onChange={() => setSelectedOption("multi")}
          />
          Multiple Sentences
        </label>

        <label
          className={`radio-label ${selectedOption === "output" ? "active" : ""}`}
          onClick={() => setSelectedOption(selectedOption === "output" ? "" : "output")}
        >
          <input
            type="radio"
            name="opt"
            checked={selectedOption === "output"}
            onChange={() => setSelectedOption("output")}
          />
          Output Format
        </label>
      </div>

      {/* Conditionally render the option box for the selected radio */}
      <div style={{ marginTop: 16 }}>
        {selectedOption === "tokens" && (
          <div className="opt-box">
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Custom tokens (JSON array)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{
                  flex: 1,
                  padding: 8,
                  background: "rgba(255,255,255,0.03)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
                placeholder='e.g. ["Harry","went","to","Hogwarts","."]'
              />
              <button onClick={autoTokenize} style={{ padding: "8px 10px" }}>
                Auto-tokenize
              </button>
            </div>
            <div style={{ marginTop: 8, color: "#bbb", fontSize: 13 }}>
              Auto-tokenize splits text on spaces and fills the box (edit if needed).
            </div>
          </div>
        )}

        {selectedOption === "multi" && (
          <div className="opt-box">
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Multiple sentences</div>

            {/* extra sentences textarea */}
            <textarea
              rows={4}
              value={extraSentences}
              onChange={(e) => setExtraSentences(e.target.value)}
              placeholder="Add one or more extra sentences here..."
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 8,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
              }}
            />

            <div style={{ marginTop: 8, color: "#bbb", fontSize: 13 }}>
              The extra sentences will be appended to the main text when you press <strong>Run</strong>.
            </div>
          </div>
        )}

        {selectedOption === "output" && (
  <div className="opt-box">
    <div className="output-label">Choose Output Format</div>

    <select
      className="output-select"
      value={outputFormat}
      onChange={(e) => setOutputFormat(e.target.value)}
    >
      <option value="">Choose an option</option>
      <option value="JSON">JSON</option>
      <option value="TABLE">Table</option>
      <option value="HIGHLIGHT">Highlighted Text</option>
    </select>

    <div className="output-hint">
      Pick how you want the model output displayed.
    </div>
  </div>
)}
<br></br>
      </div>

      {/* Run button */}
      <div className="run-container">
        <button className="run-btn"
        onClick={callPredict}
        disabled={loading}
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>
      <br></br>
<hr></hr>
     <br></br>
      {/* Output */}
      <div style={{ marginTop: 22 }}>
        <h3>Output</h3>
        <RenderOutput />
      </div>
    </div>
  );
}
