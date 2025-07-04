const fetch = require("node-fetch");
const cheerio = require("cheerio");
const axios = require('axios');
const puppeteer = require('puppeteer'); // Untuk website yang membutuhkan rendering JS
const fs = require('fs'); // Untuk menyimpan hasil scraping
const { URL } = require('url'); // Untuk validasi URL

/**
 * GENERIC WEB SCRAPER DENGAN CHEERIO + AI + PUPPETEER
 * @param {string} fitur - Deskripsi fitur scraping yang diinginkan
 * @param {object} [options] - Konfigurasi tambahan
 * @param {number} [options.timeout=300000] - Timeout request
 * @param {boolean} [options.usePuppeteer=false] - Gunakan Puppeteer untuk JS rendering
 * @param {string} [options.outputFile] - Nama file untuk menyimpan hasil
 * @returns {Promise<object>} - Kode scraper lengkap
 */
async function buatScraperAI(fitur, options = {}) {
  const {
    timeout = 300000,
    usePuppeteer = false,
    outputFile = null
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  // Prompt sistem yang lebih generik untuk berbagai website
  const promptSistem = `Anda adalah ahli pembuat web scraper dengan Cheerio, Puppeteer, dan AI. Ikuti petunjuk berikut dengan TEPAT:

1. LIBRARY YANG TERSEDIA:
   - cheerio: Untuk parsing HTML/XML
   - axios: Untuk HTTP requests
   - node-fetch: Alternatif untuk HTTP requests
   - puppeteer: Untuk website yang butuh JavaScript rendering
   - fs: Untuk menyimpan hasil ke file
   - url: Untuk validasi URL

2. STRUKTUR KODE WAJIB:
   const axios = require('axios');
   const cheerio = require('cheerio');
   // Tambahan require lain jika perlu
   
   async function namaFungsi(params) {
     try {
       // [1] Validasi input
       // [2] Fetch HTML (axios/puppeteer)
       // [3] Parse dengan Cheerio
       // [4] Proses data
       // [5] Simpan hasil (opsional)
       // [6] Return hasil
     } catch (error) {
       // Error handling spesifik
       throw new Error(\`Deskripsi error jelas: \${error.message}\`);
     }
   }
   
   module.exports = namaFungsi;

3. TEKNIK SCRAPING KETAT:
   - WAJIB gunakan try-catch
   - WAJIB validasi semua input
   - WAJIB gunakan User-Agent realistis
   - WAJIB handle minimal 5 jenis error:
     * Network error
     * Selector not found
     * Invalid data structure
     * Timeout
     * Anti-scraping protection
   - WAJIB beri delay 2-5 detik antar request
   - WAJIB validasi HTML sebelum parsing
   - WAJIB gunakan proxy jika diperlukan

4. CONTOH IMPLEMENTASI MULTI-SITE:
   // Contoh 1: E-commerce
   async function scrapeProduct(url) {
     try {
       if (!isValidUrl(url)) throw new Error('URL invalid');
       
       const { data } = await axios.get(url, {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
           'Referer': 'https://www.google.com/'
         },
         timeout: 15000
       });
       
       const $ = cheerio.load(data);
       const product = {
         name: $('h1.product-title').text().trim(),
         price: $('.price').first().text().trim(),
         description: $('#product-desc').text().trim().substring(0, 500)
       };
       
       if (!product.name) throw new Error('Product name not found');
       
       return product;
     } catch (error) {
       throw new Error(\`Scrape failed: \${error.message}\`);
     }
   }

   // Contoh 2: Dengan Puppeteer
   async function scrapeDynamicPage(url) {
     let browser;
     try {
       browser = await puppeteer.launch({ headless: true });
       const page = await browser.newPage();
       
       await page.setUserAgent('Mozilla/5.0...');
       await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
       
       // Tangkap data dari evaluasi JS
       const data = await page.evaluate(() => {
         return {
           title: document.title,
           content: document.querySelector('.main-content')?.innerText
         };
       });
       
       if (!data.title) throw new Error('Title not found');
       
       return data;
     } finally {
       if (browser) await browser.close();
     }
   }

5. FITUR YANG DIMINTA: ${fitur}

6. LARANGAN KETAT:
   - JANGAN gunakan innerHTML/textContent langsung tanpa sanitasi
   - JANGAN hardcode credentials/API keys
   - JANGAN asumsi selector selalu ada
   - JANGAN lupa cleanup resources (Puppeteer)
   - JANGAN return data tanpa validasi

7. CATATAN TAMBAHAN:
   - Kode HARUS bisa di-run langsung
   - Tambahkan komentar untuk setiap bagian penting
   - Handle pagination jika diperlukan
   - Pertimbangkan rate limiting
   - Gunakan cache jika memungkinkan
   - Harus versi nyata dari website tersebut`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: promptSistem },
          { role: "user", content: `Buatkan fungsi scraper untuk: ${fitur}` }
        ],
        options: {
          usePuppeteer,
          outputFile
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    let kodeScraper = result.choices[0].message.content;

    // Validasi tambahan
    const validasi = [
      { name: 'Error Handling', valid: kodeScraper.includes('try') && kodeScraper.includes('catch') },
      { name: 'Input Validation', valid: kodeScraper.includes('valid') || kodeScraper.includes('check') },
      { name: 'Library Check', valid: kodeScraper.includes('require(') },
      { name: 'Selector Safety', valid: !kodeScraper.includes('.innerHTML') && !kodeScraper.includes('.textContent') }
    ];

    const errors = validasi.filter(v => !v.valid).map(v => v.name);
    if (errors.length > 0) {
      throw new Error(`Validasi gagal: ${errors.join(', ')}`);
    }

    // Tambahkan fitur penyimpanan file jika diperlukan
    if (outputFile && !kodeScraper.includes('fs.writeFile')) {
      kodeScraper += `

// Fungsi untuk menyimpan hasil ke file
function saveToFile(data, filename) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(\`Data disimpan ke \${filename}\`);
  } catch (err) {
    console.error('Gagal menyimpan file:', err);
  }
}`;
    }

    return {
      sukses: true,
      kode: kodeScraper,
      fitur: fitur,
      metadata: {
        libraries: ['cheerio', 'axios', 'node-fetch', usePuppeteer ? 'puppeteer' : null].filter(Boolean),
        warnings: [
          'Pastikan untuk:',
          '1. Ganti semua placeholder dengan nilai sebenarnya',
          '2. Test di environment aman',
          '3. Tambahkan delay antara request (min 2 detik)',
          '4. Pertimbangkan menggunakan proxy/rotasi IP'
        ]
      }
    };

  } catch (error) {
    return {
      sukses: false,
      error: error.message,
      solusi: [
        'Coba lagi dengan penjelasan lebih detail tentang target website',
        'Sertakan contoh struktur HTML yang akan di-scrape',
        'Tambahkan opsi usePuppeteer=true jika website menggunakan banyak JavaScript',
        'Gunakan contoh URL spesifik'
      ]
    };
  }
}

module.exports = buatScraperAI;
