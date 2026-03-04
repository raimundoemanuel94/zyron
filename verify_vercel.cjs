const https = require('https');

https.get('https://axiron.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const jsMatch = data.match(/\/assets\/index-[^"]+\.js/);
    if (jsMatch) {
      console.log('Found JS bundle:', jsMatch[0]);
      https.get('https://axiron.vercel.app' + jsMatch[0], (jsRes) => {
        let jsData = '';
        jsRes.on('data', chunk => jsData += chunk);
        jsRes.on('end', () => {
          console.log("Searching for Brutalist code...");
          if (jsData.includes('INICIAR SÉRIE') || jsData.includes('Técnica Industrial') || jsData.includes('FINALIZAR SÉRIE')) {
             console.log('✅ SUCCESS: The New "Industrial Workout UX" code IS PRESENT and active on the live Vercel server.');
          } else {
             console.log('❌ FAILURE: The New UI code is NOT PRESENT in the live bundle.');
          }
        });
      });
    } else {
        console.log('Could not find JS bundle.');
    }
  });
});
