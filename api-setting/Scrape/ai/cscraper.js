const fetch = require("node-fetch");
const cheerio = require("cheerio");

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

  // Prompt sistem yang lebih ketat dan detail
  const promptSistem = `Anda adalah ahli pembuat web scraper dengan Cheerio dan AI. Ikuti petunjuk berikut dengan TEPAT:

1. STRUKTUR KODE WAJIB:
   const axios = require('axios');
   const cheerio = require('cheerio');
   // Tambahan require lain jika perlu
   
   async function namaFungsi(params) {
     try {
       // [1] Validasi input
       // [2] Fetch HTML
       // [3] Parse dengan Cheerio
       // [4] Proses data
       // [5] Return hasil
     } catch (error) {
       // Error handling spesifik
       throw new Error(\`Deskripsi error jelas: \${error.message}\`);
     }
   }
   
   module.exports = namaFungsi;

2. TEKNIK SCRAPING KETAT:
   - WAJIB gunakan try-catch
   - WAJIB validasi input URL/parameter
   - WAJIB gunakan User-Agent realistis
   - WAJIB handle minimal 3 jenis error:
     * Network error
     * Selector not found
     * Invalid data structure
   - WAJIB beri delay minimal 2 detik antar request
   - WAJIB validasi HTML sebelum parsing

3. CONTOH IMPLEMENTASI YANG BENAR:
   async function scrapeNews(url) {
     try {
       // [1] Validasi URL
       if (!url || !url.startsWith('http')) {
         throw new Error('URL tidak valid');
       }
       
       // [2] Fetch dengan headers
       const { data } = await axios.get(url, {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
           'Accept': 'text/html'
         },
         timeout: 10000
       });
       
       // [3] Validasi HTML
       if (!data || typeof data !== 'string' || data.length < 100) {
         throw new Error('HTML tidak valid');
       }
       
       // [4] Parse dengan Cheerio
       const $ = cheerio.load(data);
       const articles = [];
       
       // [5] Cek selector ada
       if ($('.news-item').length === 0) {
         throw new Error('Selector .news-item tidak ditemukan');
       }
       
       // [6] Ekstrak data
       $('.news-item').each((i, el) => {
         const title = $(el).find('h2').text().trim();
         const date = $(el).find('.date').text().trim();
         
         if (!title) return; // Skip jika data tidak lengkap
         
         articles.push({ title, date });
       });
       
       // [7] Validasi hasil
       if (articles.length === 0) {
         throw new Error('Tidak ada data yang berhasil di-scrape');
       }
       
       return articles;
       
     } catch (error) {
       console.error(\`[SCRAPE ERROR] \${error.message}\`);
       throw new Error(\`Gagal scrape: \${error.message}\`);
     }
   }

4. FITUR YANG DIMINTA: ${fitur}

5. LARANGAN KETAT:
   - JANGAN gunakan innerHTML/textContent langsung
   - JANGAN hardcode credentials
   - JANGAN asumsi selector selalu ada
   - JANGAN lupa timeout request
   - JANGAN return data tanpa validasi

6. CATATAN TAMBAHAN:
   - Kode HARUS bisa di-run langsung
   - Setiap fungsi HARUS memiliki error handling
   - Prioritas ke reliability bukan kecepatan
   - Dokumentasi minimal setiap langkah utama`;

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
        ]
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
    if (!kodeScraper.includes('cheerio')) {
      throw new Error('Kode tidak menggunakan Cheerio');
    }
    if (!kodeScraper.includes('try') || !kodeScraper.includes('catch')) {
      throw new Error('Kode tidak memiliki error handling');
    }

    return {
      sukses: true,
      kode: kodeScraper,
      fitur: fitur,
      warnings: [
        'Pastikan untuk:',
        '1. Ganti semua placeholder API key',
        '2. Test di environment aman',
        '3. Tambahkan delay antara request'
      ]
    };

  } catch (error) {
    return {
      sukses: false,
      error: error.message,
      solusi: [
        'Coba lagi dengan penjelasan lebih detail',
        'Tambahkan contoh URL target',
        'Sertakan contoh struktur HTML yang akan di-scrape'
      ]
    };
  }
}

module.exports = buatScraperWhatsApp;
