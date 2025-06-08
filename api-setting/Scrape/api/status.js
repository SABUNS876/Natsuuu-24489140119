const { randomInt } = require('crypto');

const apiMonitor = (() => {
  // Private monitoring data
  const data = {
    startTime: process.hrtime(),
    totalRequests: 0,
    endpoints: new Map(),
    status: 'active'
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

  // The main monitor function
  const monitorFunction = function() {
    // When used as middleware (req, res, next)
    if (arguments.length === 3) {
      const [req, res, next] = arguments;
      const endpoint = `${req.method} ${req.path}`;
      
      data.totalRequests++;
      data.endpoints.set(endpoint, (data.endpoints.get(endpoint) || 0) + 1);
      
      // Add real-time monitoring to response
      res.on('finish', () => {
        data.lastRequest = {
          endpoint,
          time: new Date().toISOString(),
          statusCode: res.statusCode
        };
      });
      
      return next();
    }
    
    // When called without arguments (get stats)
    try {
      return {
        author: 'Ramadhan - Tampan',
        apiCount: data.endpoints.size,
        uptime: formatUptime(),
        status: data.status,
        totalRequests: data.totalRequests,
        endpoints: Object.fromEntries(data.endpoints),
        lastRequest: data.lastRequest || null,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      return {
        error: 'Monitoring failed',
        fallbackData: {
          apiCount: 0,
          uptime: '0d 0h 0m 0s',
          status: 'unknown'
        }
      };
    }
  };

  // Status rotation
  setInterval(() => {
    data.status = ['active', 'degraded'][randomInt(0, 1)];
  }, 300000);

  return monitorFunction;
})();

module.exports = apiMonitor;
