const axios = require('axios');
const dns = require('dns').promises;
const { URL } = require('url');

async function checkWebsite(url) {
  try {
    const parsedUrl = new URL(url);
    const startTime = Date.now();
    
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    const endTime = Date.now();
    const ip = await resolveDNS(parsedUrl.hostname).catch(() => null);
    
    return {
      url,
      status: response.status,
      responseTime: `${endTime - startTime}ms`,
      ip,
      ssl: parsedUrl.protocol === 'https:',
      available: response.status < 400
    };
  } catch (error) {
    return {
      url,
      error: error.message,
      available: false
    };
  }
}

async function checkIP(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
      timeout: 5000
    });
    
    return {
      ip,
      hostname: response.data.hostname || null,
      isp: response.data.org || null,
      city: response.data.city || null,
      country: response.data.country || null
    };
  } catch (error) {
    throw new Error(`IP check failed: ${error.message}`);
  }
}

async function resolveDNS(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    return addresses[0];
  } catch {
    try {
      const addresses = await dns.resolve6(hostname);
      return addresses[0];
    } catch (error) {
      throw new Error(`DNS resolution failed: ${error.message}`);
    }
  }
}

// Unified function
async function networkChecker(target, type = 'auto') {
  try {
    // Auto-detect if target is URL or IP
    if (type === 'auto') {
      type = target.match(/^https?:\/\//) ? 'website' : 
             target.match(/^\d+\.\d+\.\d+\.\d+$/) ? 'ip' : 
             'invalid';
    }

    if (type === 'website') {
      return await checkWebsite(target);
    } else if (type === 'ip') {
      return await checkIP(target);
    } else {
      throw new Error('Invalid target - must be website URL or IP address');
    }
  } catch (error) {
    throw error;
  }
}

module.exports = networkChecker;
