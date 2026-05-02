export async function analyzeVideo(videoId) {
try {
const res = await fetch("/api/analyze-video", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ videoId })
});

```
const data = await res.json();

console.log("VIDEO API RESPONSE:", data);

return data;
```

} catch (e) {
console.error("API ERROR:", e);
return {
summary: "❌ API failed",
tickers: []
};
}
}
