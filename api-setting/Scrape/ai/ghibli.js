/*
 • Ghibli Art Generator with Catbox Upload
 • Enhanced error handling for 412 status
*/

const axios = require("axios");
const FormData = require("form-data");

async function generateGhibliArt(prompt, options = {}) {
    const {
        timeout = 40000, // 40 seconds timeout
        retries = 3,
        retryDelay = 5000,
        catboxTimeout = 20000
    } = options;

    // Validate input
    if (!prompt?.trim()) throw new Error('Prompt is required');

    const ghibliConfig = {
        headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "origin": "https://ghibliart.net",
            "referer": "https://ghibliart.net/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "x-requested-with": "XMLHttpRequest"
        },
        timeout
    };

    let attempt = 0;
    let lastError = null;

    while (attempt < retries) {
        try {
            // 1. Generate with Ghibli AI
            const ghibliRes = await axios.post(
                "https://ghibliart.net/api/generate-image",
                { prompt },
                ghibliConfig
            );

            const imageUrl = ghibliRes.data?.image || ghibliRes.data?.url;
            if (!imageUrl) throw new Error("Invalid response from Ghibli AI");

            // 2. Upload to Catbox
            const form = new FormData();
            form.append('reqtype', 'urlupload');
            form.append('url', imageUrl);

            const catboxRes = await axios.post(
                'https://catbox.moe/user/api.php',
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        "accept": "*/*",
                        "cache-control": "no-cache"
                    },
                    timeout: catboxTimeout
                }
            );

            if (!catboxRes.data?.includes('catbox.moe')) {
                throw new Error("Invalid Catbox response");
            }

            return {
                success: true,
                imageUrl: catboxRes.data,
                metadata: {
                    prompt,
                    attempts: attempt + 1,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            attempt++;
            lastError = error;
            
            // Specific handling for 412
            if (error.response?.status === 412) {
                console.warn(`Attempt ${attempt}: Precondition failed - modifying request`);
                ghibliConfig.headers['cache-control'] = 'no-cache';
                ghibliConfig.headers['if-none-match'] = '*';
            }

            if (attempt < retries) {
                await new Promise(r => setTimeout(r, retryDelay * attempt)); // Exponential backoff
            }
        }
    }

    const errorMsg = lastError?.response?.data?.message || 
                    lastError?.message || 
                    "Unknown error occurred";
    throw new Error(`Failed after ${retries} attempts: ${errorMsg}`);
}

module.exports = generateGhibliArt;
