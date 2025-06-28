const axios = require('axios');
const FormData = require('form-data');

async function JHZrooArt(prompt) {
  // Validasi input
  if (!prompt?.trim()) {
    return { 
      status: false, 
      error: 'Prompt tidak boleh kosong' 
    };
  }

  // Konfigurasi
  const config = {
    timeout: 25000, // 25 detik timeout
    maxSize: 2 * 1024 * 1024, // Batas 2MB
    baseUrl: 'https://aiart-zroo.onrender.com'
  };

  try {
    // 1. Generate gambar dengan semua parameter termasuk style dan aspect ratio
    const form = new FormData();
    form.append('video_description', prompt.trim());
    form.append('test_mode', 'false');
    form.append('model', 'stable-diffusion-3.5-ultra');
    form.append('negative_prompt', 'blurry, distorted, low quality');
    form.append('aspect_ratio', '16:9'); // Default landscape
    form.append('style', 'Photographic'); // Default style
    form.append('output_format', 'png'); // Tetap PNG
    form.append('seed', '0');
    form.append('website', '');

    // 2. Request generasi gambar
    const { data: genData } = await axios.post(
      `${config.baseUrl}/generate-txt2img-ui`,
      form,
      {
        headers: form.getHeaders(),
        timeout: config.timeout
      }
    );

    // 3. Dapatkan URL gambar
    const imageUrl = genData.image_path.startsWith('http')
      ? genData.image_path
      : `${config.baseUrl}${genData.image_path}`;

    // 4. Download gambar dengan batasan ukuran
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: config.timeout,
      maxContentLength: config.maxSize
    });

    // 5. Validasi ukuran
    if (response.data.length > config.maxSize) {
      throw new Error(`Ukuran gambar melebihi batas ${config.maxSize} bytes`);
    }

    return {
      status: true,
      data: {
        buffer: response.data,
        mime: 'image/png',
        size: response.data.length,
        prompt: prompt.trim()
      }
    };

  } catch (error) {
    return {
      status: false,
      error: error.message
    };
  }
}

module.exports = JHZrooArt;
