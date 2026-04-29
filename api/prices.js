export default async function handler(req, res) {
  try {
    const { tickers } = req.body;

    if (!tickers || !tickers.length) {
      return res.json({});
    }

    const query = tickers.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;

    const r = await fetch(url);

    if (!r.ok) {
      throw new Error("Yahoo API failed");
    }

    const data = await r.json();

    const result = {};

    data.quoteResponse.result.forEach(s => {
      result[s.symbol] = {
        price: s.regularMarketPrice || 0,
        prev: s.regularMarketPreviousClose || s.regularMarketPrice || 0
      };
    });

    res.json(result);

  } catch (e) {
    console.error("PRICE ERROR:", e);
    res.status(500).json({});
  }
}
