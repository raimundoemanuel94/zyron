export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');

  if (!q) {
    return new Response(JSON.stringify({ error: 'Faltando parâmetro de busca' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`; // sp=EgIQAQ%3D%3D filters for videos only
    
    // Performance: Edge Fetch with optimized headers
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube indisponível (Status: ${response.status})`);
    }

    const html = await response.text();
    
    // Robust Regex extraction for ytInitialData
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);

    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1]);
        
        // Deep navigation into YouTube's polymorphic JSON structure
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

        if (contents && contents.length > 0) {
          const results = contents
            .filter(c => c.videoRenderer)
            .map(c => {
               const v = c.videoRenderer;
               const id = v.videoId;
               return {
                 id: id,
                 title: v.title?.runs?.[0]?.text || 'Áudio ZYRON',
                 thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                 artist: v.ownerText?.runs?.[0]?.text || 'YouTube',
                 duration: v.lengthText?.simpleText || '?'
               };
            });

          if (results.length > 0) {
             return new Response(JSON.stringify(results.slice(0, 15)), {
               status: 200,
               headers: {
                 'Content-Type': 'application/json',
                 'Access-Control-Allow-Origin': '*',
                 'Cache-Control': 's-maxage=3600, stale-while-revalidate' // CDN Cache for 1 hour
               }
             });
          }
        }
      } catch (parseErr) {
        throw new Error('Falha ao processar estrutura do YouTube');
      }
    }

    throw new Error('Nenhum resultado encontrado no YouTube');
  } catch (error) {
    console.error('[API Search Error]:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
