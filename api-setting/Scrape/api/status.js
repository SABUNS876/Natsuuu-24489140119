const { randomInt } = require('crypto');

// Persistent data storage
const apiData = {
  startTime: process.hrtime(), // High-resolution time
  totalRequests: 0,
  status: 'active'
};

// Precise uptime formatter (days, hours, minutes, seconds)
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
    // Increment request count
    apiData.totalRequests++;

    return {
      author: 'Ramadhan - Tampan',
      apiCount: 30,
      uptime: formatUptime(),
      status: apiData.status,
      Requests: apiData.totalRequests
    };
  } catch (err) {
    return {
      error: 'Failed to get stats',
      apiCount: 30,
      uptime: '0d 0h 0m 0s',
      status: 'unknown',
      totalRequests: 0
    };
  }
}

// Status change simulation (doesn't affect uptime)
setInterval(() => {
  const statuses = ['active', 'degraded', 'maintenance'];
  apiData.status = statuses[randomInt(0, 2)];
}, 300000); // Changes every 5 minutes

module.exports = getApiStats;
