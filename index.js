// Universal Module Loader Pattern
(function(global, factory) {
  // CommonJS
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('express'), require('path'), require('fs'), require('cors'), require('axios'));
  } 
  // ES Modules
  else if (typeof define === 'function' && define.amd) {
    define(['express', 'path', 'fs', 'cors', 'axios'], factory);
  }
  // Browser globals
  else {
    global.returnExports = factory(global.express, global.path, global.fs, global.cors, global.axios);
  }
}(typeof window !== 'undefined' ? window : this, function(express, path, fs, cors, axios) {

  const app = express();

  // Configuration - moved here for better visibility
  const CONFIG = {
    MAX_BODY_SIZE: '10mb',
    REQUEST_TIMEOUT: 10000,
    PORT: process.env.PORT || 3000
  };

  // 1. Middleware Setup
  app.use(cors());
  app.use(express.json({ limit: CONFIG.MAX_BODY_SIZE }));
  app.use(express.urlencoded({ extended: true, limit: CONFIG.MAX_BODY_SIZE }));
  app.use(express.static('public'));
  app.use('/src', express.static('src'));

  // 2. Load Configuration
  let apiConfig;
  try {
    apiConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'settings.json')));
  } catch (err) {
    console.error('Failed to load config:', err);
    process.exit(1);
  }

  // 3. Scraper Loader
  const loadScrapers = () => {
    const scrapers = {};
    const endpointConfigs = {};
    const baseDir = path.join(__dirname, 'api-setting', 'Scrape');

    apiConfig.categories.forEach(category => {
      category.items.forEach(item => {
        const cleanPath = item.path.split('?')[0];
        endpointConfigs[cleanPath] = {
          requireKey: item.requireKey !== undefined ? item.requireKey : apiConfig.apiSettings.defaultRequireKey,
          path: item.path,
          method: item.method || 'GET'
        };
      });
    });

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath);
        } else if (file.endsWith('.js')) {
          try {
            const relativePath = path.relative(baseDir, fullPath);
            const routePath = '/' + relativePath
              .replace(/\\/g, '/')
              .replace('.js', '')
              .toLowerCase();
            
            const config = endpointConfigs[routePath] || {
              requireKey: apiConfig.apiSettings.defaultRequireKey,
              method: 'GET'
            };
            
            // Handle both CJS and ESM scrapers
            let handler;
            try {
              handler = require(fullPath);
              // Support for ESM-style default exports in CJS
              if (typeof handler === 'object' && handler.default) {
                handler = handler.default;
              }
            } catch (e) {
              console.error(`Failed to load scraper ${file}:`, e);
              return;
            }
            
            scrapers[routePath] = { handler, config };
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

  // 4. Middlewares
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

  const handleImageFromUrl = async (req, res, next) => {
    if (req.body?.imageUrl) {
      try {
        const response = await axios.get(req.body.imageUrl, {
          responseType: 'arraybuffer',
          timeout: CONFIG.REQUEST_TIMEOUT
        });
        req.image = {
          buffer: Buffer.from(response.data, 'binary'),
          contentType: response.headers['content-type'] || 'image/jpeg'
        };
      } catch (err) {
        console.error('Image fetch error:', err.message);
      }
    }
    next();
  };

  // 5. Route Registration
  Object.entries(scrapers).forEach(([route, { handler, config }]) => {
    const method = config.method.toLowerCase();
    
    app[method](route, checkApiKey, handleImageFromUrl, async (req, res) => {
      try {
        const params = method === 'get' 
          ? Object.values(req.query).filter(val => val !== req.query.apikey)
          : [req.image || req.body];
        
        const result = await handler(...params);
        
        // Handle all response types
        if (result?.imageBuffer && result.contentType) {
          return res.type(result.contentType).send(result.imageBuffer);
        }
        if (Buffer.isBuffer(result)) {
          return res.type('image/jpeg').send(result);
        }
        if (result?.url) {
          try {
            const imageRes = await axios.get(result.url, {
              responseType: 'arraybuffer',
              timeout: CONFIG.REQUEST_TIMEOUT
            });
            return res.type(imageRes.headers['content-type'] || 'image/jpeg')
                     .send(Buffer.from(imageRes.data, 'binary'));
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
        console.error(`Handler error for ${route}:`, err);
        res.status(500).json({
          status: false,
          message: err.message || 'Internal server error'
        });
      }
    });

    if (config.path?.includes('?')) {
      app.get(config.path.split('?')[0], checkApiKey, (req, res) => {
        res.status(400).json({
          status: false,
          message: 'Parameters required',
          example: `${req.protocol}://${req.get('host')}${config.path}param_value`
        });
      });
    }
  });

  // 6. Static Routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  });

  // 7. Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  });

  // 8. Start Server
  if (require.main === module) {
    const server = app.listen(CONFIG.PORT, () => {
      console.log(`Server running on port ${CONFIG.PORT}`);
      console.log('Available endpoints:');
      Object.entries(scrapers).forEach(([path, { config }]) => {
        console.log(`- ${path} (${config.method}, Key: ${config.requireKey ? 'Yes' : 'No'})`);
      });
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    });
  }

  return app;
}));
