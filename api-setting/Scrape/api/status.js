class APIMonitor {
  constructor() {
    this.startTime = new Date();
    this.totalRequests = 0;
    this.activeUsers = new Map(); // { ip: lastActive }
    this.status = "operational";
  }

  track(ip) {
    this.totalRequests++;
    this.activeUsers.set(ip, Date.now());
    this.cleanup();
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, lastActive] of this.activeUsers) {
      if (now - lastActive > 30 * 60 * 1000) {
        this.activeUsers.delete(ip);
      }
    }
  }

  getStats() {
    return {
      apiCount: 1, // Ganti jika punya banyak API
      uptime: this.formatUptime(),
      status: this.status,
      activeUsers: this.activeUsers.size,
      totalRequests: this.totalRequests,
      updatedAt: new Date().toISOString()
    };
  }

  formatUptime() {
    const sec = Math.floor((Date.now() - this.startTime) / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  }
}

const monitor = new APIMonitor();
module.exports = monitor;
