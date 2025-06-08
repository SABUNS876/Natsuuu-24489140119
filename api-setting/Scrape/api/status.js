const { randomInt } = require('crypto');

class APIMonitor {
  constructor() {
    this.startTime = new Date();
    this.totalRequests = 0;
    this.activeUsers = new Map(); // IP: lastActiveTimestamp
    this.apiStatus = "operational";
    this.apiCount = 1; // Adjust if multiple APIs
  }

  // Track a user request
  trackRequest(ip) {
    this.totalRequests++;
    this.activeUsers.set(ip, Date.now());
    this.cleanInactiveUsers(); // Auto-clean old users
  }

  // Remove users inactive for >30 mins
  cleanInactiveUsers() {
    const now = Date.now();
    for (const [ip, lastActive] of this.activeUsers.entries()) {
      if (now - lastActive > 30 * 60 * 1000) {
        this.activeUsers.delete(ip);
      }
    }
  }

  // Simulate status changes (replace with real checks)
  updateStatus() {
    const statuses = ["active", "degraded", "maintenance"];
    this.apiStatus = statuses[randomInt(0, 2)];
  }

  // Get current stats
  getStats() {
    const uptimeMs = Date.now() - this.startTime;
    return {
      apiCount: this.apiCount,
      uptime: this.formatUptime(uptimeMs),
      status: this.apiStatus,
      activeUsers: this.activeUsers.size,
      totalRequests: this.totalRequests,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Format uptime (ms → "Xd Yh Zm")
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }
}

// Singleton instance
const apiMonitor = new APIMonitor();

// Simulate status changes (optional)
setInterval(() => {
  apiMonitor.updateStatus();
}, randomInt(5, 11) * 60 * 1000); // Every 5-10 mins

module.exports = apiMonitor;
