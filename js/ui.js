import { STOCKS, prices, portfolio } from "./state.js";

function fmtPrice(p) { return p == null ? "—" : `$${Number(p).toFixed(2)}`; }
function pctChange(p, prev) {
  if (p == null || prev == null || !prev) return null;
  return ((p - prev) / prev) * 100;
}

export function renderStocks(sortBy = null) {
  const el = document.getElementById("stocksGrid");
  if (!el) return;

  if (!STOCKS.length) {
    el.innerHTML = `<div class="empty">No stocks yet. Paste a report on the Import tab.</div>`;
    return;
  }

  let list = [...STOCKS];
  if (sortBy === "movers") {
    list.sort((a, b) => {
      const ca = Math.abs(pctChange(prices[a.ticker]?.price, prices[a.ticker]?.prev) ?? 0);
      const cb = Math.abs(pctChange(prices[b.ticker]?.price, prices[b.ticker]?.prev) ?? 0);
      return cb - ca;
    });
  }

  el.innerHTML = list.map(s => {
    const p = prices[s.ticker]?.price ?? null;
    const prev = prices[s.ticker]?.prev ?? null;
    const ch = pctChange(p, prev);
    const cls = ch == null ? "" : (ch >= 0 ? "up" : "down");
    const chTxt = ch == null ? "" : ` ${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`;
    return `
      <div class="card">
        <div class="ticker">${s.ticker}</div>
        <div class="price ${cls}">${fmtPrice(p)}${chTxt}</div>
        <button onclick="window.analyze('${s.ticker}', ${p ?? 0})">🤖 AI Analyze</button>
        <div id="ai-${s.ticker}" class="ai-out"></div>
      </div>
    `;
  }).join("");
}

export function renderPortfolio() {
  const el = document.getElementById("portfolioGrid");
  if (!el) return;
  if (!portfolio.length) {
    el.innerHTML = `<div class="empty">No AI picks yet. Analyze stocks to populate this.</div>`;
    return;
  }
  el.innerHTML = portfolio.map(p => {
    const now = prices[p.ticker]?.price ?? p.entry;
    const pnl = p.entry ? ((now - p.entry) / p.entry) * 100 : 0;
    const cls = pnl >= 0 ? "up" : "down";
    return `
      <div class="card">
        <div class="ticker">${p.ticker}</div>
        <div class="price ${cls}">${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%</div>
        <div style="font-size:11px;color:#94a3b8">Entry: $${Number(p.entry).toFixed(2)}</div>
      </div>
    `;
  }).join("");
}
