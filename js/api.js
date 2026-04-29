export async function fetchPrices(tickers){
  const res = await fetch("/api/prices", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ tickers })
  });

  if(!res.ok) throw new Error("Prices API failed");

  return await res.json();
}

export async function analyzeStock(ticker, price){
  const res = await fetch("/api/analyze-stock", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ ticker, price })
  });

  if(!res.ok) throw new Error("AI failed");

  return await res.json();
}
