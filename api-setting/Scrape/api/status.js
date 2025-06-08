const { randomInt } = require('crypto');

const apiMonitor = (() => {
  // Private monitoring data
  const data = {
    startTime: process.hrtime(),
    totalRequests: 0,
    endpoints: new Map(),
    status: 'active'
  };

  // Format uptime
  const formatUptime = () => {
    const [seconds] = process.hrtime(data.startTime);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  // Main function that handles both tracking and stats
  return function apiHandler(req, res, next) {
    if (req && res && next) {
      // Middleware mode - track request
      const endpoint = `${req.method} ${req.path}`;
      data.totalRequests++;
      data.endpoints.set(endpoint, (data.endpoints.get(endpoint) || 0) + 1);
      next();
    } else {
      // Stats mode - return data
      try {
        return {
          author: 'Ramadhan - Tampan',
          apiCount: data.endpoints.size,
          uptime: formatUptime(),
          status: data.status,
          totalRequests: data.totalRequests,
          endpoints: Object.fromEntries(data.endpoints),
          lastUpdated: new Date().toLocaleString()
        };
      } catch (err) {
        return {
          error: 'Monitoring failed',
          fallback: {
            apiCount: 0,
            uptime: '0d 0h 0m 0s',
            status: 'unknown'
          }
        };
      }
    }
  };
})();

// Status rotation
setInterval(() => {
  const statuses = ['active', 'degraded', 'maintenance'];
  apiMonitor().status = statuses[randomInt(0, 2)];
}, 300000);

module.exports = apiMonitor;
