fetch('http://127.0.0.1:3000/api/interns').then(r => r.json()).then(data => {
  const fawwaz = data.find(i => i.name.includes('Fawwaz'));
  console.log(fawwaz);
}).catch(console.error);
