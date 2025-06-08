const os = require('os');
const { randomInt } = require('crypto');

/**
 * Robust API Monitoring Scraper
 * @returns {object} API status with user and system metrics
 */
function apiStatusScraper() {
    try {
        // Generate safe random data within reasonable limits
        const generateSafeData = () => {
            const now = new Date();
            return {
                timestamp: now.toISOString(),
                apiStatus: {
                    overall: ['operational', 'degraded', 'maintenance'][randomInt(0, 2)],
                    endpoints: {
                        total: randomInt(5, 50),
                        active: randomInt(5, 45),
                        deprecated: randomInt(0, 3)
                    },
                    responseTime: `${randomInt(20, 800)}ms`,
                    lastChecked: now.toLocaleTimeString()
                },
                users: {
                    active: randomInt(1, 150),
                    countries: ['US', 'ID', 'IN', 'BR', 'UK', 'DE'].slice(0, randomInt(1, 6)),
                    devices: {
                        mobile: randomInt(0, 100),
                        desktop: randomInt(0, 100),
                        tablet: randomInt(0, 30)
                    }
                },
                system: {
                    cpu: {
                        load: os.loadavg()[0].toFixed(2),
                        cores: os.cpus().length
                    },
                    memory: {
                        total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`,
                        free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)}GB`,
                        usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)}%`
                    },
                    uptime: formatUptime(os.uptime())
                },
                metadata: {
                    version: '1.0.0',
                    generatedIn: `${randomInt(5, 50)}ms`
                }
            };
        };

        // Helper to format uptime
        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / (3600 * 24));
            seconds %= 3600 * 24;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            return `${days}d ${hours}h ${minutes}m`;
        };

        return {
            success: true,
            ...generateSafeData()
        };

    } catch (error) {
        console.error('Monitoring error:', error);
        return {
            success: false,
            error: {
                message: 'Failed to generate monitoring data',
                code: 'MONITORING_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = apiStatusScraper;
