export let STOCKS = [];
export let prices = {};
export const getPrices = () => prices;
export let portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");

export function setStocks(s){
  STOCKS.length = 0;
  STOCKS.push(...s);
}

export function setPrices(p){
  for(const k in p){
    prices[k] = p[k];
  }
}

export function addToPortfolio(p){
  if(portfolio.find(x=>x.ticker===p.ticker)) return;

  portfolio.push({
    ticker: p.ticker,
    entry: p.entry,
    time: Date.now()
  });

  localStorage.setItem("portfolio", JSON.stringify(portfolio));
}
