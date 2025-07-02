/**
    @ ✨ Scrape Image To Ghibli
    @ Base: https://ghibliai.ai/
    @ Note: prompt can be adjust
    @ Now supports: URL or Buffer input, returns Buffer
**/

const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

async function ghibliai(imageInput, prompt = 'Please convert this image into Studio Ghibli art style with the Ghibli AI generator.') {
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

        const form = new FormData();
        form.append('file', imageBuffer, `ghibli_${Date.now()}.jpg`);
        
        // Upload image
        const { data: uploadData } = await axios.post('https://ghibliai.ai/api/upload', form);
        
        // Process transformation
        const { data: transformData } = await axios.post('https://ghibliai.ai/api/transform-stream', {
            imageUrl: uploadData.data.url,
            sessionId: uuidv4(),
            prompt: prompt,
            timestamp: Date.now().toString()
        }, { 
            headers: {
                'content-type': 'application/json'
            }
        });
        
        // Check transformation status
        while (true) {
            const { data: statusData } = await axios.get(`https://ghibliai.ai/api/transform-stream?taskId=${transformData.taskId}`, {
                headers: {
                    'content-type': 'application/json'
                }
            });
            
            if (statusData.status === 'success') {
                // Download the resulting image as buffer
                const resultResponse = await axios.get(statusData.imageUrl, { responseType: 'arraybuffer' });
                return Buffer.from(resultResponse.data, 'binary');
            }
            if (statusData.status === 'error') throw new Error('Transformation failed');
            
            await new Promise(res => setTimeout(res, 2000));
        }
    } catch (error) {
        throw new Error(`Ghibli AI error: ${error.message}`);
    }
}

// Example usage:
const fs = require('fs');

(async () => {
    try {
        // Example 1: Using URL
        const urlResult = await ghibliai('https://example.com/your-image.jpg');
        fs.writeFileSync('ghibli-result-url.jpg', urlResult);
        
        // Example 2: Using local file buffer
        const fileBuffer = fs.readFileSync('./image2.jpg');
        const bufferResult = await ghibliai(fileBuffer);
        fs.writeFileSync('ghibli-result-buffer.jpg', bufferResult);
        
        console.log('Transformations completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

module.exports = ghibliai;
