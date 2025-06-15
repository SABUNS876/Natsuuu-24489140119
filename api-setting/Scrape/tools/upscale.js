const axios = require('axios');
const FormData = require('form-data');

async function upscaleImage(imgUrl, response = null) {
  try {
    // 1. Validate input URL
    if (!imgUrl || !imgUrl.startsWith('http')) {
      throw new Error('Invalid image URL');
    }

    // 2. Download original image
    const imgResponse = await axios.get(imgUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // 3. Prepare upscale request
    const form = new FormData();
    form.append('image', imgResponse.data, {
      filename: `source_${Date.now()}.${imgUrl.split('.').pop().split('?')[0] || 'jpg'}`,
      contentType: imgResponse.headers['content-type'] || 'image/jpeg'
    });
    form.append('scale', '2');

    // 4. Send to upscale API
    const { data, headers } = await axios.post(
      'https://api2.pixelcut.app/image/upscale/v1',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-Client-Version': 'web',
          'X-Locale': 'id',
          'Accept': 'application/json'
        },
        responseType: 'arraybuffer', // Critical for binary response
        timeout: 30000
      }
    );

    // 5. Handle response
    const contentType = headers['content-type'] || 'image/jpeg';
    const upscaledBuffer = Buffer.from(data);

    if (response) {
      // Stream image directly to HTTP response
      response.setHeader('Content-Type', contentType);
      response.setHeader('Content-Disposition', `inline; filename="upscaled_${Date.now()}.${contentType.split('/')[1] || 'jpg'}"`);
      response.setHeader('Cache-Control', 'no-store');
      return response.end(upscaledBuffer);
    }

    return upscaledBuffer;

  } catch (error) {
    console.error('Upscale error:', error.message);
    
    if (response) {
      response.status(500).json({
        status: 'error',
        message: 'Failed to upscale image',
        error: error.message,
        tips: [
          'Pastikan URL gambar valid',
          'Coba gambar dengan ukuran lebih kecil',
          'Server upscale mungkin sedang down'
        ]
      });
      return;
    }
    
    throw error;
  }
}

module.exports = upscaleImage;
