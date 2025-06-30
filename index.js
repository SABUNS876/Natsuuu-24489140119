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

const handleAudioFromUrl = async (req, res, next) => {
    if (req.body && req.body.audioUrl) {
        try {
            const response = await axios.get(req.body.audioUrl, {
                responseType: 'arraybuffer'
            });
            
            req.audio = {
                buffer: Buffer.from(response.data, 'binary'),
                contentType: response.headers['content-type'] || getAudioContentType(req.body.audioUrl)
            };
        } catch (error) {
            console.error('Error fetching audio from URL:', error);
        }
    }
    next();
};

const getAudioContentType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    const audioTypes = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4'
    };
    return audioTypes[extension] || 'audio/mpeg'; // Default to MP3
};

// ======================== ROUTE HANDLER ========================
Object.entries(scrapers).forEach(([route, { handler, config }]) => {
    const method = config.method.toLowerCase();
    
    app[method](route, checkApiKey, handleAudioFromUrl, async (req, res) => {
        try {
            let params = [];
            
            if (method === 'get') {
                params = Object.keys(req.query)
                    .filter(key => key !== 'apikey')
                    .map(key => req.query[key]);
            } else {
                params = [req.audio || req.body];
            }
            
            const result = await handler(...params);
            
            // Handle audio buffer response
            if (result && result.audioBuffer && result.contentType) {
                res.set('Content-Type', result.contentType);
                return res.send(result.audioBuffer);
            }
            
            // Handle direct buffer (for backward compatibility)
            if (Buffer.isBuffer(result) && route.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                const contentType = getAudioContentType(route);
                res.set('Content-Type', contentType);
                return res.send(result);
            }
            
            // Handle audio URL in result
            if (result && typeof result === 'object' && result.url && result.url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                try {
                    const audioResponse = await axios.get(result.url, {
                        responseType: 'arraybuffer'
                    });
                    const contentType = audioResponse.headers['content-type'] || getAudioContentType(result.url);
                    res.set('Content-Type', contentType);
                    return res.send(Buffer.from(audioResponse.data, 'binary'));
                } catch (error) {
                    console.error('Error fetching audio URL from result:', error);
                    return res.json({
                        status: true,
                        creator: apiConfig.apiSettings.creator,
                        result
                    });
                }
            }
            
            // Default JSON response (for non-audio)
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
