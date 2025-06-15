const axios = require('axios');
const FormData = require('form-data');

async function upscaleImage(imgUrl, response = null) {
  try {
    // 1. Download original image
    const imgResponse = await axios.get(imgUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    // 2. Prepare upscale request
    const form = new FormData();
    form.append('image', Buffer.from(imgResponse.data), {
      filename: `upscale_${Date.now()}.png`,
      contentType: imgResponse.headers['content-type'] || 'image/png'
    });
    form.append('scale', '2'); // 2x upscale

    // 3. Send to upscale API
    const apiResponse = await axios.post(
      'https://api2.pixelcut.app/image/upscale/v1',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-Client-Version': 'web',
          'X-Locale': 'id',
          'Accept': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    // 4. Handle response
    const upscaledBuffer = Buffer.from(apiResponse.data);

    if (response) {
      // Stream directly to HTTP response
      response.setHeader('Content-Type', apiResponse.headers['content-type'] || 'image/png');
      response.setHeader('Content-Disposition', `inline; filename="upscaled_${Date.now()}.png"`);
      return response.send(upscaledBuffer);
    }

    return upscaledBuffer;

  } catch (error) {
    console.error('Upscale error:', error.message);
    
    if (response) {
      return response.status(500).json({
        status: 'error',
        message: 'Failed to upscale image',
        error: error.message
      });
    }
    
    throw error;
  }
}

module.exports = upscaleImage;
