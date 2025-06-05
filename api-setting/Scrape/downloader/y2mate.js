const axios = require('axios');
const fetch = require('node-fetch');
const fs = require('fs');

class YouTubeDownloader {
  constructor() {
    this.formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];
    this.formatVideo = ['360', '480', '720', '1080', '1440', '4k'];
  }

  async #checkProgress(id) {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: this.#getHeaders()
    };

    while (true) {
      const response = await axios.request(config);
      if (response.data?.success && response.data.progress === 1000) {
        return response.data.download_url;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  #getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Connection': 'keep-alive',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  async download(url, format) {
    if (!this.formatAudio.includes(format) && !this.formatVideo.includes(format)) {
      throw new Error(`Invalid format. Audio formats: ${this.formatAudio.join(', ')}. Video qualities: ${this.formatVideo.join(', ')}`);
    }

    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: this.#getHeaders()
    };

    const response = await axios.request(config);

    if (response.data?.success) {
      const { id, title, info } = response.data;
      const downloadUrl = await this.#checkProgress(id);

      return {
        status: true,
        data: {
          id,
          image: info.image,
          title,
          downloadUrl,
          format,
          type: this.formatAudio.includes(format) ? 'audio' : 'video'
        }
      };
    }

    throw new Error('Failed to process download request');
  }

  async getMetadata(url) {
    try {
      const response = await axios.get(`https://ytdl.vreden.web.id/metadata?url=${url}`);
      return {
        status: true,
        data: response.data
      };
    } catch (error) {
      return {
        status: false,
        message: error.message
      };
    }
  }

  async handleRequest(req, res) {
    try {
      const { url, format = 'mp3', type = 'download' } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          message: 'URL parameter is required'
        });
      }

      let result;
      if (type === 'metadata') {
        result = await this.getMetadata(url);
      } else {
        result = await this.download(url, format);
      }

      if (result.status) {
        res.json({
          status: true,
          creator: "YourName - API",
          result: result.data
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }
}

// Initialize and export single instance
const youTubeDownloader = new YouTubeDownloader();

// Hot reload
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Updated ${__filename}`);
  delete require.cache[file];
});

module.exports = youTubeDownloader;
