import { STOCKS, prices, portfolio } from "./state.js";

export function renderStocks(){
  const el = document.getElementById("stocksGrid");

  if(!STOCKS.length){
    el.innerHTML = "No stocks";
    return;
  }

  el.innerHTML = STOCKS.map(s=>{
    const p = prices[s.ticker]?.price ?? null;
    const prev = prices[s.ticker]?.prev ?? null;

    let change = 0;
    if(p && prev){
      change = ((p - prev) / prev * 100).toFixed(2);
    }

    return `
      <div class="card">
        <b>${s.ticker}</b><br>
        <span class="${change >= 0 ? 'up' : 'down'}">
          ${p ? `$${p}` : "—"} ${p ? `(${change}%)` : ""}
        </span>
        <br>
        <button onclick="window.analyze('${s.ticker}',${p || 0})">AI</button>
        <div id="ai-${s.ticker}"></div>
      </div>
    `;
  }).join("");
}

export function renderPortfolio(){
  const el = document.getElementById("portfolioGrid");

  el.innerHTML = portfolio.map(p=>{
    const now = prices[p.ticker]?.price || p.entry;
    const pnl = ((now - p.entry)/p.entry*100).toFixed(2);

    return `
      <div class="card">
        ${p.ticker}<br>
        ${pnl}%
      </div>
    `;
  }).join("");
}
