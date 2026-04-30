import { prices } from "./state.js";

export function getScore(ticker){
  const data = prices[ticker];
  if(!data) return 0;

  const price = data.price;
  const prev = data.prev;

  if(!price || !prev) return 0;

  // --- CORE SIGNALS ---
  const changePct = ((price - prev) / prev) * 100;

  // momentum boost (strong movers)
  const momentum = Math.abs(changePct);

  // direction weight
  const direction = changePct > 0 ? 1 : -1;

  // volatility proxy (bigger move = more attention)
  const volatility = Math.min(momentum * 2, 20);

  // --- FINAL SCORE ---
  let score =
    (momentum * 3) +        // strength
    (volatility * 1.5) +    // expansion
    (direction * 5);        // bullish vs bearish tilt

  return Number(score.toFixed(2));
}
