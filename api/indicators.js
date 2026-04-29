export default async function handler(req, res) {
  const { ticker } = req.query;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;
    const r = await fetch(url);
    const data = await r.json();

    const prices = data.chart.result[0].indicators.quote[0].close;

    // --- RSI CALC ---
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }

    const rs = gains / (losses || 1);
    const rsi = 100 - (100 / (1 + rs));

    // --- TREND ---
    const trend =
      prices[prices.length - 1] > prices[0]
        ? "UPTREND"
        : "DOWNTREND";

    res.json({ rsi: rsi.toFixed(2), trend });

  } catch (e) {
    res.status(500).json({ error: "Indicator error" });
  }
}
