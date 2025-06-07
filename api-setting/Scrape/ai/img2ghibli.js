const axios = require('axios');
const FormData = require('form-data');

/**
 * Ghibli Style Image Generator
 * @param {string|Buffer} image - URL or Buffer of image to transform
 * @param {object} [options] - Generation options
 * @param {string} [options.style="Howl's Castle"] - Ghibli style
 * @returns {Promise<Buffer>} - Transformed image buffer
 */
async function createGhibliArt(image, options = {}) {
    const { style = "Howl's Castle" } = options;
    const validStyles = ["Howl's Castle", "Spirited Away", "Totoro", "Princess Mononoke"];

    // Validate inputs
    if (!validStyles.includes(style)) {
        throw new Error(`Invalid style. Choose from: ${validStyles.join(', ')}`);
    }

    if (!image) {
        throw new Error('Image URL or Buffer is required');
    }

    try {
        const form = new FormData();
        
        // Handle both URL and Buffer input
        if (typeof image === 'string') {
            if (!/^https?:\/\//i.test(image)) {
                throw new Error('Invalid URL format - must start with http:// or https://');
            }
            form.append('image_url', image);
        } else if (Buffer.isBuffer(image)) {
            form.append('image_file', image, { 
                filename: 'input.jpg',
                contentType: 'image/jpeg'
            });
        } else {
            throw new Error('Input must be URL string or image Buffer');
        }

        form.append('transformation', 'ghibli');
        form.append('style', style);
        form.append('intensity', '0.8');

        const response = await axios.post('https://api.art-transform.com/v1/process', form, {
            headers: {
                ...form.getHeaders(),
                'Accept': 'image/png'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        // Verify we got an image back
        if (!response.headers['content-type']?.includes('image')) {
            throw new Error('API did not return an image');
        }

        return Buffer.from(response.data);

    } catch (error) {
        console.error('Transformation error:', error.message);
        throw new Error(`Failed to create Ghibli art: ${error.response?.data?.message || error.message}`);
    }
}

module.exports = createGhibliArt;
