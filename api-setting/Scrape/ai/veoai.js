const axios = require('axios');
const cheerio = require('cheerio');

// Config dengan timeout dan retry
const CONFIG = {
  baseUrl: 'https://veo.ai',
  timeout: 15000, // 15 detik
  retries: 3,
  retryDelay: 2000, // 2 detik
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json'
  }
};

async function makeRequest(url, options = {}, retries = CONFIG.retries) {
  try {
    const response = await axios({
      url,
      method: options.method || 'get',
      data: options.data,
      headers: { ...CONFIG.headers, ...options.headers },
      timeout: CONFIG.timeout,
      responseType: options.responseType || 'json'
    });
    return response.data;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return makeRequest(url, options, retries - 1);
    }
    throw error;
  }
}

async function veoVideo(prompt, { quality = '720p', duration = '30s' } = {}) {
  try {
    // Validasi parameter
    const qualityList = ['360p', '480p', '720p', '1080p'];
    const durationList = ['15s', '30s', '60s'];
    
    if (!prompt) throw new Error('Prompt is required');
    if (!qualityList.includes(quality)) throw new Error(`Kualitas tersedia: ${qualityList.join(', ')}`);
    if (!durationList.includes(duration)) throw new Error(`Durasi tersedia: ${durationList.join(', ')}`);

    // 1. Dapatkan CSRF token
    const homePage = await makeRequest(`${CONFIG.baseUrl}/`);
    const $ = cheerio.load(homePage);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');

    if (!csrfToken) throw new Error('Gagal mendapatkan CSRF token');

    // 2. Generate video
    const generateData = await makeRequest(`${CONFIG.baseUrl}/api/v1/videos/generate`, {
      method: 'post',
      data: {
        prompt,
        quality,
        duration,
        style: 'realistic'
      },
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json'
      }
    });

    const videoId = generateData.video_id;
    if (!videoId) throw new Error('Gagal memulai proses generate video');

    // 3. Pantau status render
    let videoUrl;
    let attempts = 0;
    const maxAttempts = 20; // Maksimal 20x cek status (sekitar 1 menit)
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusData = await makeRequest(`${CONFIG.baseUrl}/api/v1/videos/status/${videoId}`);
      
      if (statusData.status === 'completed') {
        videoUrl = statusData.video_url;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('Proses render video gagal');
      }
    }

    if (!videoUrl) throw new Error('Proses render terlalu lama');

    // 4. Download video
    const videoResponse = await axios({
      url: videoUrl,
      method: 'get',
      responseType: 'stream',
      timeout: 30000, // 30 detik untuk download
      headers: {
        'Referer': `${CONFIG.baseUrl}/`
      }
    });

    return videoResponse.data;

  } catch (error) {
    console.error('Error Veo.ai:', error.message);
    
    // Cek jenis error koneksi
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      throw new Error('Server Veo.ai tidak merespon. Coba lagi nanti atau periksa koneksi internet Anda.');
    } else if (error.response) {
      // Error dari response API
      throw new Error(`Server mengembalikan error: ${error.response.status} ${error.response.statusText}`);
    } else {
      throw new Error(`Gagal membuat video: ${error.message}`);
    }
  }
}

// Contoh penggunaan
async function test() {
  try {
    console.log('Memulai proses generate video...');
    const videoStream = await veoVideo('sunset at beach with waves', {
      quality: '720p',
      duration: '30s'
    });

    const fs = require('fs');
    const writer = fs.createWriteStream('veo_output.mp4');
    videoStream.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Video berhasil disimpan sebagai veo_output.mp4');
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Jalankan jika file di-execute langsung
if (require.main === module) {
  test();
}

module.exports = veoVideo;
