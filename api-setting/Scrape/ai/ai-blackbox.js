const axios = require('axios');
const crypto = require('crypto');

async function blackboxChat(text) {
  const userId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const sessionId = crypto.randomBytes(8).toString('hex');
  
  const url = 'https://www.blackbox.ai/chat'; // Endpoint API yang lebih mungkin
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Cookie': `userId=${userId}; sessionId=${sessionId}`
  };

  const data = {
    messages: [
      {
        role: "user",
        content: text
      }
    ],
    userId: userId,
    sessionId: sessionId
  };

  try {
    const response = await axios.post(url, data, {
      headers: headers
    });
    return response.data;
  } catch (error) {
    console.error('Error in blackboxChat:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = blackboxChat;
