export default function handler(req, res) {
  res.json([
    { ticker: "AAPL", summary: "iPhone demand strong" },
    { ticker: "MSFT", summary: "Cloud growth steady" },
    { ticker: "NVDA", summary: "AI demand remains high" }
  ]);
}
