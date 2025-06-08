const { randomInt } = require('crypto');

// Simpan data di memory
const apiStats = {
  startTime: Date.now(),
  requests: 0,
  users: new Map() // Format: { ip: { battery: number, lastSeen: number } }
};

// Fungsi utama
function monitorAPI(ip, batteryLevel) {
  try {
    // Validasi input
    if (!ip) ip = `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;
    if (batteryLevel === undefined) batteryLevel = randomInt(10, 100);

    // Update data
    apiStats.requests++;
    apiStats.users.set(ip, { 
      battery: batteryLevel,
      lastSeen: Date.now() 
    });

    // Bersihkan user tidak aktif (>5 menit)
    const now = Date.now();
    for (const [userIp, data] of apiStats.users.entries()) {
      if (now - data.lastSeen > 300000) apiStats.users.delete(userIp);
    }

    // Hitung uptime
    const uptimeMs = now - apiStats.startTime;
    const uptime = {
      days: Math.floor(uptimeMs / 86400000),
      hours: Math.floor((uptimeMs % 86400000) / 3600000),
      minutes: Math.floor((uptimeMs % 3600000) / 60000)
    };

    return {
      success: true,
      stats: {
        ipAddress: ip,
        battery: `${batteryLevel}%`,
        totalRequests: apiStats.requests,
        activeUsers: apiStats.users.size,
        uptime: `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m`,
        users: Array.from(apiStats.users.entries()).map(([ip, data]) => ({
          ip,
          battery: `${data.battery}%`,
          lastActive: new Date(data.lastSeen).toLocaleTimeString()
        }))
      }
    };
  } catch (err) {
    return {
      success: false,
      error: "Monitoring error",
      fallbackStats: {
        ipAddress: "N/A",
        battery: "N/A",
        totalRequests: 0,
        activeUsers: 0,
        uptime: "0d 0h 0m"
      }
    };
  }
}

// Contoh penggunaan
console.log(monitorAPI("192.168.1.105", 85)); // Manual input
console.log(monitorAPI()); // Auto-generate data

module.exports = monitorAPI;
