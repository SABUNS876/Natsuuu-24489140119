/*
 * Image Upscaler using ImgLarger API
 * Fixed upload issues and improved error handling
 */

const axios = require('axios');
const FormData = require('form-data');

async function upscaleImage(imageBuffer, mimeType = 'image/jpeg') {
  const API_URL = 'https://photoai.imglarger.com/api/PhoAi/Upload';
  const STATUS_URL = 'https://photoai.imglarger.com/api/PhoAi/CheckStatus';
  
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'origin': 'https://imglarger.com',
    'referer': 'https://imglarger.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    // 1. Prepare form data
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: `upscale-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
      contentType: mimeType
    });
    form.append('type', '13'); // AI Type
    form.append('scaleRadio', '2'); // Upscale level

    // 2. Upload image
    const uploadResponse = await axios.post(API_URL, form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (!uploadResponse.data?.data?.code) {
      throw new Error('Invalid response from upload API');
    }

    const { code, type } = uploadResponse.data.data;

    // 3. Check processing status
    let resultUrl;
    for (let i = 0; i < 20; i++) { // Max 20 attempts (about 1 minute)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between checks
      
      const statusResponse = await axios.post(STATUS_URL, {
        code,
        type: String(type)
      }, { headers });

      const statusData = statusResponse.data?.data;
      
      if (statusData?.status === 'success' && statusData?.downloadUrls?.[0]) {
        resultUrl = statusData.downloadUrls[0];
        break;
      }
      
      if (statusData?.status === 'error') {
        throw new Error(statusData.message || 'Processing failed');
      }
    }

    if (!resultUrl) {
      throw new Error('Processing timeout');
    }

    // 4. Download the upscaled image
    const imageResponse = await axios.get(resultUrl, {
      responseType: 'arraybuffer'
    });

    return {
      success: true,
      imageBuffer: Buffer.from(imageResponse.data),
      contentType: imageResponse.headers['content-type'] || mimeType
    };

  } catch (error) {
    console.error('Upscale Error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to upscale image'
    };
  }
}

module.exports = upscaleImage;
