const axios = require('axios');
const cheerio = require('cheerio');

async function imgHd(url, scales) {
  let data = await axios.post('https://toolsapi.spyne.ai/api/forward', {
    image_url: url,
    scale: scales,
    save_params: {
      extension: ".png",
      quality: 100,
    }
  }, {
    headers: {
      "content-type": "application/json",
      accept: "*/*",
    }
  });
  return data;
}

module.exports = {
  imgHd
};
