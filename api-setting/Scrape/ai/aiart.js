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
  const headers = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9',
    'Content-Type': 'multipart/form-data',
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
    'Client-IP': ip,
    'Forwarded': `for=${ip}`
  };

  try {
    // Langsung menggunakan prompt tanpa modifikasi
    const form = new FormData();
    form.append('video_description', prompt.trim()); // Prompt langsung digunakan
    form.append('test_mode', 'false');
    form.append('model', 'stable-diffusion-3.5-ultra');
    form.append('negative_prompt', 'blurry, distorted, low quality');
    form.append('aspect_ratio', '16:9');
    form.append('style', 'Photographic');
    form.append('output_format', 'png');
    form.append('seed', '0');
    form.append('website', '');

    const { data } = await axios.post(
      'https://aiart-zroo.onrender.com/generate-txt2img-ui',
      form,
      { headers: { ...headers, ...form.getHeaders() } }
    );

    if (data?.image_path && !data.image_path.startsWith('http')) {
      data.image_url = `https://aiart-zroo.onrender.com${data.image_path}`;
    }

    return {
      status: true,
      data: {
        image_url: data.image_url || data.image_path,
        prompt: prompt.trim() // Mengembalikan prompt asli
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
