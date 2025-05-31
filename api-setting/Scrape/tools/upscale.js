const axios = require('axios');

async function upscaleImage(imageUrl, scale = 2) {
  const apiUrl = 'https://toolsapi.spyne.ai/api/forward';
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'origin': 'https://spyne.ai',
    'referer': 'https://spyne.ai/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  const data = {
    image_url: imageUrl,
    scale: scale,
    save_params: {
      extension: '.png',
      quality: 100
    }
  };

  try {
    // 1. Validasi input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('URL gambar harus berupa string');
    }

    if (![1, 2, 3, 4].includes(Number(scale))) {
      throw new Error('Scale harus antara 1-4');
    }

    // 2. Kirim request ke API upscale
    const response = await axios.post(apiUrl, data, { 
      headers,
      timeout: 30000 
    });

    // 3. Validasi response
    if (!response.data) {
      throw new Error('Tidak menerima data gambar yang valid');
    }

    // 4. Ambil gambar hasil upscale langsung
    const resultImage = await axios.get(response.data.processed_url, {
      responseType: 'arraybuffer'
    });

    return {
      originalUrl: imageUrl,
      upscaledImage: resultImage.data,
      contentType: resultImage.headers['content-type'],
      scale: scale,
      metadata: {
        processingTime: response.data.processing_time,
        apiResponse: response.data
      }
    };

  } catch (error) {
    console.error('Upscale error:', error);
    throw new Error(`Gagal meng-upscale gambar: ${error.message}`);
  }
}

module.exports = upscaleImage;
