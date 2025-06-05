const axios = require('axios');
const FormData = require('form-data');

const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  origin: "https://imglarger.com",
  referer: "https://imglarger.com/"
};

function getExt(mime) {
  if (/png/.test(mime)) return "png";
  if (/jpe?g/.test(mime)) return "jpg";
  return "bin";
}

function randomName(mime) {
  return Math.random().toString(36).slice(2, 10) + "." + getExt(mime);
}

async function upscaleImage(buffer, mime) {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: randomName(mime), contentType: mime });
    form.append("type", "13");
    form.append("scaleRadio", "2");

    // Upload image
    const upload = await axios.post(
      "https://photoai.imglarger.com/api/PhoAi/Upload",
      form,
      { headers: { ...headers, ...form.getHeaders() } }
    );

    const up = upload.data?.data || {};
    if (!up.code || !up.type) {
      throw new Error("Gagal upload ke ImgLarger");
    }

    // Check processing status
    const statusHeaders = { ...headers, "content-type": "application/json" };
    let url;
    let attempts = 0;

    while (attempts++ < 40) {
      const stat = await axios.post(
        "https://photoai.imglarger.com/api/PhoAi/CheckStatus",
        { code: up.code, type: String(up.type) },
        { headers: statusHeaders }
      );
      
      const d = stat.data?.data || {};
      if (d.status === "success" && d.downloadUrls?.[0]) {
        url = d.downloadUrls[0];
        break;
      }
      if (d.status && d.status !== "waiting") {
        throw new Error(`Upscaler gagal, status: ${d.status}`);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!url) {
      throw new Error("Upscaler took too long. Try again later");
    }

    // Download the upscaled image
    const imageResponse = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    return {
      imageBuffer: Buffer.from(imageResponse.data, 'binary'),
      contentType: imageResponse.headers['content-type'] || mime,
      originalUrl: url
    };

  } catch (error) {
    console.error('Error in upscaleImage:', error);
    throw error;
  }
}

module.exports = upscaleImage;
