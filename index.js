const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/src', express.static('src'));

const upload = multer({ storage: multer.memoryStorage() });

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
                method: item.method || 'GET' // Tambahkan method jika ada
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

const handleImageInput = async (req, res, next) => {
    // Skip jika bukan POST atau PUT
    if (!['POST', 'PUT'].includes(req.method)) {
        return next();
    }

    // Handle multipart/form-data (file upload)
    if (req.is('multipart/form-data')) {
        const uploadMiddleware = upload.single('image');
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    status: false,
                    message: 'Gagal mengunggah gambar'
                });
            }

            if (req.file) {
                req.image = {
                    buffer: req.file.buffer,
                    mimetype: req.file.mimetype,
                    source: 'upload'
                };
            }
            next();
        });
        return;
    }

    // Handle image URL
    if (req.body && req.body.imageUrl) {
        try {
            const response = await axios.get(req.body.imageUrl, {
                responseType: 'arraybuffer'
            });
            
            req.image = {
                buffer: Buffer.from(response.data, 'binary'),
                mimetype: response.headers['content-type'],
                source: 'url'
            };
            return next();
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: 'Gagal mengunduh gambar dari URL'
            });
        }
    }

    next();
};

// Modifikasi route handling untuk support image
Object.entries(scrapers).forEach(([route, { handler, config }]) => {
    const method = config.method.toLowerCase();
    
    if (method === 'get') {
        app.get(route, checkApiKey, async (req, res) => {
            try {
                const params = Object.keys(req.query)
                    .filter(key => key !== 'apikey')
                    .map(key => req.query[key]);
                
                const result = await handler(...params);
                res.json({
                    status: true,
                    creator: apiConfig.apiSettings.creator,
                    result
                });
            } catch (error) {
                res.status(500).json({
                    status: false,
                    message: error.message
                });
            }
        });
    } else {
        app[method](route, checkApiKey, handleImageInput, async (req, res) => {
            try {
                let result;
                
                if (req.image) {
                    // Jika ada gambar, kirim sebagai parameter pertama
                    result = await handler(req.image, req.body);
                } else {
                    // Jika tidak ada gambar, proses seperti biasa
                    const params = method === 'get' ? 
                        Object.keys(req.query)
                            .filter(key => key !== 'apikey')
                            .map(key => req.query[key]) :
                        [req.body];
                    
                    result = await handler(...params);
                }
                
                res.json({
                    status: true,
                    creator: apiConfig.apiSettings.creator,
                    result
                });
            } catch (error) {
                res.status(500).json({
                    status: false,
                    message: error.message
                });
            }
        });
    }

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
