const axios = require("axios");
const FormData = require("form-data");

async function animegen(prompt) {
    try {
        // 1. Generate image with Ghibli AI
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

        // 2. Upload to Catbox (Alternative method)
        const uploadUrl = `https://catbox.moe/user/api.php?reqtype=urlupload&url=${encodeURIComponent(imgUrl)}`;
        
        const catboxRes = await axios.get(uploadUrl, {
            headers: {
                "accept": "*/*",
                "user-agent": "Mozilla/5.0"
            },
            timeout: 20000
        });

        if (!catboxRes.data || catboxRes.data.includes('error')) {
            throw new Error("Failed to upload to Catbox: " + (catboxRes.data || 'No response'));
        }

        return {
            success: true,
            originalUrl: imgUrl,
            catboxUrl: catboxRes.data.trim(),
            prompt: prompt
        };

    } catch (err) {
        console.error("Error:", err.message);
        return {
            success: false,
            error: err.message.includes("412") ? "Catbox rejected the upload (412)" : err.message,
            prompt: prompt
        };
    }
}

module.exports = animegen;
