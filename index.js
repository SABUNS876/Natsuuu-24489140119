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

// ======================== LOAD SCRAPERS ========================
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

// ======================== MIDDLEWARE ========================
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

const handleFileFromUrl = async (req, res, next) => {
    if (req.body && req.body.url) {
        try {
            const response = await axios.get(req.body.url, {
                responseType: 'arraybuffer'
            });
            
            req.fileData = {
                buffer: Buffer.from(response.data, 'binary'),
                contentType: response.headers['content-type'] || getContentTypeFromUrl(req.body.url)
            };
        } catch (error) {
            console.error('Error fetching file from URL:', error);
        }
    }
    next();
};

const getContentTypeFromUrl = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    const contentTypes = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        // Video
        mp4: 'video/mp4',
        webm: 'video/webm',
        // Documents
        pdf: 'application/pdf',
        // Default
        default: 'application/octet-stream'
    };
    return contentTypes[extension] || contentTypes.default;
};

// ======================== ROUTE HANDLER ========================
Object.entries(scrapers).forEach(([route, { handler, config }]) => {
    const method = config.method.toLowerCase();
    
    app[method](route, checkApiKey, handleFileFromUrl, async (req, res) => {
        try {
            let params = [];
            
            if (method === 'get') {
                params = Object.keys(req.query)
                    .filter(key => key !== 'apikey')
                    .map(key => req.query[key]);
            } else {
                params = [req.fileData || req.body];
            }
            
            const result = await handler(...params);
            
            // Handle Buffer responses (images, audio, files)
            if (Buffer.isBuffer(result)) {
                const contentType = getContentTypeFromUrl(route) || 'application/octet-stream';
                res.set('Content-Type', contentType);
                return res.send(result);
            }
            
            // Handle Object responses with buffer or URL
            if (result && typeof result === 'object') {
                // If it has a buffer and content type
                if (result.buffer && result.contentType) {
                    res.set('Content-Type', result.contentType);
                    return res.send(result.buffer);
                }
                
                // If it has a URL (image, audio, video, etc.)
                if (result.url) {
                    try {
                        const fileResponse = await axios.get(result.url, {
                            responseType: 'arraybuffer'
                        });
                        const contentType = fileResponse.headers['content-type'] || getContentTypeFromUrl(result.url);
                        res.set('Content-Type', contentType);
                        return res.send(Buffer.from(fileResponse.data, 'binary'));
                    } catch (error) {
                        console.error('Error fetching file from result URL:', error);
                        // Fallback to JSON response
                        return res.json({
                            status: true,
                            creator: apiConfig.apiSettings.creator,
                            result
                        });
                    }
                }
            }
            
            // Default JSON response
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

    // Handle routes with required parameters
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

// ======================== BASIC ROUTES ========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ======================== START SERVER ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log('Endpoint yang tersedia:');
    Object.entries(scrapers).forEach(([path, { config }]) => {
        console.log(`- ${path} (Method: ${config.method}, Require Key: ${config.requireKey ? 'Ya' : 'Tidak'})`);
    });
});

module.exports = app;
