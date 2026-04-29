export default function handler(req, res) {
  try {
    const { text } = req.body;

    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];

    const blacklist = [
      "OPEN","VERY","TODAY","EXPECT","WEEK","MONTH","YEAR",
      "AFTER","BEFORE","WITH","FROM","THIS","THAT"
    ];

    const tickers = [...new Set(words)]
      .filter(w => !blacklist.includes(w));

    res.status(200).json({
      stocks: tickers.map(t => ({ ticker: t }))
    });

  } catch (e) {
    res.status(500).json({ error: "Parse failed" });
  }
}
