export let STOCKS = [];
export let prices = {};
export let portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");

export function saveStocks(data){
  STOCKS = data;
  localStorage.setItem("stocks", JSON.stringify(STOCKS));
}

export function savePrices(p){
  prices = p;
}

export function savePortfolio(p){
  portfolio = p;
  localStorage.setItem("portfolio", JSON.stringify(p));
}
