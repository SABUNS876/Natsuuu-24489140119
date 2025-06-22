const axios = require('axios');
const FormData = require('form-data');

async function editImageBuffer(imageBuffer, prompt, strength = 0.7) {
  // Validate inputs
  if (!Buffer.isBuffer(imageBuffer)) {
    return {
      status: false,
      message: 'Image must be provided as Buffer'
    };
  }

  if (!prompt || typeof prompt !== 'string') {
    return {
      status: false,
      message: 'Prompt must be a valid string'
    };
  }

  try {
    // 1. Upload the image to get a temporary URL
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'input.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await axios.post(
      'https://api.arting.ai/api/upload', // Replace with actual upload endpoint
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        }
      }
    );

    const tempImageUrl = uploadResponse.data.url;
    if (!tempImageUrl) {
      return {
        status: false,
        message: 'Failed to upload image'
      };
    }

    // 2. Prepare edit payload
    const payload = {
      image_url: tempImageUrl,
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
      strength: Math.min(Math.max(strength, 0.1), 0.9)
    };

    // 3. Request image editing
    const { data: createRes } = await axios.post(
      'https://api.arting.ai/api/cg/image-to-image/create',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const requestId = createRes?.data?.request_id;
    if (!requestId) {
      return {
        status: false,
        message: 'Failed to get request ID from API'
      };
    }

    // 4. Poll for result
    let retries = 0;
    let editedImageBuffer = null;
    const maxRetries = 15;
    const retryDelay = 3000;

    while (retries < maxRetries && !editedImageBuffer) {
      await new Promise(res => setTimeout(res, retryDelay));

      const { data: getRes } = await axios.post(
        'https://api.arting.ai/api/cg/image-to-image/get',
        { request_id: requestId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const output = getRes?.data?.output;
      if (output && output.length) {
        // Download the edited image directly to buffer
        const imageResponse = await axios.get(output[0], {
          responseType: 'arraybuffer'
        });
        editedImageBuffer = Buffer.from(imageResponse.data, 'binary');
        break;
      }
      retries++;
    }

    if (!editedImageBuffer) {
      return {
        status: false,
        message: 'Failed to get edited image after retries'
      };
    }

    return {
      status: true,
      imageBuffer: editedImageBuffer,
      contentType: 'image/jpeg', // or detect from response
      prompt: prompt
    };

  } catch (error) {
    console.error('Image editing error:', error);
    return {
      status: false,
      message: error.response?.data?.message || error.message || 'Image editing failed'
    };
  }
}

module.exports = editImageBuffer;
