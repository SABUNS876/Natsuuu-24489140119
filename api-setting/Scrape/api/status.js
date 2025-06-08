const { randomInt } = require('crypto');

// Global monitoring data
const apiData = {
  startTime: process.hrtime(),
  totalRequests: 0,
  endpoints: new Map(),
  status: 'active'
};

// Middleware to track all requests
function trackRequests(req, res, next) {
  const endpoint = `${req.method} ${req.path}`;
  
  // Update counters
  apiData.totalRequests++;
  apiData.endpoints.set(endpoint, (apiData.endpoints.get(endpoint) || 0) + 1);
  
  next();
}

// Get formatted uptime
function formatUptime() {
  const [seconds] = process.hrtime(apiData.startTime);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Main monitoring function
function getApiStats() {
  try {
    return {
      author: 'Ramadhan - Tampan',
      apiCount: apiData.endpoints.size,
      uptime: formatUptime(),
      status: apiData.status,
      totalRequests: apiData.totalRequests,
      endpoints: Object.fromEntries(apiData.endpoints),
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

// Simulate status changes
setInterval(() => {
  apiData.status = ['active', 'degraded'][randomInt(0, 1)];
}, 300000);

// Single export with both functions
module.exports = {
  trackRequests,
  getStats: getApiStats
};
