/**
    @ ✨ Scrape GPT Text To Video
    @ Base: https://play.google.com/store/apps/details?id=ai.video.generator.text.video
**/

const axios = require('axios');

async function txt2video(prompt) {
    try {
        // Step 1: Get video key
        const { data: k } = await axios.post('https://soli.aritek.app/txt2videov3', {
            deviceID: Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8),
            prompt: prompt,
            used: [],
            versionCode: 51
        }, {
            headers: {
                authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json; charset=utf-8',
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.11.0'
            }
        });
        
        // Step 2: Get video URL
        const { data } = await axios.post('https://soli.aritek.app/video', {
            keys: [k.key]
        }, {
            headers: {
                authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json; charset=utf-8',
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.11.0'
            }
        });
        
        const videoUrl = data.datas[0].url;
        
        // Step 3: Download video as Buffer
        const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer'
        });
        
        return Buffer.from(response.data, 'binary');
        
    } catch (error) {
        console.error(error.message);
        throw new Error('Failed to generate video: ' + error.message);
    }
}

// Contoh Pemakaiannya:
txt2video('A pixel-art queen, standing in her grand pixelated throne room, with a sunbeam casting light onto her flowing cape.')
    .then(videoBuffer => {
        console.log('Video as Buffer:', videoBuffer);
        // Anda bisa menyimpan buffer ke file jika diperlukan
        // const fs = require('fs');
        // fs.writeFileSync('output.mp4', videoBuffer);
    })
    .catch(err => console.error(err));

module.exports = txt2video;
