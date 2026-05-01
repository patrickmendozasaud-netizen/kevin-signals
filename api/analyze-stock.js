// Inlines indicator + news fetching so there's no internal HTTP hop
// (internal fetch calls don't work reliably on Vercel serverless).

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Indicators (RSI + trend) ──────────────────────────────────────
async function getIndicators(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=2mo&interval=1d`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    const closes = (j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(x => x != null);
    if (closes.length < 15) return null;

    const period = 14;
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) avgGain += d; else avgLoss -= d;
    }
    avgGain /= period; avgLoss /= period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    }
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    const sma = n => closes.length < n ? null : closes.slice(-n).reduce((a, b) => a + b, 0) / n;
    const sma20 = sma(20), sma50 = sma(50);
    const last = closes[closes.length - 1];
    let trend = 'NEUTRAL';
    if (sma20 && sma50) {
      if (sma20 > sma50 && last > sma20) trend = 'UPTREND';
      else if (sma20 < sma50 && last < sma20) trend = 'DOWNTREND';
    } else if (sma20) {
      trend = last > sma20 ? 'UPTREND' : 'DOWNTREND';
    }

    return { rsi: +rsi.toFixed(2), trend, sma20, sma50, last };
  } catch { return null; }
}

// ── News headlines ────────────────────────────────────────────────
async function getHeadlines(ticker) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return [];
    const text = await r.text();
    return [...text.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g)]
      .map(m => m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch { return []; }
}

// ── Handler ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on Vercel' });
    }

    const { ticker, price } = req.body || {};
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    // Fetch indicators and news in parallel
    const [ind, headlines] = await Promise.all([
      getIndicators(ticker),
      getHeadlines(ticker),
    ]);

    const indStr  = ind
      ? `RSI: ${ind.rsi} (oversold <30, overbought >70)\nTrend: ${ind.trend}\nSMA20: ${ind.sma20 ?? 'n/a'}, SMA50: ${ind.sma50 ?? 'n/a'}`
      : 'Indicators unavailable';

    const newsStr = headlines.length
      ? headlines.map(h => `- ${h}`).join('\n')
      : 'No recent headlines';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `You are a professional trading analyst. Be conservative.

DATA:
Ticker: ${ticker}
Price: $${price}
${indStr}

News headlines:
${newsStr}

Return ONLY this exact JSON shape:
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

    const ai = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      decision:   ai.decision   || 'HOLD',
      confidence: ai.confidence || 50,
      entry:      ai.entry      ?? price,
      target:     ai.target     ?? price * 1.05,
      stop:       ai.stop       ?? price * 0.97,
      score:      ai.confidence ?? 50,
      reason:     ai.reason     || 'No clear signal',
    });

  } catch (e) {
    console.error('ANALYZE STOCK ERROR:', e);
    return res.status(500).json({ error: e.message });
  }
}
