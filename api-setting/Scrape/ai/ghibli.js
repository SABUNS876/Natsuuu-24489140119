const axios = require("axios");
const FormData = require("form-data");

async function animegen(prompt) {
    try {
        // 1. Generate image with Ghibli AI
        console.log("Generating image with prompt:", prompt);
        const res = await axios.post(
            "https://ghibliart.net/api/generate-image", 
            { prompt },
            {
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "origin": "https://ghibliart.net",
                    "referer": "https://ghibliart.net/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                },
                timeout: 30000
            }
        );

        const imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) {
            throw new Error("No image URL received from API");
        }
        console.log("Generated image URL:", imgUrl);

        // 2. Upload to Catbox with proper FormData
        console.log("Uploading to Catbox...");
        const catboxUrl = await uploadToCatbox(imgUrl);
        
        return {
            success: true,
            originalUrl: imgUrl,
            catboxUrl: catboxUrl,
            prompt: prompt
        };

    } catch (err) {
        console.error("Error in animegen:", err.message);
        return {
            success: false,
            error: err.message,
            prompt: prompt
        };
    }
}

async function uploadToCatbox(imageUrl) {
    try {
        // Validate URL first
        new URL(imageUrl); // Will throw if invalid

        const form = new FormData();
        form.append('reqtype', 'urlupload');
        form.append('url', imageUrl);

        const response = await axios.post(
            'https://catbox.moe/user/api.php',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "accept": "*/*",
                    "user-agent": "Mozilla/5.0"
                },
                timeout: 15000
            }
        );

        if (!response.data) {
            throw new Error("Empty response from Catbox");
        }

        return response.data.trim();
    } catch (error) {
        console.error("Catbox upload failed, trying alternative...");
        // Fallback to GET method if POST fails
        return await uploadToCatboxFallback(imageUrl);
    }
}

async function uploadToCatboxFallback(imageUrl) {
    try {
        const encodedUrl = encodeURIComponent(imageUrl);
        const uploadUrl = `https://catbox.moe/user/api.php?reqtype=urlupload&url=${encodedUrl}`;
        
        const response = await axios.get(uploadUrl, {
            headers: {
                "accept": "*/*",
                "user-agent": "Mozilla/5.0"
            },
            timeout: 15000
        });

        if (!response.data) {
            throw new Error("Empty response from Catbox fallback");
        }

        return response.data.trim();
    } catch (error) {
        throw new Error(`All Catbox upload attempts failed: ${error.message}`);
    }
}

module.exports = animegen;
