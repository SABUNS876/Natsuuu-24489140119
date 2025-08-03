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

async function JHBiliBili(bilibiliUrl) {
  const jantung = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.157 Mobile Safari/537.36',
    'Referer': 'https://download.stuff.solutions/'
  };

  try {
    // Validasi URL input
    if (!bilibiliUrl || typeof bilibiliUrl !== 'string' || !bilibiliUrl.includes('bilibili')) {
      throw new Error('URL Bilibili tidak valid');
    }

    const apiRes = await axios.post(
      'https://downloadapi.stuff.solutions/api/json',
      { url: bilibiliUrl },
      { headers: jantung }
    );

    if (!apiRes.data.url || apiRes.data.status !== 'stream') {
      return { error: 'Gagal mendapatkan URL stream', apiResponse: apiRes.data };
    }

    const streamUrl = apiRes.data.url;
    const videoRes = await axios.get(streamUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(videoRes.data);

    const now = Date.now();
    const inputFile = `temp_${now}.mp4`;
    const outputFile = `output_${now}.mp4`;

    fs.writeFileSync(inputFile, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-movflags +faststart',
          '-preset veryfast',
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-level 3.0'
        ])
        .format('mp4')
        .save(outputFile)
        .on('end', resolve)
        .on('error', reject);
    });

    const videoBuffer = fs.readFileSync(outputFile);

    // Hapus file temporary
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);

    return {
      status: 'success',
      videoBuffer: videoBuffer,
      mimetype: 'video/mp4',
      filename: outputFile,
      source: bilibiliUrl,
      message: 'Video BiliBili berhasil diproses'
    };

  } catch (e) {
    // Bersihkan file temporary jika ada error
    const files = fs.readdirSync('.').filter(f => f.startsWith('temp_') || f.startsWith('output_'));
    files.forEach(f => fs.unlinkSync(f));
    
    return { 
      error: 'Terjadi kesalahan',
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    };
  }
}

module.exports = JHBiliBili;
