const axios = require('axios');

/*
- HARGAI WOY JANGAN DIHAPUS!
- Skrep by *JH a.k.a DHIKA - FIONY BOT*
- Credits to all Fiony's Bot Admin.
- Maaf kalo kurang maksimal atau berantakan
- Hasil gabut saja xixixi.
*/

async function bilibili(bilibiliUrl) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.157 Mobile Safari/537.36',
    'Referer': 'https://download.stuff.solutions/'
  };

  try {
    const apiRes = await axios.post(
      'https://downloadapi.stuff.solutions/api/json',
      { url: bilibiliUrl },
      { headers }
    );

    if (!apiRes.data.url || apiRes.data.status !== 'stream') {
      return {
        status: 'error',
        message: 'Gagal mendapatkan link unduhan',
        data: apiRes.data
      };
    }

    return {
      status: 'success',
      message: 'Berhasil mendapatkan link BiliBili!',
      download_url: apiRes.data.url,
      original_url: bilibiliUrl,
      details: {
        quality: apiRes.data.quality || 'unknown',
        duration: apiRes.data.duration || 'unknown',
        thumbnail: apiRes.data.thumbnail || null
      }
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || error.message,
      code: error.code
    };
  }
}

module.exports = bilibili;
