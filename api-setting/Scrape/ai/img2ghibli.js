const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Ghibli Style Image Generator
 * @param {string|Buffer} image - URL or Buffer of the image to transform
 * @param {object} options - Generation options
 * @param {string} [options.style="Howl's Castle"] - Ghibli style
 * @param {object} [options.response] - Express response object (optional)
 * @returns {Promise<Buffer>} - Ghibli-style image buffer
 */
async function ghibliGenerator(image, options = {}) {
    const { 
        style = "Howl's Castle",
        response = null 
    } = options;

    // Validate style
    const validStyles = ["Howl's Castle", "Spirited Away", "Totoro", "Princess Mononoke"];
    if (!validStyles.includes(style)) {
        const error = new Error(`Invalid style. Choose from: ${validStyles.join(', ')}`);
        if (response) return response.status(400).json({ error: error.message });
        throw error;
    }

    try {
        const form = new FormData();
        
        // Handle both URL and Buffer input
        if (typeof image === 'string') {
            if (!image.match(/^https?:\/\//)) {
                throw new Error('Invalid URL format');
            }
            form.append('image_url', image);
        } else if (Buffer.isBuffer(image)) {
            form.append('image_file', image, { filename: 'input.jpg' });
        } else {
            throw new Error('Input must be URL string or image Buffer');
        }

        form.append('style', style);
        form.append('prompt', 'Transform this image into Ghibli anime art style');

        const apiResponse = await axios.post('https://api.ghibli-art-generator.com/v1/transform', form, {
            headers: {
                ...form.getHeaders(),
                'Accept': 'image/png'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const imageBuffer = Buffer.from(apiResponse.data, 'binary');

        if (response) {
            response.set('Content-Type', 'image/png');
            response.send(imageBuffer);
            return;
        }

        return imageBuffer;

    } catch (error) {
        console.error('Generation failed:', error.message);
        const errorMsg = 'Failed to transform image to Ghibli style';
        
        if (response) {
            return response.status(500).json({ 
                error: errorMsg,
                details: error.response?.data || error.message
            });
        }
        throw new Error(errorMsg);
    }
}

module.exports = ghibliGenerator;
