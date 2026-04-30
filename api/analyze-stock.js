return res.json({
  decision: ai.decision || "HOLD",
  confidence: ai.confidence || 50,
  entry: ai.entry ?? price,
  target: ai.target ?? price * 1.05,
  stop: ai.stop ?? price * 0.97,
  score: ai.score ?? ai.confidence ?? 50,
  reason: ai.reason || "No clear signal"
});
