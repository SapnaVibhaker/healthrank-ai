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

  const apiKey = process.env.GROQ_API_KEY;
  console.log("[analyze] Groq key present:", !!apiKey);
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "GROQ_API_KEY not configured" }) };
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
  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
  };

  try {
    console.log("[analyze] fetching site...");
    const res = await fetch(url, {
      headers: browserHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    console.log("[analyze] site fetch status:", res.status);
    if (!res.ok) throw new Error(`Site returned ${res.status}`);
    const html = await res.text();
    siteContent = extractTextFromHTML(html);
    console.log("[analyze] extracted text length:", siteContent.length);
    if (!siteContent) throw new Error("No readable content found on that page");
  } catch (err) {
    console.error("[analyze] site fetch error:", err.message);
    // Give a helpful error distinguishing bot-blocked vs unreachable
    const msg = err.message.includes("fetch failed")
      ? "This site blocks automated requests (bot protection). Try a smaller clinic URL."
      : `Could not fetch site: ${err.message}`;
    return { statusCode: 422, headers, body: JSON.stringify({ error: msg }) };
  }

  // Call Groq (Llama 3.3 70B — free tier, 14,400 req/day)
  try {
    console.log("[analyze] calling Groq...");
    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SEO_SYSTEM_PROMPT },
          { role: "user", content: `Analyze this healthcare clinic website content for SEO:\n\n${siteContent}` },
        ],
      }),
    });

    const data = await aiRes.json();
    console.log("[analyze] Groq status:", aiRes.status, "| error:", data?.error?.message || "none");

    if (!aiRes.ok) {
      return { statusCode: aiRes.status, headers, body: JSON.stringify({ error: data?.error?.message || "Groq API error" }) };
    }

    const text = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    console.log("[analyze] success, clinicName:", parsed.clinicName);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (err) {
    console.error("[analyze] Groq error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Analysis failed: ${err.message}` }) };
  }
};
