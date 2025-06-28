const axios = require('axios');
const FormData = require('form-data');

async function JHZrooArt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt harus berupa string yang valid');
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

  const form = new FormData();
  form.append('video_description', prompt.trim());
  form.append('test_mode', 'false');
  form.append('model', 'stable-diffusion-3.5-ultra');
  form.append('negative_prompt', 'blurry, distorted, low quality');
  form.append('aspect_ratio', '1:1');
  form.append('style', 'Photographic');
  form.append('output_format', 'png');
  form.append('seed', '0');
  form.append('website', '');

  // Generate the image
  const { data } = await axios.post(
    'https://aiart-zroo.onrender.com/generate-txt2img-ui',
    form,
    { headers: { ...headers, ...form.getHeaders() } }
  );

  // Get image URL
  const imageUrl = data?.image_path?.startsWith('http') 
    ? data.image_path 
    : `https://aiart-zroo.onrender.com${data.image_path}`;

  if (!imageUrl) throw new Error('Failed to get image URL');

  // Download and return the raw image buffer
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://aiart-zroo.onrender.com/'
    }
  });

  return Buffer.from(imageResponse.data);
}

module.exports = JHZrooArt;
