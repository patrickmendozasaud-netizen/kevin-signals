// Yahoo's /v7/finance/quote endpoint requires a cookie+crumb that often fails on Vercel.
// /v8/finance/chart works without auth, so we hit it once per ticker in parallel.
export default async function handler(req, res) {
  try {
    const { tickers } = req.body || {};
    if (!Array.isArray(tickers) || !tickers.length) {
      return res.status(400).json({ error: 'tickers array required' });
    }

    const results = await Promise.all(tickers.map(async (t) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=5d`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) return [t, null];
        const j = await r.json();
        const meta = j?.chart?.result?.[0]?.meta;
        if (!meta) return [t, null];
        return [t, {
          price: meta.regularMarketPrice ?? null,
          prev:  meta.previousClose ?? meta.chartPreviousClose ?? null,
        }];
      } catch { return [t, null]; }
    }));

    const out = {};
    for (const [t, v] of results) if (v && v.price != null) out[t] = v;
    res.status(200).json(out);
  } catch (e) {
    console.error('PRICE ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
