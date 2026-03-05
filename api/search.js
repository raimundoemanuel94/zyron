export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with status: ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);

    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

      if (contents && contents.length > 0) {
        const results = contents
          .filter(c => c.videoRenderer)
          .map(c => {
             const id = c.videoRenderer.videoId;
             return {
               id: id,
               title: c.videoRenderer.title?.runs?.[0]?.text || 'ZYRON Audio',
               thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
               artist: c.videoRenderer.ownerText?.runs?.[0]?.text || 'YouTube'
             };
          });

        if (results.length > 0) {
           return new Response(JSON.stringify(results.slice(0, 15)), {
             status: 200,
             headers: {
               'Content-Type': 'application/json',
               'Access-Control-Allow-Origin': '*'
             }
           });
        }
      }
    }

    throw new Error('Could not parse YouTube results');
  } catch (error) {
    console.error('Search API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
