const axios = require('axios');

class StatusApi {
  constructor() {
    this.stats = {
      lastChecked: null,
      status: 'unknown',
      totalRequests: 0,
      uniqueUsers: new Set(),
      responseTimes: [],
      errorCount: 0,
      firstChecked: new Date(),
      monitoringInterval: null
    };

    // Auto-start monitoring
    this.startMonitoring();
  }

  /**
   * Check API status by requesting root URL
   */
  async checkApiStatus() {
    try {
      const startTime = Date.now();
      const response = await axios.get('https://api.natsuclouds.biz.id', {
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;

      // Determine status based on response
      let status;
      if (statusCode >= 500) status = 'down';
      else if (statusCode >= 400) status = 'degraded';
      else status = 'operational';

      // Update stats
      this.stats = {
        ...this.stats,
        lastChecked: new Date(),
        status,
        responseTimes: [...this.stats.responseTimes.slice(-99), responseTime]
      };

      return {
        success: true,
        status,
        responseTime,
        statusCode
      };
    } catch (error) {
      this.stats.errorCount++;
      this.stats.status = 'down';

      return {
        success: false,
        status: 'down',
        error: error.message,
        statusCode: error.response?.status || 0
      };
    }
  }

  /**
   * Calculate uptime in days, hours, minutes, seconds
   */
  calculateUptime() {
    const uptimeMs = new Date() - this.stats.firstChecked;
    const seconds = Math.floor(uptimeMs / 1000);

    return {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
      ms: uptimeMs
    };
  }

  /**
   * Get uptime percentage (0-100%)
   */
  getUptimePercentage() {
    if (this.stats.totalRequests === 0) return 100;
    return ((this.stats.totalRequests - this.stats.errorCount) / this.stats.totalRequests) * 100;
  }

  /**
   * Get API stats (main method)
   */
  async getStats(userId = null) {
    this.stats.totalRequests++;
    if (userId) this.stats.uniqueUsers.add(userId);

    const statusCheck = await this.checkApiStatus();
    const uptime = this.calculateUptime();
    const avgResponseTime = this.stats.responseTimes.length > 0
      ? (this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length)
      : 0;

    return {
      author: 'Ramadhan - Tampan',
      apiStatus: this.stats.status,
      uptime: `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s`,
      uptimePercentage: `${this.getUptimePercentage().toFixed(2)}%`,
      lastChecked: this.stats.lastChecked?.toISOString() || 'Never',
      totalRequests: this.stats.totalRequests,
      uniqueUsers: this.stats.uniqueUsers.size,
      averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      errorCount: this.stats.errorCount,
      isOperational: this.stats.status === 'operational',
      lastStatusCode: statusCheck.statusCode || 'N/A'
    };
  }

  /**
   * Start automatic monitoring
   */
  startMonitoring(interval = 60000) {
    if (this.stats.monitoringInterval) {
      clearInterval(this.stats.monitoringInterval);
    }

    this.checkApiStatus(); // Initial check
    this.stats.monitoringInterval = setInterval(() => {
      this.checkApiStatus();
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.stats.monitoringInterval) {
      clearInterval(this.stats.monitoringInterval);
      this.stats.monitoringInterval = null;
    }
  }

  /**
   * Express/Vercel middleware for request tracking
   */
  trackRequest(req, res, next) {
    const userId = req.headers['x-user-id'] || req.ip;
    req.userId = userId;
    next();
  }

  /**
   * HTTP handler function (for Vercel/Express)
   */
  async httpHandler(req, res) {
    try {
      this.trackRequest(req, res, async () => {
        const stats = await this.getStats(req.userId);
        res.json(stats);
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Failed to fetch API stats",
        error: error.message
      });
    }
  }
}

// ========== Module Exports ========== //
const statusApi = new StatusApi();

// Main export (supports both direct usage and handler)
module.exports = statusApi;

// Explicit handler for Vercel/Express
module.exports.handler = statusApi.httpHandler.bind(statusApi);
