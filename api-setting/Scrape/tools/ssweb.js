const fetch = require('node-fetch');

async function ssweb(url, options = {}) {
    // Default options
    const {
        returnBuffer = true,  // Set false for HTTP handler usage
        response = null       // Pass response object for HTTP mode
    } = options;

    // Validate URL
    if (!url || !/^https?:\/\//i.test(url)) {
        const error = new Error('Invalid URL format. Please use http:// or https://');
        if (response) {
            return response.status(400).json({ error: error.message });
        }
        throw error;
    }

    // API configuration
    const apiKeys = ["1b484c", "965abb", "731a82", "194174"];
    const apiUrl = `https://api.screenshotmachine.com/?key=${
        apiKeys[Math.floor(Math.random() * apiKeys.length)]
    }&url=${encodeURIComponent(url)}&device=desktop&dimension=1024x768&format=png&cacheLimit=0&delay=1000`;

    try {
        const apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) {
            throw new Error(`API request failed with status ${apiResponse.status}`);
        }

        const imageBuffer = await apiResponse.buffer();

        // HTTP handler mode
        if (response) {
            response.set('Content-Type', 'image/png');
            return response.send(imageBuffer);
        }
        
        // Direct function mode
        return returnBuffer ? imageBuffer : {
            success: true,
            image: imageBuffer,
            meta: { url, device: 'Desktop', resolution: '1024x768' }
        };

    } catch (error) {
        console.error('Screenshot error:', error);
        if (response) {
            return response.status(500).json({ 
                error: 'Failed to capture screenshot',
                details: error.message 
            });
        }
        throw error;
    }
}

module.exports = ssweb;
