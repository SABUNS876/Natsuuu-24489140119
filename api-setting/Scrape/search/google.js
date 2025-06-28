const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

async function googleScraper(query, limit) {
  const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${limit}`;

  try {
    const response = await axios.get(searchURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const $ = cheerio.load(response.data);
    const links = [];

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/url?q=')) {
        const cleanURL = href.split('/url?q=')[1].split('&')[0];
        if (!cleanURL.includes('google.com')) {
          links.push(cleanURL);
        }
      }
    });

    return links.slice(0, parseInt(limit));
  } catch (err) {
    throw new Error('Gagal mengambil hasil: ' + err.message);
  }
}

async function runCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(query) {
    return new Promise(resolve => {
      rl.question(query, resolve);
    });
  }

  try {
    const query = await askQuestion('MASUKAN KATA KUNCI: ');
    const limit = await askQuestion('JUMLAH URL YANG INGIN DI AMBIL: ');
    
    const results = await googleScraper(query, limit);
    
    console.log('\nHasil URL:');
    results.forEach((link, i) => console.log(`${i + 1}. ${link}`));
  } catch (err) {
    console.error(err.message);
  } finally {
    rl.close();
  }
}

// Jika dijalankan langsung dari command line
if (require.main === module) {
  runCLI();
}

// Export untuk bisa digunakan di module lain
module.exports = googleScraper;
