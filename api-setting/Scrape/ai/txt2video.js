const axios = require('axios');
const fs = require('fs');

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
        console.log('Video URL:', videoUrl);

        // Step 3: Download video as binary stream
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream', // Menggunakan stream untuk data binary
            headers: {
                'Accept': 'video/mp4, video/webm, video/*',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Simpan stream ke buffer
        const chunks = [];
        for await (const chunk of response.data) {
            chunks.push(chunk);
        }
        const videoBuffer = Buffer.concat(chunks);

        // Verifikasi buffer
        if (!videoBuffer || videoBuffer.length < 100) {
            throw new Error('Invalid video data received');
        }

        // Cek signature file MP4 (magic number)
        const magicNumber = videoBuffer.toString('hex', 0, 8);
        if (!magicNumber.match(/^000000[0-9a-f]{2}66747970/)) {
            throw new Error('Invalid MP4 file format');
        }

        return {
            buffer: videoBuffer,
            contentType: response.headers['content-type'] || 'video/mp4',
            url: videoUrl
        };

    } catch (error) {
        console.error('Error in txt2video:', error);
        throw new Error('Failed to generate video: ' + error.message);
    }
}

// Contoh penggunaan dengan Express
const express = require('express');
const app = express();

app.get('/video', async (req, res) => {
    try {
        const result = await txt2video(req.query.prompt || 'A beautiful landscape');
        
        res.set({
            'Content-Type': result.contentType,
            'Content-Length': result.buffer.length,
            'Content-Disposition': 'inline; filename="generated-video.mp4"'
        });
        
        res.send(result.buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Contoh penggunaan langsung
txt2video('A futuristic city at night')
    .then(result => {
        fs.writeFileSync('output.mp4', result.buffer);
        console.log('Video saved as output.mp4');
    })
    .catch(console.error);

module.exports = txt2video;
