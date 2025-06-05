const fetch = require('node-fetch');

class DesktopScreenshot {
  constructor() {
    this.apiKeys = ["1b484c", "965abb", "731a82", "194174"];
    this.deviceProfile = {
      type: "desktop",
      dimension: "1024x768",
      name: "💻 Desktop View"
    };
  }

  /**
   * Capture desktop screenshot of a webpage
   * @param {string} url - Website URL
   * @returns {Promise<Buffer>} - Image buffer
   */
  async capture(url) {
    if (!url || !url.match(/^https?:\/\//i)) {
      throw new Error('❌ URL tidak valid. Gunakan format http:// atau https://');
    }

    const randomKey = this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)];
    const apiUrl = `https://api.screenshotmachine.com/?key=${randomKey}&url=${
      encodeURIComponent(url)
    }&device=${this.deviceProfile.type}&dimension=${
      this.deviceProfile.dimension
    }&format=png&cacheLimit=0&delay=1000`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('❌ Gagal mengambil screenshot. Coba lagi nanti.');
    }

    return {
      image: await response.buffer(),
      meta: {
        url,
        device: this.deviceProfile.name,
        resolution: this.deviceProfile.dimension
      }
    };
  }
}

module.exports = new DesktopScreenshot();
