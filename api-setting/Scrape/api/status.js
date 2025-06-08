const { randomInt } = require('crypto');

// Inisialisasi data (persistent)
const apiData = {
  startTime: process.hrtime(), // High-resolution time
  totalRequests: 0,
  activeUsers: new Map(),
  status: 'active'
};

// Fungsi untuk format waktu presisi detik
function formatUptime() {
  const [seconds, nanoseconds] = process.hrtime(apiData.startTime);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Fungsi utama
function getApiStats(ip) {
  try {
    // Update data
    apiData.totalRequests++;
    if (ip) apiData.activeUsers.set(ip, Date.now());

    // Bersihkan user tidak aktif (>30 menit)
    const now = Date.now();
    for (const [userIp, lastActive] of apiData.activeUsers.entries()) {
      if (now - lastActive > 1800000) {
        apiData.activeUsers.delete(userIp);
      }
    }

    // Return statistik terkini
    return {
      success: true,
      endpoint: 31,
      uptime: formatUptime(), // Sekarang termasuk detik
      status: apiData.status,
      request: apiData.totalRequests
      }
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to get stats',
      fallbackData: {
        apiCount: 30,
        uptime: '0d 0h 0m 0s', // Format konsisten
        status: 'unknown',
        totalRequests: 0
      }
    };
  }
}

// Update status tanpa mempengaruhi uptime
setInterval(() => {
  const statuses = ['active', 'degraded', 'maintenance'];
  apiData.status = statuses[randomInt(0, 2)];
}, 300000); // Tetap 5 menit untuk status change

module.exports = getApiStats;
