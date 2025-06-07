const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

// 1. Inisialisasi Aplikasi
const app = express();

// 2. Konfigurasi Dasar
const CONFIG = {
  PORT: process.env.PORT || 3000,
  MAX_BODY_SIZE: '10mb',
  REQUEST_TIMEOUT: 10000
};

// 3. Middleware Esensial
app.use(cors());
app.use(express.json({ limit: CONFIG.MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: CONFIG.MAX_BODY_SIZE }));
app.use(express.static('public'));
app.use('/src', express.static('src'));

// 4. Load Konfigurasi dengan Error Handling
let apiConfig;
try {
  apiConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'settings.json')));
} catch (err) {
  console.error('ERROR LOADING CONFIG:', err);
  process.exit(1);
}

// 5. Fungsi untuk Load Scraper
const loadScraper = (filePath) => {
  try {
    let scraper = require(filePath);
    return scraper.default || scraper;
  } catch (err) {
    console.error(`ERROR LOADING SCRAPER ${path.basename(filePath)}:`, err);
    return null;
  }
};

// 6. Load Semua Scraper
const loadAllScrapers = () => {
  const scrapers = {};
  const scrapersDir = path.join(__dirname, 'api-setting', 'Scrape');

  if (!fs.existsSync(scrapersDir)) {
    console.error('SCRAPERS DIRECTORY NOT FOUND');
    return scrapers;
  }

  fs.readdirSync(scrapersDir).forEach(file => {
    const fullPath = path.join(scrapersDir, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith('.js')) {
      const routePath = '/' + file.replace('.js', '').toLowerCase();
      const scraper = loadScraper(fullPath);
      if (scraper) {
        scrapers[routePath] = scraper;
      }
    }
  });

  return scrapers;
};

const scrapers = loadAllScrapers();

// 7. Middleware API Key
const apiKeyMiddleware = (req, res, next) => {
  const requireKey = apiConfig.apiSettings.defaultRequireKey;
  if (!requireKey) return next();

  const apiKey = req.headers['x-api-key'] || req.query.apikey;
  if (!apiKey) {
    return res.status(401).json({ 
      status: false, 
      message: 'API key required' 
    });
  }

  if (!apiConfig.apiSettings.globalKey.includes(apiKey)) {
    return res.status(403).json({ 
      status: false, 
      message: 'Invalid API key' 
    });
  }

  next();
};

// 8. Route Handler Utama
app.get('/:scraper', apiKeyMiddleware, async (req, res) => {
  try {
    const scraperName = req.params.scraper.toLowerCase();
    const scraper = scrapers['/' + scraperName];
    
    if (!scraper) {
      return res.status(404).json({
        status: false,
        message: 'Scraper not found'
      });
    }

    const result = await scraper(req.query);
    
    if (result?.imageBuffer) {
      return res.type(result.contentType || 'image/jpeg').send(result.imageBuffer);
    }
    
    if (Buffer.isBuffer(result)) {
      return res.type('image/jpeg').send(result);
    }

    res.json({
      status: true,
      data: result
    });

  } catch (err) {
    console.error('SCRAPER ERROR:', err);
    res.status(500).json({
      status: false,
      message: err.message || 'Scraper failed'
    });
  }
});

// 9. Route Dasar
app.get('/', (req, res) => {
  res.json({
    status: true,
    message: 'Scraper API is running',
    availableScrapers: Object.keys(scrapers).map(k => k.substring(1))
  });
});

// 10. Error Handling Final
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    status: false,
    message: 'Internal server error'
  });
});

// 11. Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
  console.log('Available scrapers:');
  Object.keys(scrapers).forEach(s => console.log(`- ${s.substring(1)}`));
});
