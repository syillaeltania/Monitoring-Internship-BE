fetch('http://127.0.0.1:3000/api/costs?year=2026').then(r => r.json()).then(d => {
  console.log('trend:', d.trend?.length);
  console.log('costTrend:', d.costTrend?.length);
  if(d.costTrend && d.costTrend.length > 0) console.log(d.costTrend[0]);
}).catch(console.error);
