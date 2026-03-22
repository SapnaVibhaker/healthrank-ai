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
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export const handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  console.log("[analyze] invoked, method:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[analyze] API key present:", !!apiKey, "| preview:", apiKey ? `${apiKey.slice(0,10)}...${apiKey.slice(-4)}` : "MISSING");
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };
  }

  let url;
  try {
    ({ url } = JSON.parse(event.body));
    if (!url) throw new Error("No URL provided");
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    console.log("[analyze] target URL:", url);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Fetch the website server-side
  let siteContent;
  try {
    console.log("[analyze] fetching site...");
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HealthRankBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    console.log("[analyze] site fetch status:", res.status);
    if (!res.ok) throw new Error(`Site returned ${res.status}`);
    const html = await res.text();
    siteContent = extractTextFromHTML(html);
    console.log("[analyze] extracted text length:", siteContent.length);
    if (!siteContent) throw new Error("No readable content found on that page");
  } catch (err) {
    console.error("[analyze] site fetch error:", err.message);
    return { statusCode: 422, headers, body: JSON.stringify({ error: `Could not fetch site: ${err.message}` }) };
  }

  // Call Anthropic
  try {
    console.log("[analyze] calling Anthropic...");
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: SEO_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Analyze this healthcare clinic website content for SEO:\n\n${siteContent}` }],
      }),
    });

    const data = await aiRes.json();
    console.log("[analyze] Anthropic status:", aiRes.status, "| error:", data?.error?.message || "none");

    if (!aiRes.ok) {
      return { statusCode: aiRes.status, headers, body: JSON.stringify({ error: data?.error?.message || "Anthropic API error" }) };
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log("[analyze] success, clinicName:", parsed.clinicName);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (err) {
    console.error("[analyze] Anthropic error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Analysis failed: ${err.message}` }) };
  }
};
