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
                    "accept": "*/*",
                    "content-type": "application/json",
                    "origin": "https://ghibliart.net",
                    "referer": "https://ghibliart.net/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
                },
                timeout: 30000
            }
        );

        const imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) {
            throw new Error("No image URL received from API");
        }

        // 2. Upload to Catbox - using the URL upload method
        const catboxParams = new URLSearchParams();
        catboxParams.append('reqtype', 'urlupload');
        catboxParams.append('url', imgUrl);

        const catboxRes = await axios.post(
            'https://catbox.moe/user/api.php',
            catboxParams.toString(),
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    "accept": "*/*",
                    "user-agent": "Mozilla/5.0"
                },
                timeout: 20000
            }
        );

        if (!catboxRes.data || catboxRes.data.includes('error')) {
            throw new Error("Failed to upload to Catbox: " + (catboxRes.data || 'No response'));
        }

        // Return the Catbox URL
        return {
            success: true,
            originalUrl: imgUrl,
            catboxUrl: catboxRes.data.trim(), // Trim any whitespace
            prompt: prompt
        };

    } catch (err) {
        console.error("Error:", err.message);
        return {
            success: false,
            error: err.message,
            prompt: prompt
        };
    }
}

module.exports = animegen;
