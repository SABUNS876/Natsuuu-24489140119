const axios = require('axios');
const crypto = require('crypto');

async function blackboxChat(text) {
  const userId = `user-${crypto.randomBytes(4).toString('hex')}`;
  const sessionId = crypto.randomBytes(8).toString('hex');
  
  const url = 'https://www.blackbox.ai';
  const headers = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
    'Cookie': `userId=${userId}; sessionId=${sessionId}`,
    'Origin': 'https://www.blackbox.ai',
    'Referer': 'https://www.blackbox.ai/chat',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };
  
  const data = {
    messages: [{
      role: "user",
      content: text
    }],
    id: userId,
    previewToken: null,
    codeModelMode: true,
    agentMode: {},
    trendingAgentMode: {},
    isMicMode: false,
    isChromeExt: false,
    githubToken: null
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = blackboxChat;
