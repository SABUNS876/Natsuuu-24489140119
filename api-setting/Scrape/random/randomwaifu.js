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
    
    // Kembalikan buffer saja (tanpa objek)
    return Buffer.from(imageResponse.data, 'binary');
  } catch (error) {
    console.error('Gagal mengambil gambar:', error);
    throw error;
  }
}

module.exports = getWaifu;
