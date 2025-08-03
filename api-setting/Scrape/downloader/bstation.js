const axios = require('axios');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

/*
- HARGAI WOY JANGAN DIHAPUS!
- Skrep by *JH a.k.a DHIKA - FIONY BOT*
- Credits to all Fiony's Bot Admin.
- Maaf kalo kurang maksimal atau berantakan
- Hasil gabut saja xixixi.
*/

async function bilibili(bilibiliUrl) {
  const jantung = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.157 Mobile Safari/537.36',
    'Referer': 'https://download.stuff.solutions/'
  };

  try {
    const apiRes = await axios.post(
      'https://downloadapi.stuff.solutions/api/json',
      { url: bilibiliUrl },
      { headers: jantung }
    );

    if (!apiRes.data.url || apiRes.data.status !== 'stream') {
      return {
        status: 'error',
        message: 'Failed to get video URL',
        data: apiRes.data
      };
    }

    const streamUrl = apiRes.data.url;

    return {
      status: 'ok',
      message: 'Video BiliBili berhasil di-download!',
      url: streamUrl,
      source: bilibiliUrl
    };

  } catch (e) {
    let detail = '';
    try {
      if (e.response && e.response.data && typeof e.response.data === 'object') {
        detail = JSON.stringify(e.response.data, null, 2);
      } else if (e.response && typeof e.response.data === 'string') {
        detail = e.response.data;
      } else {
        detail = e.message || e.toString();
      }
    } catch (err2) {
      detail = e.message || e.toString();
    }
    return {
      status: 'error',
      message: detail
    };
  }
}

module.exports = bilibili;
