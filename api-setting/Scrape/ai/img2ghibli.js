const axios = require('axios');

/**
 * Ghibli Style Image Generator
 * @param {string} imageUrl - URL of the image to transform
 * @param {object} [options] - Generation options
 * @param {string} [options.style="Howl's Castle"] - Ghibli style
 * @param {object} [options.response] - Express response object (for HTTP mode)
 * @returns {Promise<Buffer|object>} - Image buffer or HTTP response
 */
async function ghibliGenerator(imageUrl, options = {}) {
    const {
        style = "Ghibli",
        response = null
    } = options;

    const validStyles = ["Howl's Castle", "Spirited Away", "Totoro", "Princess Mononoke", "Ghibli"];
    
    // Validate inputs
    if (!imageUrl) {
        const error = new Error('Image URL is required');
        if (response) return response.status(400).json({ error: error.message });
        throw error;
    }

    if (!validStyles.includes(style)) {
        const error = new Error(`Invalid style. Use one of: ${validStyles.join(', ')}`);
        if (response) return response.status(400).json({ error: error.message });
        throw error;
    }

    try {
        // Call the API
        const apiResponse = await axios.post(
            'https://ghibliimagegenerator.net/api/generate-image',
            {
                prompt: "Ubah Gambar Ini Menjadi Lebih Bagus Dan Mirip Dengan Ghibli Ingat Jangan yang Lain Lagi",
                style,
                imageUrl
            },
            {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json'
                },
                timeout: 30000
            }
        );

        // Process the image
        const base64Data = apiResponse.data.imageData.split(',')[1] || apiResponse.data.imageData;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Handle HTTP response if needed
        if (response) {
            response.set('Content-Type', 'image/png');
            return response.send(imageBuffer);
        }

        return imageBuffer;

    } catch (error) {
        console.error('Generation error:', error.message);
        const errorMsg = 'Failed to generate Ghibli image';
        
        if (response) {
            return response.status(500).json({ error: errorMsg });
        }
        throw new Error(errorMsg);
    }
}

module.exports = ghibliGenerator;
