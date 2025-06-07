// ESM/CJS compatibility wrapper
(function() {
    const express = require('express');
    const path = require('path');
    const fs = require('fs');
    const cors = require('cors');
    const axios = require('axios');

    const app = express();

    // Middleware setup
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('public'));
    app.use('/src', express.static('src'));

    // Load configuration
    const apiConfig = require('./src/settings.json');

    // Scraper loader
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
                    const relativePath = path.relative(baseDir, fullPath);
                    const routePath = '/' + relativePath
                        .replace(/\\/g, '/')
                        .replace('.js', '')
                        .toLowerCase();
                    
                    const config = endpointConfigs[routePath] || {
                        requireKey: apiConfig.apiSettings.defaultRequireKey,
                        method: 'GET'
                    };
                    
                    scrapers[routePath] = {
                        handler: require(fullPath),
                        config: config
                    };
                }
            });
        };
        
        walkDir(baseDir);
        return scrapers;
    };

    const scrapers = loadScrapers();

    // API key middleware
    const checkApiKey = (req, res, next) => {
        const path = req.path;
        const endpoint = scrapers[path];
        
        if (!endpoint) return next();
        if (!endpoint.config.requireKey) return next();
        
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

    // Image handler middleware
    const handleImageFromUrl = async (req, res, next) => {
        if (req.body?.imageUrl) {
            try {
                const response = await axios.get(req.body.imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                
                req.image = {
                    buffer: Buffer.from(response.data, 'binary'),
                    contentType: response.headers['content-type']
                };
            } catch (error) {
                console.error('Image fetch error:', error.message);
            }
        }
        next();
    };

    // Route registration
    Object.entries(scrapers).forEach(([route, { handler, config }]) => {
        const method = config.method.toLowerCase();
        
        app[method](route, checkApiKey, handleImageFromUrl, async (req, res) => {
            try {
                const params = method === 'get' 
                    ? Object.entries(req.query)
                        .filter(([key]) => key !== 'apikey')
                        .map(([, value]) => value)
                    : [req.image || req.body];
                
                const result = await handler(...params);
                
                if (result?.imageBuffer && result.contentType) {
                    return res.type(result.contentType).send(result.imageBuffer);
                }
                
                if (Buffer.isBuffer(result)) {
                    return res.type('image/jpeg').send(result);
                }
                
                if (result?.url?.match(/\.(jpe?g|png|gif)$/i)) {
                    try {
                        const imageRes = await axios.get(result.url, {
                            responseType: 'arraybuffer',
                            timeout: 10000
                        });
                        return res.type(imageRes.headers['content-type'])
                                 .send(Buffer.from(imageRes.data, 'binary'));
                    } catch (error) {
                        console.error('Image URL fetch error:', error.message);
                    }
                }
                
                res.json({
                    status: true,
                    creator: apiConfig.apiSettings.creator,
                    result
                });
            } catch (error) {
                console.error('Handler error:', error);
                res.status(500).json({
                    status: false,
                    message: error.message
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

    // Static routes
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.use((req, res) => {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Available endpoints:');
        Object.entries(scrapers).forEach(([path, { config }]) => {
            console.log(`- ${path} (${config.method}, Key: ${config.requireKey ? 'Yes' : 'No'})`);
        });
    });

    // Handle process termination
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('Server stopped');
            process.exit(0);
        });
    });

    // Export based on module system
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = app;
    } else if (typeof window === 'undefined') {
        // For ESM environments
        export default app;
    }
})();
