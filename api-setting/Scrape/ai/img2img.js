const axios = require('axios');

const aiimage = {
  /**
   * Generate image from text prompt
   * @param {string} prompt - The text prompt for image generation
   * @returns {Promise<Object>} - Returns image buffer and metadata
   */
  async generate(prompt) {
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
      // 1. Request image creation
      const { data: createRes } = await axios.post(
        'https://api.arting.ai/api/cg/text-to-image/create',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const requestId = createRes?.data?.request_id;
      if (!requestId) throw new Error('Failed to get request ID');

      // 2. Poll for result
      let retries = 0;
      let resultUrl = null;
      const maxRetries = 10;
      const retryDelay = 2000;

      while (retries < maxRetries && !resultUrl) {
        await new Promise(res => setTimeout(res, retryDelay));

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

      if (!resultUrl) throw new Error('Failed to get image URL after retries');

      // 3. Download image
      const imageResponse = await axios.get(resultUrl, {
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        imageBuffer: Buffer.from(imageResponse.data, 'binary'),
        contentType: imageResponse.headers['content-type'],
        prompt: prompt,
        url: resultUrl,
        note: 'Image returned as buffer'
      };

    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate image'
      };
    }
  },

  /**
   * Edit image using text prompt
   * @param {string} imageUrl - URL of the image to edit
   * @param {string} prompt - The text prompt for image editing
   * @param {number} [strength=0.7] - Edit strength (0-1)
   * @returns {Promise<Object>} - Returns edited image buffer and metadata
   */
  async edit(imageUrl, prompt, strength = 0.7) {
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
      strength: Math.min(Math.max(strength, 0.1), 0.9) // Clamp between 0.1-0.9
    };

    try {
      // 1. Request image editing
      const { data: createRes } = await axios.post(
        'https://api.arting.ai/api/cg/image-to-image/create',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const requestId = createRes?.data?.request_id;
      if (!requestId) throw new Error('Failed to get request ID');

      // 2. Poll for result
      let retries = 0;
      let resultUrl = null;
      const maxRetries = 15;
      const retryDelay = 3000;

      while (retries < maxRetries && !resultUrl) {
        await new Promise(res => setTimeout(res, retryDelay));

        const { data: getRes } = await axios.post(
          'https://api.arting.ai/api/cg/image-to-image/get',
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

      if (!resultUrl) throw new Error('Failed to get edited image URL after retries');

      // 3. Download edited image
      const imageResponse = await axios.get(resultUrl, {
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        imageBuffer: Buffer.from(imageResponse.data, 'binary'),
        contentType: imageResponse.headers['content-type'],
        originalImageUrl: imageUrl,
        prompt: prompt,
        url: resultUrl,
        note: 'Edited image returned as buffer'
      };

    } catch (error) {
      console.error('Image editing error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to edit image'
      };
    }
  },

  /**
   * Generate multiple variations of an image
   * @param {string} imageUrl - URL of the source image
   * @param {string} prompt - The text prompt for variations
   * @param {number} [variations=4] - Number of variations to generate (1-8)
   * @returns {Promise<Object>} - Returns array of image buffers and metadata
   */
  async variations(imageUrl, prompt, variations = 4) {
    const payload = {
      image_url: imageUrl,
      prompt,
      model_id: 'asyncsMIX_v7',
      samples: Math.min(Math.max(variations, 1), 8), // Clamp between 1-8
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
      strength: 0.6
    };

    try {
      // 1. Request variations
      const { data: createRes } = await axios.post(
        'https://api.arting.ai/api/cg/image-to-image/create',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const requestId = createRes?.data?.request_id;
      if (!requestId) throw new Error('Failed to get request ID');

      // 2. Poll for results
      let retries = 0;
      let resultUrls = [];
      const maxRetries = 20;
      const retryDelay = 3000;

      while (retries < maxRetries && resultUrls.length < payload.samples) {
        await new Promise(res => setTimeout(res, retryDelay));

        const { data: getRes } = await axios.post(
          'https://api.arting.ai/api/cg/image-to-image/get',
          { request_id: requestId },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const output = getRes?.data?.output;
        if (output && output.length) {
          resultUrls = output;
          break;
        }
        retries++;
      }

      if (resultUrls.length === 0) throw new Error('Failed to get variation URLs after retries');

      // 3. Download all variations
      const variationPromises = resultUrls.map(url => 
        axios.get(url, { responseType: 'arraybuffer' })
      );
      
      const variationsResponse = await Promise.all(variationPromises);

      const results = variationsResponse.map((response, index) => ({
        imageBuffer: Buffer.from(response.data, 'binary'),
        contentType: response.headers['content-type'],
        url: resultUrls[index],
        variationNumber: index + 1
      }));

      return {
        success: true,
        variations: results,
        originalImageUrl: imageUrl,
        prompt: prompt,
        note: `${results.length} variations returned as buffers`
      };

    } catch (error) {
      console.error('Image variations error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate image variations'
      };
    }
  }
};

module.exports = aiimage;
