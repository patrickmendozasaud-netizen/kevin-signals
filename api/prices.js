export default async function handler(req, res) {
  const { tickers } = req.body;

  try {
    const query = tickers.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;

    const r = await fetch(url);
    const data = await r.json();

    const result = {};

    data.quoteResponse.result.forEach(s => {
      result[s.symbol] = {
        price: s.regularMarketPrice,
        prev: s.regularMarketPreviousClose
      };
    });

    res.status(200).json(result);

  } catch (e) {
    res.status(500).json({ error: "Price fetch failed" });
  }
}
