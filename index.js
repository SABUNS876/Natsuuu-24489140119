// universal-loader.js
const createApp = () => {
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const cors = require('cors');
  const axios = require('axios');

  const app = express();
  
  // 1. Basic Configuration
  const config = {
    port: process.env.PORT || 3000,
    maxBodySize: '10mb',
    requestTimeout: 10000
  };

  // 2. Enhanced Middleware Setup
  app.use(cors());
  app.use(express.json({ limit: config.maxBodySize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxBodySize }));
  app.use(express.static('public'));
  app.use('/src', express.static('src'));

  // 3. Safe Configuration Loading
  let apiConfig;
  try {
    apiConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'settings.json')));
  } catch (err) {
    console.error('Configuration Error:', err);
    process.exit(1);
  }

  // 4. Robust Scraper Loader
  const loadScrapers = () => {
    const scrapers = {};
    const baseDir = path.join(__dirname, 'api-setting', 'Scrape');

    const walkDir = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (file.endsWith('.js')) {
          try {
            const routePath = '/' + path.relative(baseDir, fullPath)
              .replace(/\\/g, '/')
              .replace('.js', '')
              .toLowerCase();

            let handler;
            try {
              handler = require(fullPath);
              // Support both CJS and ESM export styles
              handler = handler.default || handler;
            } catch (e) {
              console.error(`Failed to load ${file}:`, e);
              return;
            }

            // Find config for this route
            let routeConfig = { method: 'GET', requireKey: apiConfig.apiSettings.defaultRequireKey };
            for (const category of apiConfig.categories) {
              const item = category.items.find(i => i.path.split('?')[0] === routePath);
              if (item) {
                routeConfig = {
                  method: item.method || 'GET',
                  requireKey: item.requireKey !== undefined ? item.requireKey : routeConfig.requireKey,
                  path: item.path
                };
                break;
              }
            }

            scrapers[routePath] = { handler, config: routeConfig };
          } catch (err) {
            console.error(`Error loading ${file}:`, err);
          }
        }
      });
    };

    walkDir(baseDir);
    return scrapers;
  };

  const scrapers = loadScrapers();

  // 5. Essential Middlewares
  const checkApiKey = (req, res, next) => {
    const endpoint = scrapers[req.path];
    if (!endpoint?.config.requireKey) return next();

    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    if (!apiKey) return res.status(401).json({ status: false, message: 'API key required' });
    if (!apiConfig.apiSettings.globalKey.includes(apiKey)) {
      return res.status(403).json({ status: false, message: 'Invalid API key' });
    }
    next();
  };

  const handleImageRequest = async (req, res, next) => {
    if (req.body?.imageUrl) {
      try {
        const response = await axios.get(req.body.imageUrl, {
          responseType: 'arraybuffer',
          timeout: config.requestTimeout
        });
        req.image = {
          buffer: Buffer.from(response.data),
          contentType: response.headers['content-type'] || 'image/jpeg'
        };
      } catch (err) {
        console.error('Image download failed:', err.message);
      }
    }
    next();
  };

  // 6. Route Handler Factory
  const createRouteHandler = (handler, method) => async (req, res) => {
    try {
      const params = method === 'get' 
        ? Object.values(req.query).filter(v => v !== req.query.apikey)
        : [req.image || req.body];

      const result = await handler(...params);
      
      if (!result) throw new Error('Handler returned empty response');

      // Handle all response types
      if (result?.imageBuffer) {
        return res.type(result.contentType || 'image/jpeg').send(result.imageBuffer);
      }
      if (Buffer.isBuffer(result)) {
        return res.type('image/jpeg').send(result);
      }
      if (result?.url) {
        try {
          const imgRes = await axios.get(result.url, {
            responseType: 'arraybuffer',
            timeout: config.requestTimeout
          });
          return res.type(imgRes.headers['content-type'] || 'image/jpeg')
                   .send(Buffer.from(imgRes.data));
        } catch (err) {
          console.error('Failed to fetch result image:', err.message);
        }
      }
      
      res.json({
        status: true,
        creator: apiConfig.apiSettings.creator,
        result
      });
    } catch (err) {
      console.error('Route handler error:', err);
      res.status(500).json({
        status: false,
        message: err.message || 'Internal server error'
      });
    }
  };

  // 7. Dynamic Route Registration
  Object.entries(scrapers).forEach(([route, { handler, config: routeConfig }]) => {
    const method = routeConfig.method.toLowerCase();
    
    app[method](
      route,
      checkApiKey,
      handleImageRequest,
      createRouteHandler(handler, method)
    );

    if (routeConfig.path?.includes('?')) {
      app.get(routeConfig.path.split('?')[0], checkApiKey, (req, res) => {
        res.status(400).json({
          status: false,
          message: 'Missing parameters',
          example: `${req.protocol}://${req.get('host')}${routeConfig.path}value`
        });
      });
    }
  });

  // 8. Basic Routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  });

  // 9. Final Error Handler
  app.use((err, req, res, next) => {
    console.error('Application error:', err);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  });

  return app;
};

// Universal Export Pattern
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS export
  module.exports = createApp();
  
  // Auto-start when executed directly
  if (require.main === module) {
    const app = createApp();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
} else {
  // ES Modules export
  export default createApp();
          }
