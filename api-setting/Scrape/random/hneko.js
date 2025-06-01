const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function getNeko() {
  try {
    const response = await axios.get('https://api.waifu.pics/nsfw/neko', {
      responseType: 'arraybuffer'
    });
    
    // Simpan gambar sementara
    const tempPath = path.join(__dirname, 'temp_neko.jpg');
    fs.writeFileSync(tempPath, response.data);
    
    return tempPath;
  } catch (error) {
    console.error('Gagal mengambil gambar neko:', error);
    throw error;
  }
}

// Fungsi untuk langsung menampilkan gambar
async function showNeko() {
  try {
    const imagePath = await getNeko();
    console.log('Gambar neko berhasil diambil!');
    
    // Jika ingin menampilkan di browser (untuk web)
    // atau mengirim melalui WhatsApp Bot, sesuaikan di sini
    
    return imagePath;
  } catch (error) {
    console.error('Gagal menampilkan gambar neko:', error);
    throw error;
  }
}

module.exports = showNeko;
