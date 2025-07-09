const axios = require('axios');
const FormData = require('form-data');

async function JHZrooArt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt harus berupa string yang valid');
  }

  // Generate random IP (meski mungkin tidak diperlukan)
  const ip = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');

  const headers = {
    'accept': 'application/json',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'multipart/form-data',
    'referer': 'https://aiart-zroo.onrender.com/',
    'origin': 'https://aiart-zroo.onrender.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest'
  };

  const form = new FormData();
  form.append('video_description', prompt.trim());
  form.append('test_mode', 'false');
  form.append('model', 'stable-diffusion-xl-1024-v1-0'); // Model yang lebih baru
  form.append('negative_prompt', 'blurry, distorted, low quality, bad anatomy');
  form.append('aspect_ratio', '16:9');
  form.append('style', 'Photographic');
  form.append('output_format', 'png');
  form.append('seed', Math.floor(Math.random() * 1000000).toString());
  form.append('website', 'https://aiart-zroo.onrender.com');

  try {
    // Generate the image
    const { data } = await axios.post(
      'https://aiart-zroo.onrender.com/generate-txt2img-ui',
      form,
      { 
        headers: { 
          ...headers,
          ...form.getHeaders(),
          'content-length': form.getLengthSync()
        },
        timeout: 60000 // Timeout lebih panjang
      }
    );

    if (!data || !data.image_path) {
      throw new Error('Respon tidak valid dari server');
    }

    // Get image URL
    const imageUrl = data.image_path.startsWith('http') 
      ? data.image_path 
      : `https://aiart-zroo.onrender.com${data.image_path}`;

    // Download and return the raw image buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'user-agent': headers['user-agent'],
        'referer': headers['referer'],
        'accept': 'image/*'
      },
      timeout: 60000
    });

    return {
      buffer: Buffer.from(imageResponse.data),
      mimeType: imageResponse.headers['content-type'] || 'image/png',
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw new Error(`Gagal membuat gambar: ${error.message}`);
  }
}

module.exports = JHZrooArt;
