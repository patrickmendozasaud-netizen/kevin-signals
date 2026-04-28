import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Extract stock tickers and signals.

Return ONLY valid JSON. No explanation.

Format:
{
  "stocks": [
    { "ticker": "AAPL", "signal": "bullish" }
  ]
}

Text:
${text}
`
        }
      ],
      temperature: 0
    });

    let content = completion.choices[0].message.content;

    // 🔥 HARD FIX: force clean JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { stocks: [] };
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Parse failed" });
  }
}
