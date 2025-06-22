const axios = require('axios');

async function editImageFromUrl(imageUrl, prompt) {
  const payload = {
    image_url: imageUrl,
    prompt,
    model_id: 'asyncsMIX_v7',
    samples: 1,
    height: 768,
    width: 512,
    negative_prompt: 'painting, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs, anime',
    seed: -1,
    lora_ids: '',
    lora_weight: '0.7',
    sampler: 'Euler a',
    steps: 25,
    guidance: 7,
    clip_skip: 2,
    strength: 0.7
  };

  try {
    // 1. Request edit gambar
    const { data: createRes } = await axios.post(
      'https://api.arting.ai/api/cg/image-to-image/create',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const requestId = createRes?.data?.request_id;
    if (!requestId) {
      return {
        status: false,
        message: 'Gagal mendapatkan request ID'
      };
    }

    // 2. Polling hasil
    let retries = 0;
    let resultBuffer = null;
    const maxRetries = 15;
    const retryDelay = 3000;

    while (retries < maxRetries && !resultBuffer) {
      await new Promise(res => setTimeout(res, retryDelay));

      const { data: getRes } = await axios.post(
        'https://api.arting.ai/api/cg/image-to-image/get',
        { request_id: requestId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const outputUrl = getRes?.data?.output?.[0];
      if (outputUrl) {
        // 3. Download langsung sebagai buffer
        const imageResponse = await axios.get(outputUrl, {
          responseType: 'arraybuffer'
        });
        resultBuffer = Buffer.from(imageResponse.data, 'binary');
        break;
      }
      retries++;
    }

    if (!resultBuffer) {
      return {
        status: false,
        message: 'Gagal mendapatkan hasil edit setelah beberapa percobaan'
      };
    }

    return {
      status: true,
      imageBuffer: resultBuffer,
      contentType: 'image/jpeg', // atau ambil dari header response
      promptUsed: prompt
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      status: false,
      message: error.message || 'Terjadi kesalahan saat mengedit gambar'
    };
  }
}

module.exports = editImageFromUrl;
