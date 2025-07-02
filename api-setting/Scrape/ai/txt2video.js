const axios = require('axios');
const fs = require('fs');

async function txt2video(prompt) {
    try {
        // 1. Request generasi video
        const { data: keyData } = await axios.post('https://soli.aritek.app/txt2videov3', {
            deviceID: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10),
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
        console.log('Video URL:', videoUrl); // Debugging

        // 3. Download video sebagai stream binary
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream',
            headers: {
                'Accept': 'video/mp4',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // 4. Simpan stream ke buffer
        const chunks = [];
        for await (const chunk of response.data) {
            chunks.push(chunk);
        }
        const videoBuffer = Buffer.concat(chunks);

        // 5. Validasi buffer video
        if (!isValidMP4Buffer(videoBuffer)) {
            throw new Error('Data yang diterima bukan video MP4 valid');
        }

        return videoBuffer;

    } catch (error) {
        console.error('[ERROR]', error);
        throw new Error('Gagal menghasilkan video: ' + error.message);
    }
}

// Validasi buffer MP4
function isValidMP4Buffer(buffer) {
    // Minimal 8KB dan memiliki signature 'ftyp' (MP4 magic number)
    if (buffer.length < 8192) return false;
    
    const hexStart = buffer.toString('hex', 0, 12);
    // Format MP4 harus memiliki 'ftyp' di offset 4
    return hexStart.includes('66747970'); // 'ftyp' dalam hex
}

// Contoh penggunaan
(async () => {
    try {
        const videoBuffer = await txt2video('Pemandangan gunung dengan sunset');
        
        // Simpan ke file
        fs.writeFileSync('video_output.mp4', videoBuffer);
        console.log('Video berhasil disimpan sebagai video_output.mp4');
        
        // Verifikasi buffer
        console.log('Ukuran buffer:', videoBuffer.length, 'bytes');
        console.log('Signature file:', videoBuffer.toString('hex', 0, 12));
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

module.exports = txt2video;
