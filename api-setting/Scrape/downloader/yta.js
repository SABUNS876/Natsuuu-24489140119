const axios = require('axios');
const qs = require('querystring');

async function downloadYouTubeAudio(url, res) {
  try {
    // Validasi cepat URL
    if (!url || !url.includes('youtu')) {
      throw new Error('URL YouTube tidak valid');
    }

    const headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://www.videodowns.com',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    };

    // Step 1: Get download link (timeout 5 detik)
    const { data } = await axios.post(
      'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
      qs.stringify({ url }),
      { headers, timeout: 5000 }
    );

    if (!data.formats?.audio) {
      throw new Error('Tidak bisa mendapatkan link download');
    }

    const audioUrl = `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(url)}&format=audio`;

    // Step 2: Stream langsung ke response
    const audioStream = await axios.get(audioUrl, {
      responseType: 'stream',
      headers: {
        'user-agent': headers['user-agent'],
        'accept-encoding': 'identity' // Nonaktifkan kompresi
      },
      timeout: 30000 // Timeout 30 detik
    });

    // Set header dan stream audio
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline'
    });

    audioStream.data.pipe(res);

  } catch (error) {
    console.error('Error:', error.message);
    if (!res.headersSent) {
      res.status(500).send('Gagal mengunduh audio: ' + error.message);
    }
  }
}

module.exports = downloadYouTubeAudio;
