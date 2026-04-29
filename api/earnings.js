// Stubbed sample data. Replace later with a real earnings feed
// (e.g. Finnhub /calendar/earnings, FMP, or NASDAQ scrape).
export default function handler(req, res) {
  res.status(200).json([
    { ticker: 'AAPL', summary: 'iPhone demand strong; services growth steady.' },
    { ticker: 'MSFT', summary: 'Cloud (Azure) growth steady; Copilot adoption rising.' },
    { ticker: 'NVDA', summary: 'AI chip demand remains the dominant driver.' },
    { ticker: 'GOOGL', summary: 'Search resilient; cloud margins improving.' },
    { ticker: 'AMZN', summary: 'AWS reaccelerating; ads continuing to scale.' },
  ]);
}
