const axios = require('axios');
const crypto = require('crypto');

async function transformToGhibli(imageUrl, options = {}) {
  const {
    prompt = "Convert to Studio Ghibli art style",
    maxRetries = 30, // 30 attempts
    retryInterval = 5000, // 5 seconds between retries
    apiTimeout = 30000 // 30 seconds timeout per request
  } = options;

  const sessionId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();

  const payload = { imageUrl, sessionId, prompt, timestamp };
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  };

  let lastError = null;

  try {
    // 1. Submit transformation request
    const submitResponse = await axios.post(
      "https://ghibliai.ai/api/transform-stream",
      payload,
      { 
        headers,
        timeout: apiTimeout 
      }
    );

    const taskId = submitResponse.data?.taskId;
    if (!taskId) throw new Error("No task ID received from API");

    // 2. Poll for results with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pollResponse = await axios.get(
          `https://ghibliai.ai/api/transform-stream?taskId=${taskId}`,
          { 
            headers,
            timeout: apiTimeout 
          }
        );

        const result = pollResponse.data;

        if (result?.status === "success" && result.imageUrl) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            metadata: {
              sessionId,
              attempts: attempt,
              processingTime: `${attempt * (retryInterval/1000)} seconds`
            }
          };
        }

        if (result?.status === "error") {
          lastError = result.error || "Transformation failed";
          break;
        }

      } catch (error) {
        lastError = error.response?.data?.error || error.message;
        // Continue to next attempt unless it's a fatal error
        if (error.response?.status >= 500) {
          await new Promise(r => setTimeout(r, retryInterval));
          continue;
        }
        break;
      }

      await new Promise(r => setTimeout(r, retryInterval));
    }

    throw new Error(lastError || "Max retries reached without success");

  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        sessionId,
        lastError: lastError
      }
    };
  }
}

module.exports = transformToGhibli;
