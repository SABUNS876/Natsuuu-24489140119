const axios = require('axios');

async function deepimg(prompt, { style = 'ghibli', size = '1:1' } = {}) {
    try {
        const sizeList = {
            '1:1': '1024x1024',
            '3:2': '1080x720',
            '2:3': '720x1080'
        };
        const styleList = {
            'default': '-style Realism',
            'ghibli': '-style Ghibli Art',
            'cyberpunk': '-style Cyberpunk',
            'anime': '-style Anime',
            'portrait': '-style Portrait',
            'chibi': '-style Chibi',
            'pixel art': '-style Pixel Art',
            'oil painting': '-style Oil Painting',
            '3d': '-style 3D'
        };
        
        if (!prompt) throw new Error('Prompt is required');
        if (!styleList[style]) throw new Error(`Available styles: ${Object.keys(styleList).join(', ')}`);
        if (!sizeList[size]) throw new Error(`Available sizes: ${Object.keys(sizeList).join(', ')}`);
        
        const device_id = Array.from({ length: 32 }, () => Math.floor(Math.random()*16).toString(16)).join('');
        
        // Step 1: Generate the image URL
        const { data } = await axios.post('https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev', {
            device_id: device_id,
            prompt: prompt + ' ' + styleList[style],
            size: sizeList[size],
            n: '1',
            output_format: 'png'
        }, {
            headers: {
                'content-type': 'application/json',
                origin: 'https://deepimg.ai',
                referer: 'https://deepimg.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        const imageUrl = data.data.images[0].url;
        
        // Step 2: Download the image as buffer
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'https://deepimg.ai/'
            }
        });

        return Buffer.from(imageResponse.data, 'binary');

    } catch (error) {
        console.error('DeepImg Error:', error.message);
        throw new Error('Failed to generate image');
    }
}

// Example usage
async function test() {
    try {
        const imageBuffer = await deepimg('girl wearing glasses', { 
            style: 'anime', 
            size: '3:2' 
        });
        
        // You can save the buffer to a file
        require('fs').writeFileSync('output.png', imageBuffer);
        console.log('Image saved as output.png');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Uncomment to run test
// test();

module.exports = deepimg;
