const axios = require('axios');
const FormData = require('form-data');

async function BiliBiliToCatbox(bilibiliUrl) {
  try {
    // Validasi URL Bilibili
    if (!bilibiliUrl || typeof bilibiliUrl !== 'string' || !bilibiliUrl.includes('bilibili')) {
      throw new Error('URL Bilibili tidak valid');
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.157 Mobile Safari/537.36',
      'Referer': 'https://www.bilibili.com/'
    };

    // Langkah 1: Dapatkan URL download dari Bilibili
    const apiRes = await axios.post(
      'https://downloadapi.stuff.solutions/api/json',
      { url: bilibiliUrl },
      { headers }
    );

    if (!apiRes.data.url || apiRes.data.status !== 'stream') {
      throw new Error('Gagal mendapatkan URL stream dari Bilibili');
    }

    const videoUrl = apiRes.data.url;

    // Langkah 2: Upload langsung ke Catbox
    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('url', videoUrl);

    const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 3000000 // Timeout 30 detik
    });

    if (!uploadRes.data || typeof uploadRes.data !== 'string') {
      throw new Error('Gagal mengupload ke Catbox');
    }

    return {
      status: 'success',
      catboxUrl: uploadRes.data,
      originalUrl: bilibiliUrl,
      message: 'Video berhasil diupload ke Catbox'
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

module.exports = BiliBiliToCatbox;
