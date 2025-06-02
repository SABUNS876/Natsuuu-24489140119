const axios = require("axios");

async function blackboxAi(query) {
  try {
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'id-ID,id;q=0.9',
      'Content-Type': 'application/json',
      'Origin': 'https://www.blackbox.ai',
      'Referer': 'https://www.blackbox.ai/',
      'Sec-Ch-Ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
    };

    const payload = {
      messages: [{ role: 'user', content: query, id: '0quFtyH' }],
      id: 'KB5EUHk',
      previewToken: null,
      userId: null,
      codeModelMode: true,
      trendingAgentMode: {},
      isMicMode: false,
      userSystemPrompt: null,
      maxTokens: 1024,
      playgroundTopP: null,
      playgroundTemperature: null,
      isChromeExt: false,
      githubToken: '',
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      isMemoryEnabled: false,
      mobileClient: false,
      userSelectedModel: null,
      validated: '00f37b34-a166-4efb-bce5-1312d87f2f94',
      imageGenerationMode: false,
      webSearchModePrompt: false,
      deepSearchMode: false,
      domains: null,
      vscodeClient: false,
      codeInterpreterMode: false,
      customProfile: {
        name: '',
        occupation: '',
        traits: [],
        additionalInfo: '',
        enableNewChats: false
      },
      webSearchModeOption: {
        autoMode: true,
        webMode: false,
        offlineMode: false
      },
      session: null,
      isPremium: false,
      subscriptionCache: null,
      beastMode: false,
      reasoningMode: false,
      designerMode: false,
      workspaceId: '',
      asyncMode: false,
      isTaskPersistent: false
    };

    const postRes = await axios.post('https://www.blackbox.ai/api/chat', payload, {
      headers
    });

    const raw = postRes.data;
    const parsed = raw.split('$~~~$');
    if (parsed.length === 1) {
      return {
        creator: global.creator,
        status: true,
        data: {
          response: parsed[0].trim(),
          source: []
        }
      };
    } else if (parsed.length >= 3) {
      const resultText = parsed[2].trim();
      const resultSources = JSON.parse(parsed[1]);
      return {
        creator: global.creator,
        status: true,
        data: {
          response: resultText,
          source: resultSources.map(s => ({
            link: s.link,
            title: s.title,
            snippet: s.snippet,
            position: s.position
          }))
        }
      };
    } else {
      throw new Error("Format response tidak dikenali.");
    }
  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
    return {
      creator: global.creator,
      status: false,
      error: err.message
    };
  }
}

module.exports = blackboxAi;
