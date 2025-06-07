const { randomInt } = require('crypto');

/**
 * Gay Checker Scraper
 * @param {string} name - Nama yang akan dicek
 * @returns {object} Hasil pemeriksaan dalam format yang diminta
 */
function gayScraper(name) {
  // Generate random score antara 0-10000 (0.00-100.00 dalam format desimal)
  const score = randomInt(0, 10001);
  const percentage = (score / 100).toFixed(2);
  
  // Tentukan label berdasarkan score
  let label;
  let confidence;
  
  if (score < 3000) {
    label = 'Normal';
    confidence = 'Low';
  } else if (score < 6000) {
    label = 'Moderate';
    confidence = 'Medium';
  } else if (score < 8000) {
    label = 'Gay';
    confidence = 'High';
  } else {
    label = 'Super Gay';
    confidence = 'Very High';
  }
  
  return {
    data: {
      label: label,
      score: score,
      confidence: confidence,
      raw: {
        label: label,
        score: score
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

module.exports = gayScraper;
