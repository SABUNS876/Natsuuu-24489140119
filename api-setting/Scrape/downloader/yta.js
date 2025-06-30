const axios = require('axios');
const qs = require('querystring');

function validateYouTubeUrl(url) {
  // Pengecekan lebih komprehensif untuk berbagai format URL YouTube
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^https?:\/\/youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/youtube\.com\/shorts\/[\w-]+/,
    /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/www\.youtube\.com\/embed\/[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

async function youtubeAudioDownloader(url) {
  // Validasi URL yang lebih baik
  if (!url || !validateYouTubeUrl(url)) {
    throw new Error('URL YouTube tidak valid. Contoh URL valid: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }

  // Bersihkan URL dari parameter tambahan jika ada
  const cleanUrl = url.split('&')[0];
  const payload = qs.stringify({ url: cleanUrl });

  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://www.videodowns.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    // Step 1: Get video info
    const { data } = await axios.post(
      'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
      payload,
      { headers, timeout: 10000 } // Timeout 10 detik
    );

    // Debug: Lihat respons API
    console.log('API Response:', JSON.stringify(data, null, 2));

    // Step 2: Extract audio download URL
    let audioUrl;
    if (data.formats?.audio) {
      audioUrl = `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(cleanUrl)}&format=audio`;
    } else if (data.links?.audio) {
      audioUrl = data.links.audio;
    } else {
      throw new Error('URL audio tidak ditemukan dalam respons API');
    }

    // Step 3: Download the audio file directly
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'referer': 'https://www.videodowns.com/'
      },
      timeout: 30000 // Timeout 30 detik untuk download
    });

    return {
      status: true,
      audioBuffer: audioResponse.data,
      contentType: 'audio/mpeg',
      metadata: {
        title: data.info?.title || 'YouTube Audio',
        duration: data.info?.duration || null,
        thumbnail: data.thumbnail || null,
        originalUrl: cleanUrl
      }
    };

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      url: url
    });
    
    throw new Error(`Gagal mengunduh audio: ${error.message}`);
  }
}

module.exports = youtubeAudioDownloader;
