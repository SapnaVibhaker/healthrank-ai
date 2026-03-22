import { useState } from "react";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const SEO_SYSTEM_PROMPT = `You are a healthcare SEO expert with deep knowledge of medical content marketing, HIPAA-compliant messaging, E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for health content, and Google's medically-sensitive content guidelines.
Analyze the provided clinic website content and return a JSON object ONLY (no markdown, no preamble) with this exact structure:
{
  "clinicName": "detected or inferred clinic name",
  "overallScore": 72,
  "summary": "2-3 sentence overview of SEO health",
  "scores": {
    "keywordOptimization": 65,
    "readability": 80,
    "eeat": 55,
    "localSEO": 70,
    "contentDepth": 60,
    "callToAction": 75
  },
  "topKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "missingKeywords": ["missing1", "missing2", "missing3"],
  "readabilityLevel": "Grade 10 – slightly above recommended for patients",
  "tone": "Clinical and formal — consider warmer language for patient trust",
  "strengths": ["Clear service list with specialty names", "Contact info visible on homepage"],
  "issues": [
    { "severity": "high", "issue": "No patient testimonials or reviews section", "fix": "Add a reviews widget from Google or Healthgrades to boost E-E-A-T" },
    { "severity": "high", "issue": "Missing location-based keywords", "fix": "Include city/neighborhood name naturally in headings and first paragraph" },
    { "severity": "medium", "issue": "No FAQ section", "fix": "Add FAQ with common patient questions — captures featured snippet traffic" },
    { "severity": "low", "issue": "Meta description not optimized", "fix": "Rewrite to include primary service + location + a patient benefit under 160 chars" }
  ],
  "quickWins": [
    "Add your city name to the H1 heading",
    "Include a Google Maps embed on the contact page",
    "Add schema markup for MedicalOrganization"
  ]
}`;

function extractTextFromHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  ["script", "style", "nav", "footer", "header", "noscript", "iframe"].forEach(tag => {
    div.querySelectorAll(tag).forEach(el => el.remove());
  });
  return div.innerText.replace(/\s+/g, " ").trim().slice(0, 4000);
}

async function fetchSiteContent(url) {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(normalized)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Could not fetch the website. Try another URL.");
  const data = await res.json();
  if (!data.contents) throw new Error("No content returned from the website.");
  return extractTextFromHTML(data.contents);
}

const scoreColor = (s) => s >= 75 ? "#4ade80" : s >= 50 ? "#facc15" : "#f87171";
const scoreLabel = (s) => s >= 75 ? "Good" : s >= 50 ? "Needs Work" : "Poor";
const severityColor = { high: "#f87171", medium: "#facc15", low: "#60a5fa" };
const scoreCategories = {
  keywordOptimization: "Keyword Optimization",
  readability: "Readability",
  eeat: "E-E-A-T",
  localSEO: "Local SEO",
  contentDepth: "Content Depth",
  callToAction: "Call to Action",
};

