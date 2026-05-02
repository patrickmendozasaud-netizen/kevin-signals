import { getPrices } from "./state.js";

export function getScore(ticker){
  const d = getPrices()[ticker];
  if(!d || !d.price || !d.prev) return 0;

  const price = d.price;
  const prev = d.prev;

  const changePct = ((price - prev) / prev) * 100;

  const momentum = Math.abs(changePct);      // strength of move
  const direction = changePct > 0 ? 1 : -1;  // bullish vs bearish
  const volatility = Math.min(momentum * 2, 20);

  const score =
    (momentum * 3) +        // main driver
    (volatility * 1.5) +    // expansion
    (direction * 5);        // bias

  return Number(score.toFixed(2));
}
