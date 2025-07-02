const axios = require('axios');

async function txt2video(prompt) {
    try {
        // 1. Request generasi video
        const { data: keyData } = await axios.post('https://soli.aritek.app/txt2videov3', {
            deviceID: Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8),
            prompt: prompt,
            used: [],
            versionCode: 51
        }, {
            headers: {
                'authorization': 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json',
                'user-agent': 'okhttp/4.11.0'
            }
        });

        // 2. Dapatkan URL video
        const { data: videoData } = await axios.post('https://soli.aritek.app/video', {
            keys: [keyData.key]
        }, {
            headers: {
                'authorization': 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json',
                'user-agent': 'okhttp/4.11.0'
            }
        });

        const videoUrl = videoData.datas[0].url;
        
        // 3. Download video sebagai binary murni
        const { data } = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'video/mp4',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // 4. Konversi ke Buffer
        const videoBuffer = Buffer.from(data);
        
        // 5. Validasi buffer (pastikan ini benar-benar video)
        if (!isValidVideoBuffer(videoBuffer)) {
            throw new Error('Data yang diterima bukan video valid');
        }

        return videoBuffer;

    } catch (error) {
        console.error('[ERROR]', error.message);
        throw new Error('Gagal menghasilkan video: ' + error.message);
    }
}

// Fungsi validasi sederhana
function isValidVideoBuffer(buffer) {
    // Cek minimal 8KB dan ada signature MP4 (ftyp)
    return buffer.length > 8192 && 
           buffer.toString('hex', 4, 8) === '66747970'; // 'ftyp' dalam hex
}

// Contoh penggunaan
const fs = require('fs');

txt2video('Pemandangan alam di pagi hari')
    .then(buffer => {
        fs.writeFileSync('result.mp4', buffer);
        console.log('Video berhasil disimpan sebagai result.mp4');
    })
    .catch(err => console.error('Error:', err.message));

module.exports = txt2video;
