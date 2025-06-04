const axios = require("axios");
const FormData = require("form-data");

async function generateGhibliArt(prompt, options = {}) {
    const {
        timeout = 30000, // 30 seconds timeout
        retries = 3, // Number of retry attempts
        retryDelay = 2000 // 2 seconds between retries
    } = options;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt must be a non-empty string');
    }

    const ghibliHeaders = {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "origin": "https://ghibliart.net",
        "referer": "https://ghibliart.net/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    };

    let attempt = 0;
    let lastError = null;

    while (attempt < retries) {
        try {
            // 1. Generate image with Ghibli AI
            const response = await axios.post(
                "https://ghibliart.net/api/generate-image",
                { prompt },
                {
                    headers: ghibliHeaders,
                    timeout
                }
            );

            const imageUrl = response.data?.image || response.data?.url;
            if (!imageUrl) throw new Error("No image URL received from Ghibli AI");

            // 2. Upload to Catbox
            const form = new FormData();
            form.append('reqtype', 'urlupload');
            form.append('url', imageUrl);

            const catboxResponse = await axios.post(
                'https://catbox.moe/user/api.php', 
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 15000
                }
            );

            if (!catboxResponse.data) {
                throw new Error("No URL received from Catbox");
            }

            return {
                success: true,
                prompt,
                originalUrl: imageUrl,
                catboxUrl: catboxResponse.data,
                metadata: {
                    attempts: attempt + 1,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            attempt++;
            lastError = error;
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    throw new Error(lastError?.message || "Failed after all retries");
}

module.exports = generateGhibliArt;
