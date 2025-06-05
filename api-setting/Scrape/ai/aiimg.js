const axios = require('axios');

async function artingAI(prompt) {
  const payload = {
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
    clip_skip: 2
  };

  try {
    // 1. Request pembuatan gambar
    const { data: createRes } = await axios.post(
      'https://api.arting.ai/api/cg/text-to-image/create',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const requestId = createRes?.data?.request_id;
    if (!requestId) throw new Error('Request ID tidak ditemukan');

    // 2. Polling hasil gambar
    let retries = 0;
    let resultUrl = null;

    while (retries < 10 && !resultUrl) {
      await new Promise(res => setTimeout(res, 2000));

      const { data: getRes } = await axios.post(
        'https://api.arting.ai/api/cg/text-to-image/get',
        { request_id: requestId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const output = getRes?.data?.output;
      if (output && output.length) {
        resultUrl = output[0];
        break;
      }

      retries++;
    }

    if (!resultUrl) throw new Error('Gagal mendapatkan URL gambar');

    // 3. Download gambar sebagai buffer
    const imageResponse = await axios.get(resultUrl, {
      responseType: 'arraybuffer'
    });

    // 4. Kembalikan buffer gambar dan content type
    return {
      imageBuffer: Buffer.from(imageResponse.data, 'binary'),
      contentType: imageResponse.headers['content-type'],
      prompt: prompt,
      note: 'Gambar langsung dikirim sebagai buffer'
    };

  } catch (error) {
    console.error('Error in artingAI:', error);
    throw new Error(`Gagal memproses gambar: ${error.message}`);
  }
}

module.exports = artingAI;
