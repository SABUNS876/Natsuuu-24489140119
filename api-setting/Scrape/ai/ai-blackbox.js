const axios = require('axios');
const crypto = require('crypto');

async function blackboxChat(text) {
  const userId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const sessionId = crypto.randomBytes(8).toString('hex');
  
  const url = 'https://www.blackbox.ai';
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Cookie': `userId=${userId}; sessionId=${sessionId}`,
    'Referer': 'https://www.blackbox.ai',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };

  const params = {
    q: text,
    userId: userId
  };

  try {
    const response = await axios.get(url, {
      headers: headers,
      params: params
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = blackboxChat;
