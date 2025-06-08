const { randomInt } = require('crypto');
const onHeaders = require('on-headers');

// Persistent data storage
const apiData = {
  startTime: process.hrtime(),
  totalRequests: 0,
  endpoints: new Map(), // Track all endpoints
  status: 'active'
};

// Middleware to monitor all requests
function apiMonitorMiddleware(req, res, next) {
  // Increment counters
  apiData.totalRequests++;
  
  const endpoint = `${req.method} ${req.path}`;
  apiData.endpoints.set(endpoint, (apiData.endpoints.get(endpoint) || 0) + 1);

  // Add monitoring header
  onHeaders(res, () => {
    res.setHeader('X-API-Monitor', 'active');
  });

  next();
}

// Precise uptime formatter
function formatUptime() {
  const [seconds] = process.hrtime(apiData.startTime);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Get complete stats
function getCompleteStats() {
  try {
    return {
      author: 'Ramadhan - Tampan',
      apiCount: Array.from(apiData.endpoints.keys()).length,
      uptime: formatUptime(),
      status: apiData.status,
      totalRequests: apiData.totalRequests,
      endpoints: Object.fromEntries(apiData.endpoints),
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    return {
      error: 'Monitoring error',
      fallbackData: {
        apiCount: 0,
        uptime: '0d 0h 0m 0s',
        status: 'unknown'
      }
    };
  }
}

module.exports = {
  middleware: apiMonitorMiddleware,
  getStats: getCompleteStats
};
