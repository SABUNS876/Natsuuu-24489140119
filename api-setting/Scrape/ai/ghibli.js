const axios = require("axios");
const FormData = require('form-data');

async function animegen(prompt) {
    try {
        // First try the new API endpoint
        const form = new FormData();
        form.append('prompt', prompt);
        form.append('style', 'anime');
        form.append('quality', 'high');

        const res = await axios.post(
            "https://ai-image-generator-api.vercel.app/api/generate",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "accept": "application/json",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                    "sec-ch-ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "origin": "https://ai-image-generator.com",
                    "referer": "https://ai-image-generator.com/",
                    "priority": "u=1, i"
                },
                timeout: 30000
            }
        );

        // Fallback to alternative API if first one fails
        if (!res.data?.image_url && !res.data?.image) {
            return await fallbackGenerator(prompt);
        }

        const imgUrl = res.data?.image_url || res.data?.image;
        
        // Download the generated image
        const imageResponse = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 20000
        });

        return {
            imageBuffer: Buffer.from(imageResponse.data, 'binary'),
            contentType: imageResponse.headers['content-type'] || 'image/png',
            prompt,
            source: 'ai-image-generator-api',
            note: 'Generated with new API endpoint'
        };

    } catch (err) {
        console.error("Primary API error:", err.message);
        // Try fallback if main API fails
        return await fallbackGenerator(prompt);
    }
}

async function fallbackGenerator(prompt) {
    try {
        // Alternative API endpoint
        const res = await axios.post(
            "https://anime-gen-backup.herokuapp.com/generate",
            { prompt },
            {
                headers: {
                    "content-type": "application/json",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                    "accept": "application/json"
                },
                timeout: 25000
            }
        );

        if (!res.data?.url) {
            throw new Error("No image URL in fallback response");
        }

        const imageResponse = await axios.get(res.data.url, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        return {
            imageBuffer: Buffer.from(imageResponse.data, 'binary'),
            contentType: imageResponse.headers['content-type'] || 'image/jpeg',
            prompt,
            source: 'anime-gen-backup',
            note: 'Generated with fallback API'
        };

    } catch (fallbackErr) {
        console.error("Fallback API error:", fallbackErr.message);
        throw new Error(`All generation methods failed: ${fallbackErr.message}`);
    }
}

module.exports = animegen;
