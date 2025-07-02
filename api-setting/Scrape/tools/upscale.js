/**
    @ ✨ Scrape ImgLarger (Upscale, Enhance, Sharpener)
    @ Base: https://imglarger.com/
    @ Now supports: URL or Buffer input, returns Buffer
**/

const axios = require('axios');
const FormData = require('form-data');

async function imglarger(imageInput, options = {}) {
    const { scale = '2', type = 'upscale' } = options;
    
    const config = {
        scales: ['2', '4'],
        types: { upscale: 13, enhance: 2, sharpener: 1 }
    };
    
    try {
        let imageBuffer;
        
        // Handle URL input
        if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
            const response = await axios.get(imageInput, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data, 'binary');
        } 
        // Handle Buffer input
        else if (Buffer.isBuffer(imageInput)) {
            imageBuffer = imageInput;
        } else {
            throw new Error('Input must be a URL string or Buffer');
        }

        if (!config.types[type]) throw new Error(`Available types: ${Object.keys(config.types).join(', ')}`);
        if (type === 'upscale' && !config.scales.includes(scale.toString())) throw new Error(`Available scales: ${config.scales.join(', ')}`);
        
        const form = new FormData();
        form.append('file', imageBuffer, `imglarger_${Date.now()}.jpg`);
        form.append('type', config.types[type].toString());
        if (!['sharpener'].includes(type)) form.append('scaleRadio', type === 'upscale' ? scale.toString() : '1');
        
        const { data: uploadData } = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
            headers: {
                ...form.getHeaders(),
                accept: 'application/json, text/plain, */*',
                origin: 'https://imglarger.com',
                referer: 'https://imglarger.com/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });
        
        if (!uploadData.data.code) throw new Error('Upload failed - no code received');
        
        while (true) {
            const { data: statusData } = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', {
                code: uploadData.data.code,
                type: config.types[type]
            }, {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    origin: 'https://imglarger.com',
                    referer: 'https://imglarger.com/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });
            
            if (statusData.data.status === 'waiting') {
                await new Promise(res => setTimeout(res, 5000));
                continue;
            }
            
            if (statusData.data.status === 'success') {
                // Download the resulting image as buffer
                const resultResponse = await axios.get(statusData.data.downloadUrls[0], { 
                    responseType: 'arraybuffer',
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                    }
                });
                return Buffer.from(resultResponse.data, 'binary');
            }
            
            if (statusData.data.status === 'error') {
                throw new Error('Image processing failed');
            }
        }
        
    } catch (error) {
        console.error('ImgLarger Error:', error.message);
        throw new Error(`ImgLarger processing failed: ${error.message}`);
    }
}

// Example usage:
const fs = require('fs');

(async () => {
    try {
        // Example 1: Using URL
        const urlResult = await imglarger('https://example.com/your-image.jpg', { scale: '4', type: 'upscale' });
        fs.writeFileSync('upscaled-url-result.jpg', urlResult);
        
        // Example 2: Using local file buffer
        const fileBuffer = fs.readFileSync('./image.jpg');
        const bufferResult = await imglarger(fileBuffer, { type: 'enhance' });
        fs.writeFileSync('enhanced-buffer-result.jpg', bufferResult);
        
        console.log('Processing completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

module.exports = imglarger;
