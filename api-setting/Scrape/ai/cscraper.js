const fetch = require("node-fetch");
const cheerio = require("cheerio"); // Added for HTML parsing

/**
 * GENERATOR SCRAPER WHATSAPP DENGAN CHEERIO + AI
 * @param {string} fitur - Fitur scraping yang diinginkan 
 * @param {object} [options] - Konfigurasi tambahan
 * @param {number} [options.timeout=300000] - Timeout lebih lama untuk scraping
 * @returns {Promise<object>} - Kode scraper lengkap
 */
async function buatScraperWhatsApp(fitur, options = {}) {
  const {
    timeout = 300000
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  // Prompt sistem khusus web scraping + AI
  const promptSistem = `Anda adalah ahli pembuat web scraper dengan Cheerio dan AI. Buatkan fungsi dengan ketentuan:

1. STRUKTUR UTAMA:
   const axios = require('axios');
   const cheerio = require('cheerio');
   
   async function namaFungsi(params) {
     try {
       // 1. Scraping dengan Cheerio
       // 2. Proses dengan AI 
       // 3. Return hasil
     } catch (error) {
       // Error handling
     }
   }
   
   module.exports = namaFungsi;

2. TEKNIK SCRAPING:
   - Gunakan axios + cheerio
   - Rotate user-agent
   - Handle pagination jika perlu
   - Validasi data hasil scraping
   - Gunakan delay antara request

3. CONTOH IMPLEMENTASI:
   async function scrapeWebsite(url) {
     try {
       // 1. Fetch HTML
       const { data } = await axios.get(url, {
         headers: {
           'User-Agent': 'Mozilla/5.0...'
         }
       });
       
       // 2. Parse dengan Cheerio
       const $ = cheerio.load(data);
       const results = [];
       
       $('.product').each((i, el) => {
         results.push({
           title: $(el).find('h3').text().trim(),
           price: $(el).find('.price').text().trim()
         });
       });
       
       // 3. Proses dengan AI (contoh)
       const processed = await processWithAI(results);
       
       return processed;
     } catch (e) {
       throw new Error('Scrape failed: ' + e.message);
     }
   }

4. FITUR YANG DIMINTA: ${fitur}

5. ATURAN TAMBAHAN:
   - Jangan hardcode credentials
   - Validasi semua input
   - Handle error dengan baik
   - Kembalikan data terstruktur`;

  const response = await fetch('https://text.pollinations.ai/openai', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0...'
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: promptSistem },
        { role: "user", content: `Buatkan fungsi scraper untuk: ${fitur}` }
      ]
    }),
    timeout: timeout
  });

  const result = await response.json();
  let kodeScraper = result.choices[0].message.content;

  // Post-processing untuk pastikan Cheerio digunakan
  if (!kodeScraper.includes('cheerio')) {
    kodeScraper = kodeScraper.replace(/const axios = require\('axios'\);/,
      `const axios = require('axios');
const cheerio = require('cheerio');`);
  }

  return {
    sukses: true,
    kode: kodeScraper,
    fitur: fitur
  };
}

module.exports = buatScraperWhatsApp;
