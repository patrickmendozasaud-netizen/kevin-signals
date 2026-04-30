import { STOCKS, prices, portfolio } from "./state.js";

function fmtPrice(p) { return p == null ? "—" : `$${Number(p).toFixed(2)}`; }
function pctChange(p, prev) {
  if (p == null || prev == null || !prev) return null;
  return ((p - prev) / prev) * 100;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="ticker">${esc(s.ticker)}</div>
            <div class="price ${cls}">${fmtPrice(p)}<span style="font-size:11px;font-weight:500">${chTxt}</span></div>
          </div>
        </div>
        <button class="primary" style="margin-top:10px;width:100%;padding:8px;font-size:12px"
          onclick="window.analyze('${esc(s.ticker)}', ${p ?? 0})">🤖 AI Analyze</button>
        <div id="ai-${esc(s.ticker)}" style="margin-top:8px;font-size:12px;line-height:1.5"></div>
      </div>
    `;
  }).join("");
}

export function renderPortfolio() {
  const el = document.getElementById("portfolioGrid");
  if (!el) return;
  if (!portfolio.length) {
    el.innerHTML = `<div class="empty">No AI picks yet. Run "AI Analyze" on a stock — any BUY with confidence > 70% lands here.</div>`;
    return;
  }
  el.innerHTML = portfolio.map(p => {
    const now = prices[p.ticker]?.price ?? p.entry;
    const pnl = p.entry ? ((now - p.entry) / p.entry) * 100 : 0;
    const cls = pnl >= 0 ? "up" : "down";
    return `
<div class="card">

  <div style="display:flex;justify-content:space-between;">
    <div>
      <div class="ticker">${esc(s.ticker)}</div>
      <div class="price ${cls}">
        ${fmtPrice(p)}
        <span style="font-size:11px">${chTxt}</span>
      </div>
    </div>

    <div class="badge blue">
      ${esc(s.signal || "WATCH")}
    </div>
  </div>

  <!-- ENTRY ZONES -->
  <div style="margin-top:8px;font-size:11px;color:var(--muted)">
    ${s.entry ? `Entry: $${esc(s.entry)}<br>` : ""}
    ${s.target ? `Target: $${esc(s.target)}<br>` : ""}
    ${s.stop ? `Stop: $${esc(s.stop)}` : ""}
  </div>

  <button class="primary analyze-btn"
    data-ticker="${esc(s.ticker)}"
    data-price="${p ?? 0}"
    style="margin-top:10px;width:100%">
    🤖 AI Analyze
  </button>

  <div id="ai-${esc(s.ticker)}" class="ai-line"></div>

</div>
`;
  }).join("");
}

export function renderBrief(brief) {
  const el = document.getElementById("briefOut");
  if (!el) return;
  if (!brief) {
    el.innerHTML = `<div class="empty">No brief yet. Paste a report on the Import tab — the AI will write its independent take.</div>`;
    return;
  }

  const verdict = (brief.verdict || "NEUTRAL").toUpperCase();
  const verdictCls = verdict === "BULLISH" ? "buy" : verdict === "BEARISH" ? "sell" : "hold";
  const watchFor = Array.isArray(brief.watch_for) ? brief.watch_for : [];
  const catalysts = Array.isArray(brief.catalysts) ? brief.catalysts : [];
  const picks = Array.isArray(brief.picks) ? brief.picks : [];

  const itemText = (x) => typeof x === "string" ? esc(x) : esc(x?.point || x?.text || JSON.stringify(x));

  el.innerHTML = `
    <div class="section">
      <h3>Overall Verdict <span class="badge ${verdictCls}" style="margin-left:8px">${esc(verdict)}</span></h3>
      <div style="line-height:1.65;font-size:14px">${esc(brief.overall_take || "")}</div>
    </div>

    ${watchFor.length ? `
    <div class="section">
      <h3>👀 Watch For</h3>
      <ul style="margin:0;padding-left:20px;line-height:1.8;font-size:14px">
        ${watchFor.map(w => `<li>${itemText(w)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${catalysts.length ? `
    <div class="section">
      <h3>⚡ Catalysts</h3>
      <ul style="margin:0;padding-left:20px;line-height:1.8;font-size:14px">
        ${catalysts.map(c => `<li>${itemText(c)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${picks.length ? `
    <div class="section">
      <h3>🎯 AI Picks</h3>
      <div class="grid">
        ${picks.map(p => {
          const action = (p.action || "HOLD").toUpperCase();
          const cls = action === "BUY" ? "buy" : action === "SELL" ? "sell" : "hold";
          return `
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div class="ticker">${esc(p.ticker || "?")}</div>
                <span class="badge ${cls}">${esc(action)}</span>
              </div>
              ${p.price_action ? `<div style="margin-top:6px;font-size:12px;line-height:1.5"><b style="color:var(--blue-lt)">Price Action:</b> <span style="color:var(--muted)">${esc(p.price_action)}</span></div>` : ""}
              ${p.catalyst ? `<div style="margin-top:6px;font-size:12px;line-height:1.5"><b style="color:var(--watch-lt)">Catalyst:</b> <span style="color:var(--muted)">${esc(p.catalyst)}</span></div>` : ""}
              ${p.reason ? `<div style="margin-top:6px;font-size:12px;line-height:1.5;color:var(--muted)">${esc(p.reason)}</div>` : ""}
              ${(p.entry||p.target||p.stop) ? `<div style="margin-top:8px;font-family:var(--mono);font-size:11px;color:var(--muted)">${p.entry?`E:$${esc(p.entry)} `:""}${p.target?`T:$${esc(p.target)} `:""}${p.stop?`S:$${esc(p.stop)}`:""}</div>` : ""}
            </div>`;
        }).join("")}
      </div>
    </div>` : ""}
  `;
}

export function renderVideos(videos, onPick) {
  const el = document.getElementById("videosList");
  if (!el) return;
  if (!Array.isArray(videos) || !videos.length) {
    el.innerHTML = `<div class="empty">No videos found.</div>`;
    return;
  }
  el.innerHTML = videos.slice(0, 12).map((v, i) => {
    const date = v.published ? new Date(v.published).toLocaleDateString() : "";
    const thumb = v.thumbnail ? `style="background-image:url('${esc(v.thumbnail)}')"` : "";
    return `
      <div class="video-card" data-idx="${i}">
        <div class="video-thumb" ${thumb}></div>
        <div class="video-meta">
          <div>
            <div class="video-title">${esc(v.title || "")}</div>
            <div class="video-date">${esc(date)}</div>
          </div>
          <div><button class="primary" style="padding:5px 10px;font-size:11px">🤖 Analyze</button></div>
        </div>
      </div>
    `;
  }).join("");
  el.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = +card.dataset.idx;
      const v = videos[idx];
      if (v && typeof onPick === "function") onPick(v);
    });
  });
}
