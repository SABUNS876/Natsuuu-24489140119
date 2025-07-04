const fetch = require("node-fetch");
const cheerio = require("cheerio");
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { URL } = require('url');

/**
 * GENERIC WEB SCRAPER DENGAN CHEERIO + AI + PUPPETEER + API REQUEST
 * @param {string} fitur - Deskripsi fitur scraping yang diinginkan
 * @param {object} [options] - Konfigurasi tambahan
 * @param {number} [options.timeout=300000] - Timeout request
 * @param {boolean} [options.usePuppeteer=false] - Gunakan Puppeteer untuk JS rendering
 * @param {string} [options.outputFile] - Nama file untuk menyimpan hasil
 * @param {boolean} [options.execute=false] - Eksekusi langsung scraper yang dihasilkan
 * @param {string} [options.targetUrl] - URL target untuk dieksekusi
 * @returns {Promise<object>} - Kode scraper dan hasil eksekusi
 */
async function buatScraperAI(fitur, options = {}) {
  const {
    timeout = 300000,
    usePuppeteer = false,
    outputFile = null,
    execute = false,
    targetUrl = null
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  if (execute && !targetUrl) {
    throw new Error('targetUrl diperlukan ketika execute=true');
  }

  // Prompt sistem yang diperbarui
  const promptSistem = `Anda adalah ahli pembuat web scraper dengan Cheerio, Puppeteer, dan API requests. Ikuti petunjuk berikut:

1. LIBRARY YANG TERSEDIA:
   - cheerio, axios, node-fetch, puppeteer, fs, url

2. FITUR KHUSUS:
   - Dapat melakukan scraping HTML
   - Dapat melakukan API requests langsung
   - Dapat mengekstrak data dari JSON response
   - Support pagination
   - Support authentication

3. STRUKTUR KODE:
   async function mainScraper(url, config = {}) {
     try {
       // [1] Validasi input
       // [2] Fetch data (HTML/API)
       // [3] Proses data
       // [4] Return hasil
     } catch (error) {
       throw new Error(\`Error: \${error.message}\`);
     }
   }

4. CONTOH API REQUEST:
   // Contoh request API dengan auth
   async function getApiData(url) {
     const response = await fetch(url, {
       headers: {
         'Authorization': 'Bearer token',
         'Content-Type': 'application/json'
       }
     });
     return await response.json();
   }

5. FITUR YANG DIMINTA: ${fitur}`;

  try {
    // Generate scraper code dengan AI
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
          outputFile,
          supportApi: true
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

    // Validasi kode
    if (!kodeScraper.includes('async function')) {
      throw new Error('Kode scraper tidak valid');
    }

    // Eksekusi langsung jika diminta
    let hasilEksekusi = null;
    if (execute) {
      try {
        // Buat modul virtual untuk mengeksekusi scraper
        const vm = require('vm');
        const sandbox = {
          require: (mod) => {
            const allowed = ['axios', 'cheerio', 'node-fetch', 'puppeteer', 'fs', 'url'];
            if (!allowed.includes(mod)) throw new Error(`Module ${mod} tidak diizinkan`);
            return require(mod);
          },
          console,
          setTimeout,
          clearTimeout,
          setInterval,
          clearInterval,
          URL,
          process
        };

        // Tambahkan fungsi helper ke sandbox
        sandbox.module = { exports: {} };
        sandbox.exports = sandbox.module.exports;

        // Eksekusi kode scraper
        vm.createContext(sandbox);
        vm.runInContext(kodeScraper, sandbox);

        // Dapatkan fungsi utama dari modul
        const scraperFunc = sandbox.module.exports;
        if (typeof scraperFunc !== 'function') {
          throw new Error('Fungsi utama tidak ditemukan di module.exports');
        }

        // Eksekusi scraper dengan targetUrl
        hasilEksekusi = await scraperFunc(targetUrl, options);

        // Simpan ke file jika diperlukan
        if (outputFile) {
          fs.writeFileSync(outputFile, JSON.stringify(hasilEksekusi, null, 2));
        }
      } catch (error) {
        throw new Error(`Gagal mengeksekusi scraper: ${error.message}`);
      }
    }

    return {
      sukses: true,
      kode: kodeScraper,
      hasil: hasilEksekusi,
      metadata: {
        libraries: ['cheerio', 'axios', 'node-fetch', usePuppeteer ? 'puppeteer' : null].filter(Boolean),
        eksekusi: execute ? 'Berhasil' : 'Tidak dieksekusi',
        targetUrl: execute ? targetUrl : null
      }
    };

  } catch (error) {
    return {
      sukses: false,
      error: error.message,
      solusi: [
        'Pastikan targetUrl valid dan accessible',
        'Coba set usePuppeteer=true jika website menggunakan JavaScript',
        'Periksa kode yang dihasilkan untuk kesalahan sintaks',
        'Tambahkan delay antara request jika terkena rate limiting'
      ]
    };
  }
}

// Contoh penggunaan:
// buatScraperAI("Scraper produk Shopee dengan API", {
//   execute: true,
//   targetUrl: "https://shopee.co.id/api/v4/item/get?itemid=12345678",
//   outputFile: "hasil.json"
// });

module.exports = buatScraperAI;
