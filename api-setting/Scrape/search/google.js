const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

// Fungsi utama untuk scraping Google
async function googleScraper(query, limit = 10) {
  const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${limit}`;

  try {
    const response = await axios.get(searchURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    });

    const $ = cheerio.load(response.data);
    const links = [];

    // Mencari semua elemen hasil pencarian
    $('div.g').each((i, el) => {
      const linkElement = $(el).find('a[href^="/url?q="]');
      if (linkElement.length > 0) {
        const href = linkElement.attr('href');
        const url = new URLSearchParams(href.split('?')[1]).get('q');
        if (url && !url.includes('google.com')) {
          links.push(decodeURIComponent(url));
        }
      }
    });

    // Jika tidak ada hasil, coba metode alternatif
    if (links.length === 0) {
      $('a[href^="/url?q="]').each((i, el) => {
        const href = $(el).attr('href');
        const url = new URLSearchParams(href.split('?')[1]).get('q');
        if (url && !url.includes('google.com')) {
          links.push(decodeURIComponent(url));
        }
      });
    }

    return {
      status: true,
      creator: "Natsu - Api",
      result: links.slice(0, limit)
    };

  } catch (err) {
    return {
      status: false,
      error: err.message,
      result: []
    };
  }
}

// Fungsi untuk menjalankan CLI
async function runCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise(resolve => rl.question(question, resolve));

  try {
    const query = await ask('MASUKAN KATA KUNCI: ');
    const limit = await ask('JUMLAH URL YANG INGIN DI AMBIL: ');
    
    const scrapingResult = await googleScraper(query, limit);
    
    // Pastikan struktur response konsisten
    const finalResult = {
      status: scrapingResult.status,
      creator: "Natsu - Api",
      result: scrapingResult.result || []
    };

    console.log('\nHasil:');
    console.log(JSON.stringify(finalResult, null, 2));

    if (finalResult.result.length > 0) {
      console.log('\nDetail URL:');
      finalResult.result.forEach((link, i) => console.log(`${i + 1}. ${link}`));
    } else {
      console.log('\nTidak ditemukan hasil pencarian');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    rl.close();
  }
}

// Jika dijalankan langsung
if (require.main === module) {
  runCLI();
}

// Export untuk penggunaan sebagai module
module.exports = googleScraper;
