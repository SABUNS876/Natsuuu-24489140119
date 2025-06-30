const axios = require('axios');
const qs = require('querystring');

async function downloadYouTubeAudio(url) {
  // Validasi URL YouTube
  if (!url || !/(youtube\.com|youtu\.be)/.test(url)) {
    throw new Error('URL YouTube tidak valid');
  }

  const payload = qs.stringify({ url });
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://www.videodowns.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  // Dapatkan info video
  const { data } = await axios.post(
    'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
    payload,
    { headers }
  );

  // Dapatkan URL audio
  const audioUrl = `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(url)}&format=audio`;

  // Download audio langsung
  const response = await axios.get(audioUrl, {
    responseType: 'arraybuffer',
    headers: {
      'user-agent': headers['user-agent']
    }
  });

  // Return hanya buffer audio
  return response.data;
}

module.exports = downloadYouTubeAudio;
