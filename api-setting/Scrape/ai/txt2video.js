const axios = require('axios');

async function txt2video(prompt) {
    try {
        // 1. Dapatkan video key
        const { data: k } = await axios.post('https://soli.aritek.app/txt2videov3', {
            deviceID: Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
            prompt: prompt,
            used: [],
            versionCode: 51
        }, {
            headers: {
                authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json',
                'user-agent': 'okhttp/4.11.0'
            }
        });

        // 2. Dapatkan URL video
        const { data } = await axios.post('https://soli.aritek.app/video', {
            keys: [k.key]
        }, {
            headers: {
                authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json',
                'user-agent': 'okhttp/4.11.0'
            }
        });

        const videoUrl = data.datas[0].url;

        // 3. Download video sebagai buffer
        const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'video/mp4'
            }
        });

        // 4. Konversi ke Buffer
        return Buffer.from(response.data, 'binary');

    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('Gagal membuat video: ' + error.message);
    }
}

// Contoh penggunaan
const fs = require('fs');

txt2video('Pemandangan pantai saat sunset')
    .then(videoBuffer => {
        fs.writeFileSync('video.mp4', videoBuffer);
        console.log('Video berhasil disimpan sebagai video.mp4');
    })
    .catch(err => console.error(err));

module.exports = txt2video;
