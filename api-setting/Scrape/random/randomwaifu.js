const axios = require('axios');

async function getWaifu() {
  try {
    // Pertama dapatkan URL gambar
    const urlResponse = await axios.get('https://api.waifu.pics/sfw/waifu');
    const imageUrl = urlResponse.data.url;
    
    // Kemudian ambil gambar sebagai buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    // Kembalikan objek dengan buffer dan content type
    return {
      imageBuffer: Buffer.from(imageResponse.data, 'binary'),
      contentType: imageResponse.headers['content-type']
    };
  } catch (error) {
    console.error('Gagal mengambil gambar:', error);
    throw error;
  }
}

module.exports = getWaifu;
