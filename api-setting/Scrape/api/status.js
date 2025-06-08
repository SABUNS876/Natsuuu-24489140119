const { randomInt } = require('crypto');

// Global monitoring instance
const apiMonitor = (() => {
  const data = {
    startTime: process.hrtime(),
    totalRequests: 0,
    endpoints: new Map(),
    status: 'active',
    lastRequest: null
  };

  // Format uptime with seconds
  const formatUptime = () => {
    const [seconds] = process.hrtime(data.startTime);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  // The monitoring function
  function monitorFunction(req, res, next) {
    try {
      // Track the request
      const endpoint = `${req.method} ${req.path}`;
      data.totalRequests++;
      data.endpoints.set(endpoint, (data.endpoints.get(endpoint) || 0) + 1);
      
      // Store last request info
      data.lastRequest = {
        endpoint,
        time: new Date().toISOString(),
        statusCode: res.statusCode,
        ip: req.ip
      };

      // Continue to next middleware
      if (next) return next();
      
      // If called directly, return stats
      return {
        status: true,
        creator: "Natsu - Api",
        result: {
          author: "Ramadhan - Tampan",
          apiCount: data.endpoints.size,
          uptime: formatUptime(),
          status: data.status,
          totalRequests: data.totalRequests,
          endpoints: Object.fromEntries(data.endpoints),
          lastRequest: data.lastRequest,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error('Monitoring error:', err);
      if (next) return next();
      return {
        status: false,
        error: "Monitoring service unavailable"
      };
    }
  }

  // Status rotation every 5 minutes
  setInterval(() => {
    data.status = ['active', 'degraded'][randomInt(0, 1)];
  }, 300000);

  return monitorFunction;
})();

module.exports = apiMonitor;
