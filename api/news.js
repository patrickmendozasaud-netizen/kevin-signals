export default async function handler(req, res) {
  const { ticker } = req.query;

  try {
    const url = `https://news.google.com/rss/search?q=${ticker}+stock`;
    const r = await fetch(url);
    const text = await r.text();

    const headlines = [...text.matchAll(/<title>(.*?)<\/title>/g)]
      .map(m => m[1])
      .slice(1, 6);

    res.json({ headlines });

  } catch (e) {
    res.status(500).json({ error: "News failed" });
  }
}
