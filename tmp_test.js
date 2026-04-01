import fetch from 'node-fetch';

async function testSearch(query) {
  const proxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?'
  ];

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;

  for (const proxy of proxies) {
    try {
      console.log(`Buscando via proxy ${proxy}...`);
      const response = await fetch(`${proxy}${encodeURIComponent(searchUrl)}`);
      if (response.ok) {
        const text = await response.text();
        let html = text;
        try {
          const data = JSON.parse(text);
          html = data.contents || data;
        } catch(e){}
        
        console.log("HTML length:", html.length);
        const videoIds = [...html.matchAll(/"videoId":"([^"]+)"/g)].map(m => m[1]);
        const titles = [...html.matchAll(/"title":{"runs":\[{"text":"([^"]+)"\}\]/g)].map(m => m[1]);
        console.log("Found IDs:", videoIds.length);
        if (videoIds.length > 0) return true;
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
  
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.in.projectsegfau.lt',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.smnz.de'
  ];
  
  for (const api of pipedInstances) {
     try {
       console.log(`Testing piped ${api}...`);
       const res = await fetch(`${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`);
       if (res.ok) {
         const data = await res.json();
         console.log("Piped results:", data.items?.length);
         if (data.items?.length > 0) return true;
       }
     } catch (e) {
       console.log("Piped error:", e.message);
     }
  }
  
  // also check invidious instances
  const invidInstances = [
    'https://invidious.jing.rocks',
    'https://invidious.nerdvpn.de',
    'https://invidious.perennialte.chs.com'
  ];
  for (const api of invidInstances) {
     try {
       console.log(`Testing invidious ${api}...`);
       const res = await fetch(`${api}/api/v1/search?q=${encodeURIComponent(query)}`);
       if (res.ok) {
         const data = await res.json();
         console.log("Invidious results:", data?.length);
         if (data?.length > 0) return true;
       }
     } catch (e) {
       console.log("Invidious error:", e.message);
     }
  }

}

testSearch('linkin park numb');
