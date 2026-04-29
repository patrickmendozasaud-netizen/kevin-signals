// AI writes its own independent opinion on Kevin's report:
// overall verdict, things to watch, catalysts, and per-ticker BUY/SELL/HOLD picks
// with price action and catalyst notes.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on Vercel' });
    }
    const { text, tickers } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });

    // Cap input to keep token cost predictable
    const capped = String(text).slice(0, 12000);
    const tickerList = Array.isArray(tickers) ? tickers.join(', ') : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content:
`You are a senior trading analyst. Read this Alpha Report from Meet Kevin
and write your OWN independent opinion. Do not just summarise — give your verdict.

Tickers detected: ${tickerList || '(extract them yourself)'}

REPORT:
${capped}

Return ONLY this exact JSON shape:
{
  "verdict": "BULLISH" | "BEARISH" | "NEUTRAL",
  "overall_take": "<2-4 sentence opinion of the report's thesis and your stance>",
  "watch_for": ["<key thing to monitor>", "<another>"],
  "catalysts": ["<upcoming event or data point>", "<another>"],
  "picks": [
    {
      "ticker": "AAPL",
      "action": "BUY" | "SELL" | "HOLD",
      "price_action": "<short note on what the chart is doing>",
      "catalyst": "<why now>",
      "reason": "<one-sentence rationale>",
      "entry":  <number or null>,
      "target": <number or null>,
      "stop":   <number or null>
    }
  ]
}

Keep "picks" focused on the 5-10 most important tickers. Be conservative,
specific, and use numbers when possible.`
      }]
    });

    res.status(200).json(JSON.parse(completion.choices[0].message.content));
  } catch (e) {
    console.error('ANALYZE REPORT ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
