const axios = require('axios');

async function getWaifuImage() {
  try {
    // 1. Dapatkan URL gambar dari API
    const urlResponse = await axios.get('https://api.waifu.pics/sfw/waifu');
    const imageUrl = urlResponse.data.url;

    // 2. Ambil gambar langsung sebagai array buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer' // Penting untuk mendapatkan data binary
    });

    // 3. Kembalikan data gambar dengan metadata
    return {
      image: imageResponse.data, // Buffer gambar
      mimeType: imageResponse.headers['content-type'], // e.g. 'image/jpeg'
      size: imageResponse.headers['content-length'], // Ukuran file
      sourceUrl: imageUrl // URL asli
    };

  } catch (error) {
    console.error('Gagal mengambil gambar:', error);
    throw new Error('Tidak bisa mendapatkan gambar waifu: ' + error.message);
  }
}

module.exports = getWaifuImage;
