const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');

// Endpoint untuk mengecek status API
router.get('/api/status', async (req, res) => {
    try {
        // Informasi server
        const serverInfo = {
            status: 'online',
            serverTime: new Date().toISOString(),
            uptime: process.uptime(),
            platform: os.platform(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            cpuUsage: os.loadavg(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        };

        // Informasi database (contoh)
        const dbInfo = {
            status: 'connected',
            lastCheck: new Date().toISOString()
        };

        // Informasi layanan tambahan
        const services = {
            api: 'operational',
            database: 'operational',
            cache: 'operational',
            storage: 'operational'
        };

        // Response akhir
        const statusResponse = {
            success: true,
            message: 'API is running normally',
            data: {
                server: serverInfo,
                database: dbInfo,
                services: services,
                responseTime: `${Date.now() - res.locals.startTime}ms`
            },
            version: '1.0.0',
            timestamp: new Date().toISOString()
        };

        res.status(200).json(statusResponse);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check API status',
            error: error.message
        });
    }
});

// Middleware untuk menghitung response time
router.use((req, res, next) => {
    res.locals.startTime = Date.now();
    next();
});

module.exports = router;
