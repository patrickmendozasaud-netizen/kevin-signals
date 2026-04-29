// Calls indicators + news inline (no internal HTTP hop), so it works
// without setting BASE_URL on Vercel. Uses GPT-4o-mini in JSON mode.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getIndicators(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=2mo&interval=1d`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    const closes = (j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(x => x != null);
    if (closes.length < 15) return null;
    const period = 14;
    let g = 0, l = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    g /= period; l /= period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      g = (g * (period - 1) + (d > 0 ? d : 0)) / period;
      l = (l * (period - 1) + (d < 0 ? -d : 0)) / period;
    }
    const rsi = l === 0 ? 100 : 100 - (100 / (1 + g / l));
    const trend = closes[closes.length - 1] > closes[0] ? 'UPTREND' : 'DOWNTREND';
    return { rsi: +rsi.toFixed(2), trend };
  } catch { return null; }
}

async function getHeadlines(ticker) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker + ' stock')}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return [];
    const text = await r.text();
    return [...text.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g)]
      .map(m => m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .slice(0, 6);
  } catch { return []; }
}

export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on Vercel' });
    }
    const { ticker, price } = req.body || {};
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    const [ind, news] = await Promise.all([getIndicators(ticker), getHeadlines(ticker)]);
    const indStr  = ind ? `RSI: ${ind.rsi} (overbought >70, oversold <30)\nTrend: ${ind.trend}` : 'Indicators unavailable';
    const newsStr = news.length ? news.map(h => '- ' + h).join('\n') : 'No recent headlines';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content:
`You are a professional trading analyst. Be conservative.

DATA:
Ticker: ${ticker}
Price: ${price}
${indStr}

News headlines:
${newsStr}

RULES:
- Use RSI (overbought >70, oversold <30)
- Use trend direction
- Use news sentiment
- Be conservative

Return ONLY JSON with this exact shape:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "confidence": <0-100 number>,
  "entry":  <number>,
  "target": <number>,
  "stop":   <number>,
  "reason": "<one-sentence explanation>"
}`
      }]
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(result);
  } catch (e) {
    console.error('ANALYZE STOCK ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
