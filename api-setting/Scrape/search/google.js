const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

async function googleScraper(query, limit = 10) {
  const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${limit}`;

  try {
    const response = await axios.get(searchURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Connection': 'keep-alive'
      }
    });

    const $ = cheerio.load(response.data);
    const links = [];

    // Cara yang lebih reliable untuk ekstrak link hasil pencarian Google
    $('div.g').each((i, el) => {
      const link = $(el).find('a[href^="/url?q="]').attr('href');
      if (link) {
        const cleanURL = link.split('/url?q=')[1].split('&')[0];
        if (!cleanURL.includes('google.com')) {
          links.push(decodeURIComponent(cleanURL));
        }
      }
    });

    return {
      status: true,
      creator: "Your Name",
      result: links.slice(0, parseInt(limit))
    };
  } catch (err) {
    return {
      status: false,
      error: err.message
    };
  }
}

// Untuk penggunaan CLI
async function runCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise(resolve => rl.question(question, resolve));

  try {
    const query = await ask('MASUKAN KATA KUNCI: ');
    const limit = await ask('JUMLAH URL YANG INGIN DI AMBIL: ');
    
    const {status, creator, result} = await googleScraper(query, limit);
    
    if (status && result.length > 0) {
      console.log('\nHasil URL:');
      result.forEach((link, i) => console.log(`${i + 1}. ${link}`));
    } else {
      console.log('\nTidak ditemukan hasil atau terjadi error');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = googleScraper;
