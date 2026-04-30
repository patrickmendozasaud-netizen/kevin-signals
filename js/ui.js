import { STOCKS, prices, portfolio } from "./state.js";
import { getScore } from "./ai-score.js";

function fmtPrice(p){ return p == null ? "—" : `$${Number(p).toFixed(2)}`; }

function pctChange(p, prev){
  if(!p || !prev) return null;
  return ((p - prev) / prev) * 100;
}

export function renderStocks(sortBy = "score"){
  const el = document.getElementById("stocksGrid");
  if(!el) return;

  if(!STOCKS.length){
    el.innerHTML = `<div class="empty">No stocks yet</div>`;
    return;
  }

  let list = [...STOCKS];

  // 🔥 REAL RANKING
  if(sortBy === "score"){
    list.sort((a,b)=> getScore(b.ticker) - getScore(a.ticker));
  }

  if(sortBy === "movers"){
    list.sort((a,b)=>{
      const pa = pctChange(prices[a.ticker]?.price, prices[a.ticker]?.prev) || 0;
      const pb = pctChange(prices[b.ticker]?.price, prices[b.ticker]?.prev) || 0;
      return Math.abs(pb) - Math.abs(pa);
    });
  }

  el.innerHTML = list.map(s=>{
    const p = prices[s.ticker]?.price;
    const prev = prices[s.ticker]?.prev;
    const ch = pctChange(p, prev);
    const score = getScore(s.ticker);

    const cls = ch >= 0 ? "up" : "down";

    return `
      <div class="card">
        <div class="ticker">${s.ticker}</div>

        <div class="price ${cls}">
          ${fmtPrice(p)}
          ${ch ? `(${ch.toFixed(2)}%)` : ""}
        </div>

        <div style="margin-top:6px;font-size:12px;color:#94a3b8">
          Score: <b>${score}</b>
        </div>

        <button class="primary analyze-btn" data-ticker="${s.ticker}" data-price="${p || 0}">
          🤖 AI Analyze
        </button>

        <div id="ai-${s.ticker}" class="ai-line"></div>
      </div>
    `;
  }).join("");

  // ✅ FIXED BUTTON HANDLING (NO MORE BROKEN CLICKS)
  document.querySelectorAll(".analyze-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const t = btn.dataset.ticker;
      const price = Number(btn.dataset.price);
      window.analyze(t, price);
    });
  });
}

export function renderPortfolio(){
  const el = document.getElementById("portfolioGrid");
  if(!el) return;

  if(!portfolio.length){
    el.innerHTML = `<div class="empty">No AI trades yet</div>`;
    return;
  }

  el.innerHTML = portfolio.map(p=>{
    const now = prices[p.ticker]?.price || p.entry;
    const pnl = ((now - p.entry) / p.entry) * 100;

    return `
      <div class="card">
        <div class="ticker">${p.ticker}</div>
        <div class="${pnl>=0?'up':'down'}">
          ${pnl.toFixed(2)}%
        </div>
        <div style="font-size:12px">
          Entry: $${p.entry}<br>
          Now: $${now}
        </div>
      </div>
    `;
  }).join("");
}
