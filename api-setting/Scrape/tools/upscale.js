const axios = require('axios');
const FormData = require('form-data');

async function upscaleImage(imageBuffer, mimeType = 'image/jpeg') {
    const API_BASE = 'https://photoai.imglarger.com';
    const UPLOAD_URL = `${API_BASE}/api/PhoAi/Upload`;
    const STATUS_URL = `${API_BASE}/api/PhoAi/CheckStatus`;

    // Enhanced headers with keep-alive
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://imglarger.com',
        'referer': 'https://imglarger.com/',
        'connection': 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    try {
        // 1. Prepare the upload
        const form = new FormData();
        const filename = `upscale_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
        
        form.append('file', imageBuffer, {
            filename: filename,
            contentType: mimeType
        });
        form.append('type', '13'); // AI Type
        form.append('scaleRadio', '2'); // Upscale level

        console.log('Uploading image to ImgLarger...');
        
        // 2. Execute upload with extended timeout
        const uploadResponse = await axios.post(UPLOAD_URL, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            },
            timeout: 30000, // 30 seconds timeout
            maxContentLength: 100 * 1024 * 1024, // 100MB
            maxBodyLength: 100 * 1024 * 1024 // 100MB
        });

        console.log('Upload response:', uploadResponse.data);

        // 3. Validate upload response
        if (!uploadResponse.data || !uploadResponse.data.data) {
            throw new Error('API returned empty response');
        }

        const { code, type } = uploadResponse.data.data;
        if (!code || !type) {
            throw new Error('Missing code/type in API response');
        }

        console.log(`Processing started. Code: ${code}, Type: ${type}`);

        // 4. Check processing status with retries
        let resultUrl;
        const maxAttempts = 15; // 15 attempts (~45 seconds total)
        const delayMs = 3000; // 3 seconds between attempts

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`Checking status (attempt ${attempt}/${maxAttempts})...`);
            
            try {
                const statusResponse = await axios.post(STATUS_URL, {
                    code,
                    type: String(type)
                }, { 
                    headers,
                    timeout: 10000 
                });

                const statusData = statusResponse.data?.data;
                console.log('Status check:', statusData);

                if (statusData?.status === 'success' && statusData?.downloadUrls?.[0]) {
                    resultUrl = statusData.downloadUrls[0];
                    break;
                }

                if (statusData?.status === 'error') {
                    throw new Error(statusData.message || 'Processing error');
                }
            } catch (statusError) {
                if (attempt === maxAttempts) throw statusError;
            }

            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        if (!resultUrl) {
            throw new Error('Processing did not complete in time');
        }

        console.log('Downloading upscaled image from:', resultUrl);

        // 5. Download final image
        const imageResponse = await axios.get(resultUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        return {
            status: true,
            imageBuffer: Buffer.from(imageResponse.data),
            contentType: imageResponse.headers['content-type'] || mimeType,
            url: resultUrl
        };

    } catch (error) {
        console.error('Upscale Error:', error.message);
        
        // Enhanced error diagnostics
        const errorDetails = {
            message: error.message,
            responseData: error.response?.data,
            statusCode: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method
            }
        };

        return {
            status: false,
            message: 'Failed to process image',
            error: errorDetails
        };
    }
}

module.exports = upscaleImage;