function RadialScore({ score }) {
  const r = 54, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = scoreColor(score);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "#cbd5e1" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function Chip({ label, color, bg, border }) {
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`, color,
      fontSize: 12, padding: "5px 13px", borderRadius: 99,
      fontFamily: "'DM Mono', monospace", letterSpacing: "0.02em",
    }}>{label}</span>
  );
}

function SectionHeader({ color, children }) {
  return (
    <div style={{
      fontSize: 11, color, textTransform: "uppercase",
      letterSpacing: "0.12em", fontWeight: 700, marginBottom: 16,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />
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
      setLoadingMsg("🌐 Fetching site...");
      const content = await fetchSiteContent(url);
      setLoadingMsg("🤖 Analyzing SEO...");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1000,
          system: SEO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analyze this healthcare clinic website content for SEO:\n\n${content}` }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
    setLoadingMsg("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020917", fontFamily: "'DM Sans', sans-serif", padding: "0 0 80px 0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        input::placeholder { color: #334155; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #0f172a", padding: "22px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, #0a1628 0%, #020917 100%)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              HealthRank <span style={{ color: "#38bdf8" }}>AI</span>
            </div>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Healthcare SEO Analyzer</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#475569" }}>AI-Powered</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 24px 0" }}>

        {/* Hero */}
        {!result && !loading && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              display: "inline-block", background: "#0c1f3a", border: "1px solid #1e3a5f",
              color: "#38bdf8", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", padding: "5px 16px", borderRadius: 99, marginBottom: 20,
            }}>Free Healthcare SEO Audit</div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800,
              color: "#f1f5f9", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.15,
            }}>
              Is your clinic <span style={{ color: "#38bdf8" }}>ranking</span> where<br />patients can find you?
            </h1>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 500, margin: "0 auto" }}>
              Enter any healthcare clinic URL and get an AI-powered SEO audit in seconds — built for HIPAA, E-E-A-T, and Google&apos;s medical guidelines.
            </p>
          </div>
        )}

        {/* Input Card */}
        <div style={{
          background: "#0a1628", border: "1px solid #1e293b",
          borderRadius: 20, padding: 28, marginBottom: 28,
          boxShadow: "0 0 40px rgba(56,189,248,0.04)",
        }}>
          {!result && (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
                Enter a clinic website URL
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 18 }}>No signup required. Works on any healthcare website.</div>
            </>
          )}
          {result && (
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 16 }}>
              Analyze another clinic
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#334155" }}>🔗</span>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analyze()}
                placeholder="e.g. brightsmilesdental.com"
                style={{
                  width: "100%", background: "#020917", border: "1px solid #1e293b",
                  borderRadius: 12, color: "#cbd5e1", fontSize: 14, padding: "13px 16px 13px 40px",
                  outline: "none", fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url.trim()}
              style={{
                padding: "13px 28px",
                background: loading || !url.trim() ? "#1e293b" : "linear-gradient(135deg, #38bdf8, #818cf8)",
                border: "none", borderRadius: 12,
                color: loading || !url.trim() ? "#475569" : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                boxShadow: loading || !url.trim() ? "none" : "0 4px 20px rgba(56,189,248,0.25)",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>⏳</span>
                  {loadingMsg}
                </span>
              ) : "🔍 Analyze Site"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1e0a0a", border: "1px solid #7f1d1d",
            borderRadius: 12, padding: "14px 18px",
            color: "#fca5a5", marginBottom: 24, fontSize: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>

            {/* Row 1: Overall Score + Category Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{
                background: "#0a1628", border: "1px solid #1e293b",
                borderRadius: 20, padding: 28, textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <RadialScore score={result.overallScore} />
                <div style={{ marginTop: 18, fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>Overall Score</div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>
                  {result.clinicName}
                </div>
              </div>

              <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 28 }}>
                <SectionHeader color="#38bdf8">Summary</SectionHeader>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 24 }}>{result.summary}</p>
                {Object.entries(scoreCategories).map(([key, label]) => (
                  <ScoreBar key={key} label={label} score={result.scores[key]} />
                ))}
              </div>
            </div>

            {/* Row 2: Keywords */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24 }}>
                <SectionHeader color="#4ade80">Top Keywords Found</SectionHeader>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.topKeywords.map((kw, i) => (
                    <Chip key={i} label={kw} color="#4ade80" bg="#0d2d1a" border="#166534" />
                  ))}
                </div>
              </div>
              <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24 }}>
                <SectionHeader color="#f87171">Missing Keywords</SectionHeader>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.missingKeywords.map((kw, i) => (
                    <Chip key={i} label={kw} color="#f87171" bg="#1e0a0a" border="#7f1d1d" />
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Readability + Tone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24 }}>
                <SectionHeader color="#818cf8">Readability Level</SectionHeader>
                <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600, lineHeight: 1.5 }}>{result.readabilityLevel}</div>
              </div>
              <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24 }}>
                <SectionHeader color="#818cf8">Content Tone</SectionHeader>
                <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600, lineHeight: 1.5 }}>{result.tone}</div>
              </div>
            </div>

            {/* Row 4: Strengths */}
            <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <SectionHeader color="#4ade80">Strengths</SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    border: "1px solid #166534",
                    padding: "10px 14px", borderRadius: 10,
                  }}>
                    <span style={{ color: "#4ade80", fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: Issues */}
            <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <SectionHeader color="#f87171">Issues to Fix</SectionHeader>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "80px 1fr",
                    gap: 16, padding: "14px 18px",
                    background: "#020917", borderRadius: 14,
                    border: `1px solid ${severityColor[issue.severity]}22`,
                    borderLeft: `3px solid ${severityColor[issue.severity]}`,
                  }}>
                    <div style={{ paddingTop: 2 }}>
                      <span style={{
                        background: severityColor[issue.severity] + "22",
                        border: `1px solid ${severityColor[issue.severity]}66`,
                        color: severityColor[issue.severity],
                        fontSize: 10, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}>{issue.severity}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{issue.issue}</div>
                      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                        <span style={{ color: "#38bdf8", fontWeight: 600 }}>Fix: </span>{issue.fix}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 6: Quick Wins */}
            <div style={{
              background: "linear-gradient(135deg, #0c1f3a 0%, #0a1628 100%)",
              border: "1px solid #1e3a5f", borderRadius: 20, padding: 24,
              boxShadow: "0 0 40px rgba(56,189,248,0.06)",
            }}>
              <SectionHeader color="#38bdf8">⚡ Quick Wins — Do These First</SectionHeader>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.quickWins.map((win, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", background: "#020917",
                    borderRadius: 12, border: "1px solid #1e3a5f",
                  }}>
                    <span style={{
                      background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                      color: "#fff", fontSize: 11, fontWeight: 800,
                      width: 24, height: 24, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: "50%", flexShrink: 0, fontFamily: "'DM Mono', monospace",
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 14, color: "#cbd5e1" }}>{win}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 40, color: "#334155", fontSize: 12 }}>
              Powered by Claude AI · Built for healthcare marketers
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
