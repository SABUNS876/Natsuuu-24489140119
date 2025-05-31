const axios = require('axios');
const cheerio = require('cheerio');

async function imgHd(url, scales = 2) {
  // Validasi input
  if (!url || typeof url !== 'string') {
    throw new Error('URL harus berupa string');
  }

  if (![1, 2, 3, 4, 5].includes(Number(scales))) {
    throw new Error('Scale harus angka 1-5');
  }

  try {
    // 1. Fetch HTML
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // 2. Parse dengan Cheerio
    const $ = cheerio.load(html);
    const imageUrl = $('img[src]').first().attr('src');

    if (!imageUrl) {
      throw new Error('Tidak menemukan gambar di HTML');
    }

    // 3. Proses enhancer
    const apiResponse = await axios.post(
      'https://toolsapi.spyne.ai/api/forward',
      {
        image_url: imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, url).href,
        scale: scales,
        save_params: { extension: '.png', quality: 100 }
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!apiResponse.data) {
      throw new Error('Response tidak valid dari enhancer API');
    }

    return {
      originalImage: imageUrl,
      enhancedData: apiResponse.data,
      metadata: {
        sourceUrl: url,
        processedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error(`Error processing ${url}:`, error);
    throw new Error(`Proses gagal: ${error.message}`);
  }
}

module.exports = imgHd;
