const axios = require('axios');
const FormData = require('form-data');

// Config
const CONFIG = {
  MAX_RETRIES: 3,
  DELAY_BETWEEN_REQUESTS: 5000, // 5 detik
  DELAY_AFTER_LIMIT: 60000, // 1 menit jika kena limit
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0'
  ],
  PRODUCT_SERIALS: [
    'c25cb430662409bdea35c95eceaffa1f',
    '7858ccf6b18ce68bf56a8163c17ee64a',
    '3a7b6c4d5e6f7a8b9c0d1e2f3a4b5c6d'
  ]
};

async function remakerai(prompt, retryCount = 0) {
  try {
    // Random rotation untuk menghindari deteksi
    const randomUserAgent = CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
    const randomProductSerial = CONFIG.PRODUCT_SERIALS[Math.floor(Math.random() * CONFIG.PRODUCT_SERIALS.length)];

    const form = new FormData();
    form.append('prompt', prompt);
    form.append('style', 'anime');
    form.append('aspect_ratio', '16:9');

    const headers = {
      ...form.getHeaders(),
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'authorization': '',
      'origin': 'https://remaker.ai',
      'priority': 'u=1, i',
      'product-code': '067003',
      'product-serial': randomProductSerial,
      'referer': 'https://remaker.ai/',
      'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': randomUserAgent
    };

    // Tambahkan delay antara request
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS));
    }

    // Create job
    const createResponse = await axios.post(
      'https://api.remaker.ai/api/pai/v4/ai-anime/create-job',
      form, { headers }
    );

    const job_id = createResponse.data.result.job_id;
    let imageUrl;

    // Check job status dengan timeout
    for (let i = 0; i < 20; i++) {
      try {
        const checkResponse = await axios.get(
          `https://api.remaker.ai/api/pai/v4/ai-anime/get-job/${job_id}`,
          { headers, timeout: 10000 }
        );

        const result = checkResponse.data.result?.output;
        if (result && result.length > 0) {
          imageUrl = result[0];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(`Check job attempt ${i + 1} failed:`, e.message);
      }
    }

    if (!imageUrl) {
      throw new Error('Failed to get image URL after multiple attempts');
    }

    // Download image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });

    return Buffer.from(imageResponse.data, 'binary');

  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      if (error.response && error.response.status === 429) {
        console.warn(`Rate limited, waiting ${CONFIG.DELAY_AFTER_LIMIT/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_AFTER_LIMIT));
      }
      return remakerai(prompt, retryCount + 1);
    }
    throw new Error(`Final error after ${CONFIG.MAX_RETRIES} retries: ${error.message}`);
  }
}

module.exports = remakerai;
