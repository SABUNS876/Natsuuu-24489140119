const axios = require('axios');

async function getWaifu() {
  try {
    // Dapatkan URL gambar
    const urlResponse = await axios.get('https://api.waifu.pics/sfw/waifu');
    const imageUrl = urlResponse.data.url;
    
    // Ambil gambar sebagai buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    return {
      buffer: Buffer.from(imageResponse.data, 'binary'),
      url: imageUrl
    };
  } catch (error) {
    console.error('Gagal mengambil gambar:', error);
    throw error;
  }
}

module.exports = getWaifu;
