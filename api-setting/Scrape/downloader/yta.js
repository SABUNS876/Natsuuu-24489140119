const axios = require('axios');
const querystring = require('querystring');

/*
- HARGAI WOY JANGAN DIHAPUS!
- Skrep by *JH a.k.a DHIKA - FIONY BOT*
- Credits to all Fiony's Bot Admin.
- Maaf kalo kurang maksimal atau berantakan
- Hasil gabut saja xixixi.
*/

async function JHVidDowns(youtubeUrl) {
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return {
      error: 'URL harus berupa string yang valid'
    };
  }

  const payload = querystring.stringify({ url: youtubeUrl });

  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://www.videodowns.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    const { data } = await axios.post(
      'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
      payload,
      { headers }
    );

    const info = data.info || {};
    const formats = data.formats || {};
    
    const generateLink = (formatType) => {
      if (formats[formatType]?.ext) {
        return `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(youtubeUrl)}&format=${formatType}`;
      }
      return null;
    };

    return {
      status: true,
      data: {
        metadata: {
          title: info.title || null,
          channel: info.channel || info.author || null,
          views: info.view_count || null,
          duration: info.duration || null,
          thumbnail: data.thumbnail || null
        },
        downloads: {
          best_quality: generateLink('best'),
          medium_quality: generateLink('medium'),
          low_quality: generateLink('low'),
          audio_only: generateLink('audio')
        },
        sanitized_url: data.sanitized || null
      }
    };
  } catch (error) {
    return {
      status: false,
      error: error.response?.data || error.message
    };
  }
}

module.exports = JHVidDowns;
