const axios = require('axios');

async function getWaifu() {
  try {
    // Dapatkan URL gambar terlebih dahulu
    const urlResponse = await axios.get('https://api.waifu.pics/sfw/waifu');
    const imageUrl = urlResponse.data.url;
    
    // Ambil gambar sebagai buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    // Kembalikan sebagai buffer dengan content type
    return {
      imageBuffer: Buffer.from(imageResponse.data, 'binary'),
      contentType: imageResponse.headers['content-type']
    };
    
    // Atau bisa juga langsung return Buffer saja:
    // return Buffer.from(imageResponse.data, 'binary');
  } catch (error) {
    console.error('Error getting waifu image:', error);
    throw error;
  }
}

module.exports = getWaifu;
