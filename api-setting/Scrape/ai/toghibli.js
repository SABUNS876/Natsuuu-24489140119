/**
 * GHIBLI AI IMAGE TRANSFORMER
 * Returns image URL links only (no direct image handling)
 * 
 * Notes:
 * - Default 1:1 square ratio
 * - Auto session management to bypass limits
 * - Processing takes 2-3 minutes
 * - Max retries recommended (5-10 minutes)
 */

const axios = require('axios');
const crypto = require('crypto');

async function transformToGhibli(imageUrl, options = {}) {
  const {
    prompt = "Please convert this image into Studio Ghibli art style",
    maxRetries = 90, // 3 minutes with 2s interval
    retryInterval = 2000
  } = options;

  // Generate unique session ID
  const sessionId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();

  const payload = {
    imageUrl,
    sessionId,
    prompt,
    timestamp
  };

  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  };

  try {
    // 1. Submit transformation request
    const submitResponse = await axios.post(
      "https://ghibliai.ai/api/transform-stream",
      payload,
      { headers, timeout: 10000 }
    );

    const taskId = submitResponse.data.taskId;
    if (!taskId) throw new Error("No task ID received");

    // 2. Poll for results
    let attempts = 0;
    while (attempts < maxRetries) {
      attempts++;
      
      const pollResponse = await axios.get(
        `https://ghibliai.ai/api/transform-stream?taskId=${taskId}`,
        { headers, timeout: 10000 }
      );

      const result = pollResponse.data;

      if (result.status === "success") {
        // Return only the image URL (not the image data)
        return {
          success: true,
          imageUrl: result.imageUrl || result.resultUrl, // Adapt based on actual API response
          metadata: {
            sessionId,
            attempts,
            processingTime: `${attempts * (retryInterval/1000)} seconds`
          }
        };
      }

      if (result.status === "error") {
        throw new Error(result.error || "Transformation failed");
      }

      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }

    throw new Error("Max retries reached without success");

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      metadata: {
        sessionId
      }
    };
  }
}

module.exports = transformToGhibli;
