export const handler = async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const headers = { "Content-Type": "application/json" };

  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "ERROR", reason: "ANTHROPIC_API_KEY env var is not set in Netlify" }),
    };
  }

  const keyPreview = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: res.ok ? "OK" : "ERROR",
        httpStatus: res.status,
        keyPreview,
        anthropicResponse: data,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "NETWORK_ERROR", keyPreview, error: err.message }),
    };
  }
};
