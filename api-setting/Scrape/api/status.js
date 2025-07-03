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
      firstChecked: new Date()
    };

    // Mulai pemantauan otomatis
    this.startMonitoring();
  }

  async checkApiStatus() {
    try {
      const startTime = Date.now();
      // Cek root URL langsung
      const response = await axios.get('https://api.natsuclouds.biz.id', {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      // Tentukan status berdasarkan response
      let status = 'operational';
      if (response.status >= 500) {
        status = 'down';
      } else if (response.status >= 400) {
        status = 'degraded';
      }

      this.stats = {
        ...this.stats,
        lastChecked: new Date(),
        status: status,
        responseTimes: [...this.stats.responseTimes.slice(-99), responseTime]
      };

      return {
        success: true,
        status: this.stats.status,
        responseTime,
        statusCode: response.status
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

  getUptimePercentage() {
    if (this.stats.totalRequests === 0) return 100;
    return ((this.stats.totalRequests - this.stats.errorCount) / this.stats.totalRequests) * 100;
  }

  async getStats(userId = null) {
    this.stats.totalRequests++;
    
    if (userId) {
      this.stats.uniqueUsers.add(userId);
    }

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

  startMonitoring(interval = 60000) {
    // Jalankan pemeriksaan pertama
    this.checkApiStatus();
    
    // Set interval untuk pemantauan berkala
    this.monitoringInterval = setInterval(() => {
      this.checkApiStatus();
    }, interval);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  // Middleware untuk tracking request
  trackRequest(req, res, next) {
    const userId = req.headers['x-user-id'] || req.ip;
    req.userId = userId;
    next();
  }
}

// Buat instance tunggal dan export
const statusApiInstance = new StatusApi();
module.exports = statusApiInstance;
