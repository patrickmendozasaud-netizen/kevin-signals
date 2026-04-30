// ---------------- GLOBAL STATE ----------------

export let STOCKS = [];
export let prices = {};
export let portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");

// ---------------- SETTERS ----------------

// replace entire stock list
export function setStocks(newStocks) {
  STOCKS.length = 0;
  newStocks.forEach(s => STOCKS.push(s));
}

// replace all prices
export function setPrices(newPrices) {
  prices = newPrices || {};
}

// update single stock score
export function setScore(ticker, score) {
  const s = STOCKS.find(x => x.ticker === ticker);
  if (s) s.score = score;
}

// ---------------- PORTFOLIO ----------------

export function addToPortfolio(trade) {
  if (portfolio.find(p => p.ticker === trade.ticker)) return;

  portfolio.push(trade);
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
}
