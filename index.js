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

const handleMediaFromUrl = async (req, res, next) => {
    // Handle image URL if present
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
    
    // Handle audio URL if present
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

// Helper function to determine audio content type
const getAudioContentType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'ogg': return 'audio/ogg';
        case 'm4a': return 'audio/mp4';
        default: return 'audio/mpeg'; // default to mp3
    }
};

Object.entries(scrapers).forEach(([route, { handler, config }]) => {
    const method = config.method.toLowerCase();
    
    app[method](route, checkApiKey, handleMediaFromUrl, async (req, res) => {
        try {
            let params = [];
            
            if (method === 'get') {
                params = Object.keys(req.query)
                    .filter(key => key !== 'apikey')
                    .map(key => req.query[key]);
            } else {
                params = [req.image || req.audio || req.body]; // Gunakan image/audio jika ada
            }
            
            const result = await handler(...params);
            
            // Handle image responses
            if (result && result.imageBuffer && result.contentType) {
                res.set('Content-Type', result.contentType);
                return res.send(result.imageBuffer);
            }
            
            // Handle audio responses
            if (result && result.audioBuffer && result.contentType) {
                res.set('Content-Type', result.contentType);
                return res.send(result.audioBuffer);
            }
            
            // Handle direct buffer (check if it's audio by route extension)
            if (Buffer.isBuffer(result)) {
                if (route.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                    res.set('Content-Type', getAudioContentType(route));
                } else {
                    res.set('Content-Type', 'image/jpeg'); // Default for images
                }
                return res.send(result);
            }
            
            // Handle URL responses (both image and audio)
            if (result && typeof result === 'object' && result.url) {
                try {
                    // Check if it's an image URL
                    if (result.url.match(/\.(jpeg|jpg|png|gif)$/i)) {
                        const imageResponse = await axios.get(result.url, {
                            responseType: 'arraybuffer'
                        });
                        res.set('Content-Type', imageResponse.headers['content-type']);
                        return res.send(Buffer.from(imageResponse.data, 'binary'));
                    }
                    // Check if it's an audio URL
                    else if (result.url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                        const audioResponse = await axios.get(result.url, {
                            responseType: 'arraybuffer'
                        });
                        res.set('Content-Type', audioResponse.headers['content-type'] || getAudioContentType(result.url));
                        return res.send(Buffer.from(audioResponse.data, 'binary'));
                    }
                } catch (error) {
                    console.error('Error fetching media URL from result:', error);
                    // Fallback ke JSON response jika gagal mengambil media
                    return res.json({
                        status: true,
                        creator: apiConfig.apiSettings.creator,
                        result
                    });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log('Endpoint yang tersedia:');
    Object.entries(scrapers).forEach(([path, { config }]) => {
        console.log(`- ${path} (Method: ${config.method}, Require Key: ${config.requireKey ? 'Ya' : 'Tidak'})`);
    });
});

module.exports = app;
