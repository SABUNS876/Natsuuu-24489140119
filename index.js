// ESM/CJS compatibility check
const isESM = typeof module === 'undefined' || typeof module.exports === 'undefined';

// Main application wrapper
const createApp = () => {
    const express = require('express');
    const path = require('path');
    const fs = require('fs');
    const cors = require('cors');
    const axios = require('axios');

    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('public'));
    app.use('/src', express.static('src'));

    const apiConfig = require('./src/settings.json');

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

    const checkApiKey = (req, res, next) => {
        const path = req.path;
        const endpoint = scrapers[path];
        
        if (!endpoint) {
            return next();
        }

        if (!endpoint.config.requireKey) {
            return next();
        }
        
        const apiKey = req.headers['x-api-key'] || req.query.apikey;
        if (!apiKey) {
            return res.status(401).json({ 
                status: false, 
                message: 'API key diperlukan untuk endpoint ini' 
            });
        }
        
        if (!apiConfig.apiSettings.globalKey.includes(apiKey)) {
            return res.status(403).json({ 
                status: false, 
                message: 'API key tidak valid' 
            });
        }
        
        next();
    };

    const handleImageFromUrl = async (req, res, next) => {
        if (req.body && req.body.imageUrl) {
            try {
                const response = await axios.get(req.body.imageUrl, {
                    responseType: 'arraybuffer'
                });
                
                req.image = {
                    buffer: Buffer.from(response.data, 'binary'),
                    contentType: response.headers['content-type']
                };
            } catch (error) {
                console.error('Error fetching image from URL:', error);
            }
        }
        next();
    };

    Object.entries(scrapers).forEach(([route, { handler, config }]) => {
        const method = config.method.toLowerCase();
        
        app[method](route, checkApiKey, handleImageFromUrl, async (req, res) => {
            try {
                let params = [];
                
                if (method === 'get') {
                    params = Object.keys(req.query)
                        .filter(key => key !== 'apikey')
                        .map(key => req.query[key]);
                } else {
                    params = [req.image || req.body];
                }
                
                const result = await handler(...params);
                
                if (result && result.imageBuffer && result.contentType) {
                    res.set('Content-Type', result.contentType);
                    return res.send(result.imageBuffer);
                }
                
                if (Buffer.isBuffer(result)) {
                    res.set('Content-Type', 'image/jpeg');
                    return res.send(result);
                }
                
                if (result && typeof result === 'object' && result.url && result.url.match(/\.(jpeg|jpg|png|gif)$/i)) {
                    try {
                        const imageResponse = await axios.get(result.url, {
                            responseType: 'arraybuffer'
                        });
                        res.set('Content-Type', imageResponse.headers['content-type']);
                        return res.send(Buffer.from(imageResponse.data, 'binary'));
                    } catch (error) {
                        console.error('Error fetching image URL from result:', error);
                        return res.json({
                            status: true,
                            creator: apiConfig.apiSettings.creator,
                            result
                        });
                    }
                }
                
                res.json({
                    status: true,
                    creator: apiConfig.apiSettings.creator,
                    result
                });
            } catch (error) {
                console.error('Error in handler:', error);
                res.status(500).json({
                    status: false,
                    message: error.message
                });
            }
        });

        if (config.path && config.path.includes('?')) {
            app.get(config.path.split('?')[0], checkApiKey, (req, res) => {
                res.status(400).json({
                    status: false,
                    message: 'Parameter diperlukan',
                    example: `${req.protocol}://${req.get('host')}${config.path}param_value`
                });
            });
        }
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.use((req, res) => {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    });

    return app;
};

// Export based on module system
if (isESM) {
    const app = createApp();
    export default app;
} else {
    module.exports = createApp();
                        }
