function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

export default async function handler(req, res) {
  const ticker = (req.query.ticker || '').toString().trim();
  if (!ticker) return res.status(400).json({ error: 'ticker required' });
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`rss ${r.status}`);
    const text = await r.text();
    const items = [...text.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g)]
      .map(m => decodeEntities(m[1]).trim())
      .filter(Boolean)
      .slice(0, 6);
    res.status(200).json({ headlines: items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
