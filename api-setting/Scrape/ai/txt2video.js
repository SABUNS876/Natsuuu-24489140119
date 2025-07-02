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
        console.log('Video URL:', videoUrl); // Debugging
        
        // Step 3: Download video with proper headers and validation
        const response = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'video/mp4',
                'User-Agent': 'Mozilla/5.0'
            },
            maxContentLength: 100 * 1024 * 1024, // Max 100MB
            validateStatus: function (status) {
                return status >= 200 && status < 300; // Only accept 2xx status codes
            }
        });
        
        // Validate the response is actually a video
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('video/')) {
            throw new Error('Invalid content type received: ' + contentType);
        }
        
        // Create buffer with proper binary data
        const videoBuffer = Buffer.from(response.data, 'binary');
        
        // Verify buffer contains video data (basic check)
        if (videoBuffer.length < 100) {
            throw new Error('Video file too small, likely invalid');
        }
        
        // Optional: Write to file for debugging
        // fs.writeFileSync('debug_video.mp4', videoBuffer);
        
        return {
            buffer: videoBuffer,
            contentType: contentType || 'video/mp4',
            url: videoUrl
        };
        
    } catch (error) {
        console.error('Error in txt2video:', error.message);
        throw new Error('Failed to generate video: ' + error.message);
    }
}

// Contoh Pemakaian dengan Express.js
const express = require('express');
const app = express();

app.get('/generate-video', async (req, res) => {
    try {
        const prompt = req.query.prompt || 'A beautiful sunset over mountains';
        const result = await txt2video(prompt);
        
        res.set({
            'Content-Type': result.contentType,
            'Content-Length': result.buffer.length,
            'Content-Disposition': 'inline; filename="generated-video.mp4"'
        });
        
        res.send(result.buffer);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Contoh Pemakaian Standalone
txt2video('A pixel-art queen, standing in her grand pixelated throne room')
    .then(result => {
        console.log('Video generated successfully!');
        console.log('Size:', result.buffer.length, 'bytes');
        console.log('Type:', result.contentType);
        
        // Save to file
        fs.writeFileSync('output.mp4', result.buffer);
        console.log('Video saved as output.mp4');
    })
    .catch(err => {
        console.error('Error:', err.message);
    });

module.exports = txt2video;
