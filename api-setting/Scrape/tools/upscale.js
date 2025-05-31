const axios = require('axios');
const cheerio = require('cheerio');

async function imgHd(url, scales) {
  try {
    // 1. Fetch HTML dari URL target
    const { data: html } = await axios.get(url);
    
    // 2. Load HTML ke Cheerio untuk parsing
    const $ = cheerio.load(html);
    
    // 3. Contoh scraping: ekstrak URL gambar pertama
    const imageUrl = $('img').first().attr('src');
    
    if (!imageUrl) {
      throw new Error('Tidak menemukan gambar di halaman');
    }

    // 4. Proses ke API enhancer
    const response = await axios.post('https://toolsapi.spyne.ai/api/forward', {
      image_url: imageUrl,  // Gunakan URL gambar yang discrape
      scale: scales || 2,   // Default scale 2 jika tidak diisi
      save_params: {
        extension: '.png',
        quality: 100
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      originalUrl: imageUrl,
      enhancedImage: response.data
    };

  } catch (error) {
    console.error('Error in imgHd:', error);
    throw new Error(`Gagal memproses: ${error.message}`);
  }
}

// Ekspor sebagai fungsi tunggal
module.exports = imgHd;
