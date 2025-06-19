const { randomInt } = require('crypto');

// Simulasi data Vercel - waktu terakhir deploy (ini bisa diisi dengan waktu deploy sebenarnya)
const vercelData = {
  lastDeployTime: new Date(), // Ini akan diisi waktu deploy terakhir
  totalRequests: 0,
  status: 'active',
  // Simulasi downtime Vercel (dalam menit)
  simulatedDowntimes: [
    { date: '2023-01-15', duration: 5 }, // Contoh downtime 5 menit
    { date: '2023-02-20', duration: 10 }
  ]
};

// Inisialisasi waktu deploy (bisa diganti dengan waktu deploy sebenarnya)
// Untuk produksi, bisa menggunakan process.env.VERCEL_DEPLOYMENT_CREATED_AT
vercelData.lastDeployTime = process.env.VERCEL_DEPLOYMENT_CREATED_AT ? 
  new Date(process.env.VERCEL_DEPLOYMENT_CREATED_AT) : 
  new Date();

// Format uptime dengan memperhitungkan simulated downtimes
function formatVercelUptime() {
  try {
    const now = new Date();
    const totalUptimeMs = now - vercelData.lastDeployTime;
    
    // Hitung total downtime dari simulasi
    let totalDowntimeMs = 0;
    vercelData.simulatedDowntimes.forEach(downtime => {
      const downtimeDate = new Date(downtime.date);
      if (downtimeDate >= vercelData.lastDeployTime) {
        totalDowntimeMs += downtime.duration * 60 * 1000;
      }
    });
    
    const uptimeMs = totalUptimeMs - totalDowntimeMs;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    
    // Hitung uptime percentage (99.9% sebagai default)
    const uptimePercentage = ((uptimeMs / totalUptimeMs) * 100).toFixed(3);
    
    // Format ke days, hours, minutes, seconds
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    return {
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      percentage: uptimePercentage >= 99.9 ? '99.9%' : `${uptimePercentage}%`,
      since: vercelData.lastDeployTime.toISOString()
    };
  } catch (err) {
    return {
      formatted: '0d 0h 0m 0s',
      percentage: '0%',
      since: new Date().toISOString()
    };
  }
}

// Main monitoring function
function getVercelStats() {
  try {
    // Increment request count
    vercelData.totalRequests++;

    const uptime = formatVercelUptime();

    return {
      author: 'Ramadhan - Tampan',
      apiCount: 32,
      uptime: uptime.formatted,
      uptimePercentage: uptime.percentage,
      status: vercelData.status,
      sinceLastDeploy: uptime.since,
      vercelStatus: 'operational' // Biasanya Vercel operational
    };
  } catch (err) {
    return {
      error: 'Failed to get Vercel stats',
      apiCount: 30,
      uptime: '0d 0h 0m 0s',
      status: 'unknown',
      totalRequests: 0
    };
  }
}

// Status change simulation
setInterval(() => {
  const statuses = ['active', 'degraded_performance'];
  vercelData.status = statuses[randomInt(0, statuses.length)];
}, 300000); // Changes every 5 minutes

module.exports = getVercelStats;
