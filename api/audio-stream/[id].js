export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { id } = req.query;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing video ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Proxy para Piped Streams API com CORS fix
    const pipedUrl = `https://pipedapi.kavin.rocks/streams/${id}`;
    
    const response = await fetch(pipedUrl, {
      headers: {
        'User-Agent': 'ZYRON-Audio-Proxy/1.0',
        'Accept': 'application/json',
        'Origin': 'https://axiron.vercel.app'
      }
    });

    if (!response.ok) {
      throw new Error(`Piped API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrair stream de áudio de maior qualidade
    const audioStreams = data.audioStreams || [];
    const bestAudio = audioStreams.find(s => s.format === 'webm') || 
                      audioStreams.find(s => s.format === 'mp4') || 
                      audioStreams[0];

    if (!bestAudio) {
      return new Response(JSON.stringify({ 
        error: 'No audio stream found',
        availableStreams: audioStreams.length 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Retornar URL do stream de áudio
    const result = {
      videoId: id,
      audioUrl: bestAudio.url,
      format: bestAudio.format,
      quality: bestAudio.quality,
      bitrate: bestAudio.bitrate,
      title: data.title || 'Unknown',
      uploader: data.uploader || 'Unknown'
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // 5 minutos
      }
    });

  } catch (error) {
    console.error('Audio Stream Proxy Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      videoId: id,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
