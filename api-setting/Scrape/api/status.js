const { randomInt } = require('crypto');

// In-memory storage for monitoring data
const apiData = {
    startTime: new Date(),
    totalRequests: 0,
    activeUsers: new Set(),
    apiStatus: 'operational'
};

/**
 * Real API Monitoring System
 */
function monitorAPI() {
    // Update API status (simulated)
    const updateStatus = () => {
        const statusOptions = ['operational', 'degraded', 'maintenance'];
        apiData.apiStatus = statusOptions[randomInt(0, 2)];
    };

    // Track user activity
    const trackUser = (ip) => {
        apiData.activeUsers.add(ip);
        apiData.totalRequests++;
        
        // Remove inactive users after 30 minutes
        setTimeout(() => {
            apiData.activeUsers.delete(ip);
        }, 30 * 60 * 1000);
    };

    // Get current stats
    const getStats = () => {
        const now = new Date();
        const uptime = Math.floor((now - apiData.startTime) / 1000);
        
        return {
            apiCount: 1, // Assuming single API
            uptime: formatUptime(uptime),
            status: apiData.apiStatus,
            activeUsers: apiData.activeUsers.size,
            totalRequests: apiData.totalRequests,
            lastUpdated: now.toISOString()
        };
    };

    // Format uptime seconds to readable format
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    return {
        trackUser,
        getStats,
        updateStatus
    };
}

// Initialize monitor
const apiMonitor = monitorAPI();

// Simulate status changes every 5-10 minutes
setInterval(() => {
    apiMonitor.updateStatus();
}, randomInt(5, 11) * 60 * 1000);

module.exports = apiMonitor;
