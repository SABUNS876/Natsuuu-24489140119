const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVeoAI(prompt, options = {}) {
  // Default options
  const { 
    quality = '720p',
    duration = '30s',
    style = 'realistic',
    verbose = false
  } = options;

  // Validasi input
  const validQualities = ['360p', '480p', '720p', '1080p'];
  const validDurations = ['15s', '30s', '60s'];
  const validStyles = ['realistic', 'anime', 'cartoon', '3d'];

  if (!prompt) throw new Error('Prompt diperlukan');
  if (!validQualities.includes(quality)) throw new Error(`Kualitas tidak valid. Pilih: ${validQualities.join(', ')}`);
  if (!validDurations.includes(duration)) throw new Error(`Durasi tidak valid. Pilih: ${validDurations.join(', ')}`);
  if (!validStyles.includes(style)) throw new Error(`Style tidak valid. Pilih: ${validStyles.join(', ')}`);

  try {
    // 1. Dapatkan CSRF token
    if (verbose) console.log('Mengambil CSRF token...');
    const homeResponse = await axios.get('https://veo.ai', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(homeResponse.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    if (!csrfToken) throw new Error('Gagal mendapatkan CSRF token');

    // 2. Generate video
    if (verbose) console.log('Memulai proses generate video...');
    const generateResponse = await axios.post('https://veo.ai/api/v1/videos/generate', {
      prompt,
      quality,
      duration,
      style
    }, {
      timeout: 30000,
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const videoId = generateResponse.data.video_id;
    if (!videoId) throw new Error('Gagal memulai proses generate video');

    // 3. Pantau status render
    if (verbose) console.log('Memantau status render...');
    let videoUrl;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      attempts++;
      if (verbose) console.log(`Pengecekan status ke-${attempts}`);
      
      try {
        const statusResponse = await axios.get(`https://veo.ai/api/v1/videos/status/${videoId}`, {
          timeout: 10000
        });

        if (statusResponse.data.status === 'completed') {
          videoUrl = statusResponse.data.video_url;
          break;
        } else if (statusResponse.data.status === 'failed') {
          throw new Error('Render video gagal');
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          if (verbose) console.log('Timeout pengecekan status, mencoba lagi...');
          continue;
        }
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!videoUrl) throw new Error('Proses render melebihi batas waktu');

    // 4. Kembalikan URL video tanpa download
    return {
      status: true,
      videoUrl,
      metadata: {
        prompt,
        quality,
        duration,
        style,
        videoId
      }
    };

  } catch (error) {
    if (verbose) console.error('Error:', error);
    
    return {
      status: false,
      error: error.message,
      metadata: {
        prompt,
        quality,
        duration,
        style
      }
    };
  }
}

// Contoh penggunaan
if (require.main === module) {
  (async () => {
    const result = await scrapeVeoAI('pemandangan gunung', {
      quality: '720p',
      duration: '30s',
      verbose: true
    });

    if (result.status) {
      console.log('Berhasil!');
      console.log('URL Video:', result.videoUrl);
      console.log('Metadata:', result.metadata);
    } else {
      console.error('Gagal:', result.error);
    }
  })();
}

module.exports = scrapeVeoAI;
