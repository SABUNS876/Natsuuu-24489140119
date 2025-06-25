const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function imgLarger(input, options = {}, req, res) {
    const { scale = '2', type = 'upscale' } = options;
    
    const config = {
        scales: ['2', '4'],
        types: { upscale: 13, enhance: 2, sharpener: 1 }
    };

    // Handle both direct call and API call
    const isApiCall = req && res;
    
    try {
        // Validate input
        if (!input) {
            const error = new Error('Image input is required (buffer, file path, or URL)');
            if (isApiCall) {
                return res.status(400).json({ status: false, message: error.message });
            }
            throw error;
        }

        if (!config.types[type]) {
            const error = new Error(`Available types: ${Object.keys(config.types).join(', ')}`);
            if (isApiCall) {
                return res.status(400).json({ status: false, message: error.message });
            }
            throw error;
        }

        // Process image input
        let imageBuffer;
        if (Buffer.isBuffer(input)) {
            imageBuffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                const response = await axios.get(input, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(response.data, 'binary');
            } else {
                imageBuffer = fs.readFileSync(input);
            }
        } else {
            const error = new Error('Invalid input type - must be buffer, file path, or URL');
            if (isApiCall) {
                return res.status(400).json({ status: false, message: error.message });
            }
            throw error;
        }

        // Upload and process image
        const form = new FormData();
        form.append('file', imageBuffer, `img_${Date.now()}.jpg`);
        form.append('type', config.types[type].toString());
        if (!['sharpener'].includes(type)) form.append('scaleRadio', type === 'upscale' ? scale.toString() : '1');

        const { data: uploadResponse } = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
            headers: form.getHeaders()
        });

        if (!uploadResponse.data?.code) {
            const error = new Error('Upload failed - no code received');
            if (isApiCall) {
                return res.status(500).json({ status: false, message: error.message });
            }
            throw error;
        }

        // Check processing status
        while (true) {
            const { data: statusResponse } = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', {
                code: uploadResponse.data.code,
                type: config.types[type]
            });

            if (statusResponse.data.status === 'success') {
                const result = {
                    status: true,
                    downloadUrl: statusResponse.data.downloadUrls[0]
                };
                if (isApiCall) {
                    return res.json(result);
                }
                return result;
            }
            
            if (statusResponse.data.status === 'error') {
                const error = new Error('Processing failed');
                if (isApiCall) {
                    return res.status(500).json({ status: false, message: error.message });
                }
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        if (isApiCall) {
            return res.status(500).json({ 
                status: false, 
                message: error.message 
            });
        }
        throw error;
    }
}

// Dual-purpose export
module.exports = imgLarger;
