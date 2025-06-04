const axios = require("axios");

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

    const headers = {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "origin": "https://ghibliart.net",
        "referer": "https://ghibliart.net/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "cookie": "_ga_DC0LTNHRKH=GS2.1.s1748942966$o1$g0$t1748942966$j60$l0$h0; _ga=GA1.1.1854864196.1748942966",
        "sec-ch-ua": '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "priority": "u=1, i"
    };

    let attempt = 0;
    let lastError = null;

    while (attempt < retries) {
        try {
            const response = await axios.post(
                "https://ghibliart.net/api/generate-image",
                { prompt },
                {
                    headers,
                    timeout
                }
            );

            const imageUrl = response.data?.image || response.data?.url;

            if (!imageUrl) {
                throw new Error("No image URL received from API");
            }

            // Return only the URL (no image processing)
            return {
                success: true,
                prompt,
                imageUrl,
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

    throw new Error(lastError?.message || "Failed to generate image after retries");
}

module.exports = generateGhibliArt;
