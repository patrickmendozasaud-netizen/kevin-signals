export default async function handler(req, res) {
try {
const { videoId } = req.body || {};

```
if (!videoId) {
  return res.status(400).json({ error: "Missing videoId" });
}

// ---------------- FETCH VIDEO PAGE ----------------
const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
const html = await page.text();

// ---------------- TRY CAPTIONS ----------------
let transcript = "";

try {
  const match = html.match(/"captionTracks":(\[[^\]]*\])/);

  if (match) {
    const tracks = JSON.parse(match[1]);
    const track = tracks[0];

    const capRes = await fetch(track.baseUrl);
    const xml = await capRes.text();

    transcript = xml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
} catch (e) {
  console.log("No captions available");
}

// ---------------- FALLBACK: TITLE ----------------
if (!transcript || transcript.length < 50) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "";

  transcript = title;
}

// ---------------- EXTRACT TICKERS (ALWAYS WORKS) ----------------
const tickers = [...new Set((transcript.match(/\b[A-Z]{2,5}\b/g) || []))];

// ---------------- AI ANALYSIS (OPTIONAL) ----------------
let summary = "No AI summary";

if (process.env.OPENAI_API_KEY) {
  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Summarize the video and extract key stock insights."
          },
          {
            role: "user",
            content: transcript.slice(0, 4000)
          }
        ]
      })
    });

    const json = await aiRes.json();
    summary = json.choices?.[0]?.message?.content || summary;

  } catch (e) {
    console.log("AI failed");
  }
}

// ---------------- FINAL RESPONSE ----------------
return res.status(200).json({
  summary,
  tickers,
  rawLength: transcript.length
});
```

} catch (err) {
console.error(err);
return res.status(200).json({
summary: "⚠️ Video could not be analyzed, fallback used.",
tickers: [],
error: err.message
});
}

