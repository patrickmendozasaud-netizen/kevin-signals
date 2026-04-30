// ---------------- HELPERS ----------------
function fmtPrice(p){
  return p == null ? "—" : `$${Number(p).toFixed(2)}`;
}

function pct(p, prev){
  if(p == null || prev == null || !prev) return null;
  return ((p - prev) / prev * 100);
}

// ---------------- STOCKS ----------------
export function renderStocks(sortBy = null){
  const el = document.getElementById("stocksGrid");
  if(!el) return;

  if(!window.STOCKS || !window.STOCKS.length){
    el.innerHTML = `<div class="empty">No stocks yet</div>`;
    return;
  }

  let list = [...window.STOCKS];

  if(sortBy === "movers"){
    list.sort((a,b)=>{
      const pa = pct(window.prices[a.ticker]?.price, window.prices[a.ticker]?.prev) ?? 0;
      const pb = pct(window.prices[b.ticker]?.price, window.prices[b.ticker]?.prev) ?? 0;
      return Math.abs(pb) - Math.abs(pa);
    });
  }

  el.innerHTML = list.map(s=>{
    const p = window.prices[s.ticker]?.price ?? null;
    const prev = window.prices[s.ticker]?.prev ?? null;
    const change = pct(p, prev);

    return `
      <div class="card">
        <div class="ticker">${s.ticker}</div>
        <div class="price ${change >= 0 ? 'up' : 'down'}">
          ${fmtPrice(p)} ${change ? `(${change.toFixed(2)}%)` : ""}
        </div>
        <button data-ticker="${s.ticker}" class="analyzeBtn">🤖 AI Analyze</button>
        <div id="ai-${s.ticker}" style="margin-top:6px;font-size:12px"></div>
      </div>
    `;
  }).join("");

  // attach analyze buttons
  document.querySelectorAll(".analyzeBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      window.analyze(btn.dataset.ticker);
    });
  });
}

// ---------------- PORTFOLIO ----------------
export function renderPortfolio(){
  const el = document.getElementById("portfolioGrid");
  if(!el) return;

  if(!window.portfolio || !window.portfolio.length){
    el.innerHTML = `<div class="empty">No AI trades yet</div>`;
    return;
  }

  el.innerHTML = window.portfolio.map(p=>{
    const now = window.prices[p.ticker]?.price ?? p.entry;
    const pnl = ((now - p.entry)/p.entry*100).toFixed(2);

    return `
      <div class="card">
        <div class="ticker">${p.ticker}</div>
        <div class="price ${pnl>=0?'up':'down'}">${pnl}%</div>
        <div style="font-size:12px">Entry: $${p.entry}</div>
        <div style="font-size:12px">Now: ${fmtPrice(now)}</div>
      </div>
    `;
  }).join("");
}

// ---------------- AI BRIEF ----------------
export function renderBrief(data){
  const el = document.getElementById("briefOut");
  if(!el) return;

  if(!data){
    el.innerHTML = `<div class="empty">No AI brief yet</div>`;
    return;
  }

  el.innerHTML = `
    <div class="card">
      <h3>${data.verdict || "Neutral"}</h3>
      <p>${data.summary || ""}</p>
    </div>
  `;
}

// ---------------- VIDEOS ----------------
export function renderVideos(videos, onClick){
  const el = document.getElementById("videosList");
  if(!el) return;

  if(!videos || !videos.length){
    el.innerHTML = `<div class="empty">No videos</div>`;
    return;
  }

  el.innerHTML = videos.map(v=>`
    <div class="card video-item" data-id="${v.videoId}">
      <b>${v.title}</b>
    </div>
  `).join("");

  document.querySelectorAll(".video-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      const id = item.dataset.id;
      const vid = videos.find(v=>v.videoId === id);
      if(onClick) onClick(vid);
    });
  });
}
