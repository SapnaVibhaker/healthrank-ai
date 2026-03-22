import { useState } from "react";

const scoreColor = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";
const scoreBg   = (s) => s >= 75 ? "#f0fdf4" : s >= 50 ? "#fffbeb" : "#fef2f2";
const scoreBorder=(s)=> s >= 75 ? "#bbf7d0" : s >= 50 ? "#fde68a" : "#fecaca";
const scoreLabel = (s) => s >= 75 ? "Good" : s >= 50 ? "Needs Work" : "Poor";
const severityColor = { high: "#dc2626", medium: "#d97706", low: "#2563eb" };
const severityBg    = { high: "#fef2f2", medium: "#fffbeb", low: "#eff6ff" };
const severityBorder= { high: "#fecaca", medium: "#fde68a", low: "#bfdbfe" };
const scoreCategories = {
  keywordOptimization: "Keyword Optimization",
  readability: "Readability",
  eeat: "E-E-A-T",
  localSEO: "Local SEO",
  contentDepth: "Content Depth",
  callToAction: "Call to Action",
};

function RadialScore({ score }) {
  const r = 52, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 136, height: 136, margin: "0 auto" }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{score}</span>
        <span style={{ fontSize: 10, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = scoreColor(score);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, color = "#2a6049" }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
      {children}
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setLoadingMsg("Fetching site...");
      await new Promise(r => setTimeout(r, 300));
      setLoadingMsg("Analyzing SEO...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
    setLoadingMsg("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
        input::placeholder { color: #9ca3af; }
        input:focus { outline: none; box-shadow: 0 0 0 3px rgba(42,96,73,0.15); border-color: #2a6049 !important; }
        button:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        button { transition: all 0.15s ease; }
        .hero-section {
          background: linear-gradient(135deg, #d4e8dc 0%, #e8f0ec 25%, #eef2ee 50%, #f5ede6 75%, #f0e8d4 100%);
          background-size: 300% 300%;
          animation: gradientShift 10s ease infinite;
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2a6049", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polyline points="2,10 5,6 8,13 11,4 14,10 17,8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>HealthRank AI</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Features", "How It Works"].map(item => (
            <a key={item} href="#" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = "#111827"}
              onMouseLeave={e => e.target.style.color = "#6b7280"}>{item}</a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-section" style={{
        minHeight: result ? "auto" : "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: result ? "48px 24px" : "80px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        transition: "min-height 0.4s ease",
      }}>
        {/* Decorative orbs */}
        {!result && (<>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(42,96,73,0.08) 0%, transparent 70%)", top: "-100px", left: "-100px", animation: "floatOrb 8s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,160,100,0.1) 0%, transparent 70%)", bottom: "-60px", right: "-60px", animation: "floatOrb 10s ease-in-out infinite reverse", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,180,140,0.1) 0%, transparent 70%)", top: "30%", right: "10%", animation: "floatOrb 12s ease-in-out infinite 2s", pointerEvents: "none" }} />
        </>)}
        {!result && (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.85)", border: "1px solid #d1e5da", borderRadius: 99, padding: "6px 16px", fontSize: 13, color: "#2a6049", fontWeight: 600, marginBottom: 28 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              AI-Powered
            </div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
              Free Healthcare SEO Audit
            </h1>
            <p style={{ fontSize: 18, color: "#4b5563", marginBottom: 8, fontWeight: 500 }}>
              Is your clinic ranking where patients can find you?
            </p>
            <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 520, margin: "0 auto 36px" }}>
              Enter any healthcare clinic URL and get an AI-powered SEO audit in seconds — built for HIPAA, E-E-A-T, and Google&apos;s medical guidelines.
            </p>
          </>
        )}

        {result && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Analyze another clinic</h2>
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: 10, maxWidth: 580, margin: "0 auto", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: "6px 6px 6px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0, alignSelf: "center" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analyze()}
            placeholder="https://your-clinic.com"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#111827", background: "transparent", padding: "8px 0" }}
          />
          <button
            onClick={analyze}
            disabled={loading || !url.trim()}
            style={{
              padding: "10px 22px", background: loading || !url.trim() ? "#9ca3af" : "#2a6049",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: loading || !url.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                {loadingMsg}
              </>
            ) : <>Analyze Site <span style={{ fontSize: 16 }}>→</span></>}
          </button>
        </div>

        {!result && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
            {[["🛡", "HIPAA Compliant"], ["⭐", "E-E-A-T Optimized"], ["🔍", "Google Medical Guidelines"]].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280" }}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        )}

        {/* Stats teaser strip */}
        {!result && (
          <div style={{
            marginTop: 48, maxWidth: 640, width: "100%",
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(42,96,73,0.15)", borderRadius: 16,
            padding: "18px 28px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8, flexWrap: "wrap",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            {[
              { num: "77%", label: "of patients Google before booking" },
              { num: "46%", label: 'of healthcare searches are "near me"' },
              { num: "28×", label: "more clicks on page 1 vs page 2" },
            ].map(({ num, label }, i, arr) => (
              <div key={num} style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#2a6049", letterSpacing: "-0.03em", lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, lineHeight: 1.4 }}>{label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 36, background: "rgba(42,96,73,0.15)", flexShrink: 0 }} />
                )}
              </div>
            ))}
            <a
              href="healthrank-seo-stats.html"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                fontSize: 13, fontWeight: 600, color: "#2a6049", textDecoration: "none",
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                padding: "7px 14px", borderRadius: 8, marginLeft: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
              onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
            >
              See the research
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 860, margin: "20px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", color: "#dc2626", fontSize: 14, display: "flex", gap: 8 }}>
            <span>⚠️</span> {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ maxWidth: 900, margin: "32px auto 64px", padding: "0 24px", animation: "fadeUp 0.4s ease" }}>

          {/* Row 1: Score + Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 16, marginBottom: 16 }}>
            <Card style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <RadialScore score={result.overallScore} />
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall Score</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 4 }}>{result.clinicName}</div>
              </div>
            </Card>
            <Card>
              <SectionLabel>Summary</SectionLabel>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 20 }}>{result.summary}</p>
              {Object.entries(scoreCategories).map(([key, label]) => (
                <ScoreBar key={key} label={label} score={result.scores[key]} />
              ))}
            </Card>
          </div>

          {/* Row 2: Keywords */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <SectionLabel color="#16a34a">Top Keywords Found</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.topKeywords.map((kw, i) => (
                  <span key={i} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>{kw}</span>
                ))}
              </div>
            </Card>
            <Card>
              <SectionLabel color="#dc2626">Missing Keywords</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>{kw}</span>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 3: Readability + Tone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <SectionLabel color="#7c3aed">Readability Level</SectionLabel>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.6 }}>{result.readabilityLevel}</p>
            </Card>
            <Card>
              <SectionLabel color="#7c3aed">Content Tone</SectionLabel>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.6 }}>{result.tone}</p>
            </Card>
          </div>

          {/* Row 4: Strengths */}
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel color="#16a34a">Strengths</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {result.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Row 5: Issues */}
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel color="#dc2626">Issues to Fix</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.issues.map((issue, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "72px 1fr", gap: 14,
                  padding: "14px 16px", background: severityBg[issue.severity],
                  border: `1px solid ${severityBorder[issue.severity]}`,
                  borderLeft: `3px solid ${severityColor[issue.severity]}`,
                  borderRadius: 12,
                }}>
                  <div style={{ paddingTop: 1 }}>
                    <span style={{
                      background: "#fff", border: `1px solid ${severityBorder[issue.severity]}`,
                      color: severityColor[issue.severity], fontSize: 10, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
                    }}>{issue.severity}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 5 }}>{issue.issue}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                      <span style={{ color: "#2a6049", fontWeight: 600 }}>Fix: </span>{issue.fix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Row 6: Quick Wins */}
          <Card style={{ background: "linear-gradient(135deg, #f0fdf4, #f8fafb)", border: "1px solid #bbf7d0" }}>
            <SectionLabel color="#2a6049">⚡ Quick Wins — Do These First</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.quickWins.map((win, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#fff", borderRadius: 10, border: "1px solid #d1fae5" }}>
                  <span style={{ background: "#2a6049", color: "#fff", fontSize: 11, fontWeight: 800, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{win}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ textAlign: "center", marginTop: 36, color: "#9ca3af", fontSize: 12 }}>
            Powered by Claude AI · Built for healthcare marketers
          </div>
        </div>
      )}
    </div>
  );
}
