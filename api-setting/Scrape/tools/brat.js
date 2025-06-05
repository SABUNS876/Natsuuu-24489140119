const { createCanvas } = require('canvas');
const fs = require('fs');

const bratTextGenerator = {
  /**
   * Generate Brat-style text image
   * @param {string} text - Text to display
   * @param {object} [options] - Style options
   * @param {string} [options.bgColor='#ffffff'] - Background color
   * @param {string} [options.textColor='#000000'] - Text color
   * @param {number} [options.width=800] - Canvas width
   * @param {number} [options.height=400] - Canvas height
   * @param {string} [options.font='60px Arial'] - Font style
   * @returns {Buffer} - PNG image buffer
   */
  generate(text, options = {}) {
    // Set default options
    const {
      bgColor = '#ffffff',
      textColor = '#000000',
      width = 800,
      height = 400,
      font = '60px Arial'
    } = options;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Split text into multiple lines if needed
    const lines = this._wrapText(ctx, text, width * 0.8);
    const lineHeight = 70;
    const startY = (height - (lines.length * lineHeight)) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + (i * lineHeight));
    });

    // Return as PNG buffer
    return canvas.toBuffer('image/png');
  },

  /**
   * Helper to wrap text
   * @private
   */
  _wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  },

  /**
   * Generate and save to file
   * @param {string} filePath - Output file path
   * @param {string} text - Text to display
   * @param {object} [options] - Style options
   */
  generateToFile(filePath, text, options) {
    const buffer = this.generate(text, options);
    fs.writeFileSync(filePath, buffer);
  }
};

module.exports = bratTextGenerator;
