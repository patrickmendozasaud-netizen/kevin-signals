import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { videoId } = req.body;

    // ⚠️ Placeholder transcript (you replace later with real fetch)
    const transcript = "Sample transcript from video " + videoId;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `
Summarize this video and extract stock insights.

Return JSON:
{
  "summary": "...",
  "stocks": ["AAPL","NVDA"]
}

Transcript:
${transcript}
`
      }]
    });

    res.json(JSON.parse(completion.choices[0].message.content));

  } catch (e) {
    res.status(500).json({ error: "Video analysis failed" });
  }
}
