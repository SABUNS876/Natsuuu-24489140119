const { randomInt } = require('crypto');

// Inisialisasi data
const apiData = {
  startTime: Date.now(),
  totalRequests: 0,
  activeUsers: new Map(),
  status: 'active'
};

// Fungsi untuk format waktu
function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
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
      if (now - lastActive > 1800000) { // 30 menit dalam ms
        apiData.activeUsers.delete(userIp);
      }
    }

    // Return statistik terkini
    return {
      success: true,
      apiCount: 30,
      uptime: formatUptime(now - apiData.startTime),
      status: apiData.status,
      totalRequests: apiData.totalRequests,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    // Fallback jika ada error
    return {
      success: false,
      error: 'Failed to get stats',
      fallbackData: {
        apiCount: 1,
        uptime: '0d 0h 0m',
        status: 'unknown',
        activeUsers: 0,
        totalRequests: 0
      }
    };
  }
}

// Simulasi perubahan status (opsional)
setInterval(() => {
  const statuses = ['active', 'degraded', 'maintenance'];
  apiData.status = statuses[randomInt(0, 2)];
}, 300000); // Update setiap 5 menit

module.exports = getApiStats;
