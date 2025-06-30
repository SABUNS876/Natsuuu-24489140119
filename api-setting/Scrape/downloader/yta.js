const axios = require('axios');
const qs = require('querystring');

async function youtubeAudioDownloader(url) {
  /*
   * Modified by: [Your Name]
   * Original Credits: JH a.k.a DHIKA - FIONY BOT
   * Function: Downloads YouTube audio and returns as buffer
   */
  
  if (!url || !url.includes('youtube.com')) {
    throw new Error('URL YouTube tidak valid');
  }

  const payload = qs.stringify({ url });
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
      { headers }
    );

    // Step 2: Extract audio download URL
    const audioUrl = data.formats?.audio 
      ? `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(url)}&format=audio`
      : null;

    if (!audioUrl) {
      throw new Error('Tidak dapat menemukan URL audio');
    }

    // Step 3: Download the audio file directly
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    return {
      status: true,
      audioBuffer: audioResponse.data,
      contentType: 'audio/mpeg',
      metadata: {
        title: data.info?.title || 'YouTube Audio',
        duration: data.info?.duration || null,
        thumbnail: data.thumbnail || null
      }
    };

  } catch (error) {
    console.error('Error in youtubeAudioDownloader:', error);
    return {
      status: false,
      message: error.message,
      error: error.response?.data || null
    };
  }
}

module.exports = youtubeAudioDownloader;
