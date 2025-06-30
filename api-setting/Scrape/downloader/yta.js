const axios = require('axios');

async function yta(url) {
  const apiUrl = 'https://cdn304.savetube.su/v2/info';
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json',
    'origin': 'https://ytmp3.at',
    'priority': 'u=1, i',
    'referer': 'https://ytmp3.at/',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
  };

  const data = {
    url: url
  };

  try {
    // Step 1: Get video info
    const infoResponse = await axios.post(apiUrl, data, { headers });
    
    // Debug: Log the full response for inspection
    console.log('API Response:', infoResponse.data);
    
    // Handle different response formats
    let audioUrl = infoResponse.data?.url 
                || infoResponse.data?.downloadUrl 
                || infoResponse.data?.audioUrl 
                || infoResponse.data?.links?.audio;
    
    if (!audioUrl) {
      // If no direct audio URL found, try to find in formats array
      if (infoResponse.data?.formats) {
        const audioFormat = infoResponse.data.formats.find(f => 
          f.mimeType?.includes('audio') || f.audioQuality
        );
        if (audioFormat) audioUrl = audioFormat.url;
      }
    }
    
    if (!audioUrl) {
      // If still no URL, return the full response for debugging
      return {
        status: false,
        message: 'Audio URL not found in response',
        fullResponse: infoResponse.data
      };
    }

    // Step 2: Download the audio file
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'referer': 'https://ytmp3.at/'
      }
    });

    return {
      status: true,
      audioBuffer: Buffer.from(audioResponse.data, 'binary'),
      contentType: audioResponse.headers['content-type'] || 'audio/mpeg',
      metadata: {
        title: infoResponse.data?.title || 'YouTube Audio',
        duration: infoResponse.data?.duration,
        originalUrl: url
      }
    };

  } catch (error) {
    console.error('Error in yta scraper:', error);
    return {
      status: false,
      message: error.message,
      response: error.response?.data
    };
  }
}

module.exports = yta;
