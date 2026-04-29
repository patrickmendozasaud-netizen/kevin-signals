// Wilder's RSI(14) + simple SMA-based trend.
export default async function handler(req, res) {
  const ticker = (req.query.ticker || '').toString().trim();
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=2mo&interval=1d`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`yahoo ${r.status}`);
    const j = await r.json();
    const closes = (j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(x => x != null);
    if (closes.length < 15) throw new Error('not enough data');

    const period = 14;
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) avgGain += d; else avgLoss -= d;
    }
    avgGain /= period; avgLoss /= period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      const g = d > 0 ? d : 0;
      const l = d < 0 ? -d : 0;
      avgGain = (avgGain * (period - 1) + g) / period;
      avgLoss = (avgLoss * (period - 1) + l) / period;
    }
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    const sma = (n) => {
      if (closes.length < n) return null;
      const s = closes.slice(-n).reduce((a, b) => a + b, 0);
      return s / n;
    };
    const sma20 = sma(20), sma50 = sma(50);
    const last = closes[closes.length - 1];
    let trend = 'NEUTRAL';
    if (sma20 && sma50) {
      if (sma20 > sma50 && last > sma20) trend = 'UPTREND';
      else if (sma20 < sma50 && last < sma20) trend = 'DOWNTREND';
    } else if (sma20) {
      trend = last > sma20 ? 'UPTREND' : 'DOWNTREND';
    }

    res.status(200).json({
      rsi: +rsi.toFixed(2),
      trend,
      sma20: sma20 ? +sma20.toFixed(2) : null,
      sma50: sma50 ? +sma50.toFixed(2) : null,
      last,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
