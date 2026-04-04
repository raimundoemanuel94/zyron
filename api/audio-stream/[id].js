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
    console.log(`🎵 Buscando stream para video ID: ${id}`);
    
    // Proxy para Piped Streams API com CORS fix
    const pipedUrl = `https://pipedapi.kavin.rocks/streams/${id}`;
    
    const response = await fetch(pipedUrl, {
      headers: {
        'User-Agent': 'ZYRON-Audio-Proxy/1.0',
        'Accept': 'application/json',
        'Origin': 'https://axiron.vercel.app',
        'Referer': 'https://axiron.vercel.app/'
      },
      // Timeout manual para Vercel Edge Runtime
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });

    if (!response.ok) {
      console.error(`Piped API error: ${response.status} for ${id}`);
      throw new Error(`Piped API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Piped response received for ${id}`);
    
    // Extrair stream de áudio de maior qualidade
    const audioStreams = data.audioStreams || [];
    const bestAudio = audioStreams.find(s => s.format === 'webm' && s.quality === 'best') || 
                      audioStreams.find(s => s.format === 'mp4') || 
                      audioStreams.find(s => s.format === 'webm') || 
                      audioStreams[0];

    if (!bestAudio) {
      console.warn(`No audio stream found for ${id}. Available streams:`, audioStreams.length);
      return new Response(JSON.stringify({ 
        error: 'No audio stream found',
        videoId: id,
        availableStreams: audioStreams.length,
        message: 'Nenhum stream de áudio encontrado'
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
      uploader: data.uploader || 'Unknown',
      duration: data.duration || 0,
      thumbnail: data.thumbnail || null
    };

    console.log(`✅ Stream encontrado para ${id}: ${bestAudio.format} ${bestAudio.quality || ''}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // 5 minutos
      }
    });

  } catch (error) {
    console.error('Audio Stream Proxy Error:', error);
    
    // Tratar diferentes tipos de erro
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout ao buscar stream';
      statusCode = 408;
    } else if (error.message.includes('404')) {
      errorMessage = 'Vídeo não encontrado';
      statusCode = 404;
    } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
      errorMessage = 'Erro de CORS - bloqueado pelo servidor';
      statusCode = 403;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      videoId: id,
      details: error.message,
      timestamp: new Date().toISOString(),
      suggestion: 'Tente usar o YouTube iframe diretamente'
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}
