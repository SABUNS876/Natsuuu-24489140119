const { randomInt } = require('crypto');

function getPersonalStats(ip, battery) {
  // Jika tidak ada data, generate random (untuk demo)
  const actualIp = ip || `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;
  const actualBattery = battery !== undefined ? battery : randomInt(10, 100);

  return {
    yourDevice: {
      ipAddress: actualIp,
      batteryLevel: `${actualBattery}%`,
      lastUpdate: new Date().toLocaleTimeString()
    },
    apiStatus: {
      uptime: formatUptime(process.uptime() * 1000),
      totalRequests: randomInt(1, 1000) // Simulasi global requests
    }
  };
}

// Format waktu dari detik ke "Xd Yh Zm"
function formatUptime(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${days}d ${hours}h ${mins}m`;
}

module.exports = getPersonalStats;
