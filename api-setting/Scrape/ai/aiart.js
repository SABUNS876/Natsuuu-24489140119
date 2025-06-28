const axios = require('axios');
const FormData = require('form-data');

async function JHZrooArt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      status: false,
      error: 'Prompt harus berupa string yang valid'
    };
  }

  const ip = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
  const baseHeaders = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9',
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
    'Client-IP': ip,
    'Forwarded': `for=${ip}`
  };

  try {
    // 1. Generate image
    const form = new FormData();
    form.append('video_description', prompt.trim());
    form.append('test_mode', 'false');
    form.append('model', 'stable-diffusion-3.5-ultra');
    form.append('negative_prompt', 'blurry, distorted, low quality');
    form.append('aspect_ratio', '16:9');
    form.append('style', 'Anime');
    form.append('output_format', 'png');
    form.append('seed', '0');
    form.append('website', '');

    const { data: genData } = await axios.post(
      'https://aiart-zroo.onrender.com/generate-txt2img-ui',
      form,
      { 
        headers: { 
          ...baseHeaders,
          ...form.getHeaders() 
        }
      }
    );

    // 2. Get image path
    const imagePath = genData?.image_path;
    if (!imagePath) {
      throw new Error('Gagal mendapatkan path gambar');
    }

    // 3. Download image as buffer
    const imageUrl = imagePath.startsWith('http') 
      ? imagePath 
      : `https://aiart-zroo.onrender.com${imagePath}`;

    const { data: imageBuffer } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: baseHeaders
    });

    return {
      status: true,
      data: {
        prompt: prompt.trim(),
        image_buffer: imageBuffer,
        mime_type: 'image/png' // Sesuaikan dengan format output
      }
    };

  } catch (e) {
    return {
      status: false,
      error: e.response?.data || e.message
    };
  }
}

module.exports = JHZrooArt;
