const axios = require("axios");
const crypto = require("crypto");

const url = 'https://www.blackbox.ai/api/chat';
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Origin': 'https://www.blackbox.ai',
    'Referer': 'https://www.blackbox.ai/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + Math.floor(Math.random() * 50) + '.0.0.0 Safari/537.36',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
};

function generateRandomId() {
    return crypto.randomBytes(16).toString('hex');
}

function getDynamicHeaders() {
    return {
        ...defaultHeaders,
        'Cookie': `sessionId=${generateRandomId()}; render_app_version_affinity=dep-${generateRandomId().substring(0, 16)}`,
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(100 + Math.random() * 50)}.0.0.0 Safari/537.36`
    };
}

async function blackbox(text, options = {}) {
    const {
        userId = generateRandomId(),
        maxTokens = 2048,
        codeModelMode = false,
        webSearchMode = true,
        isPremium = false,
        beastMode = true
    } = options;

    const requestData = {
        "messages": [
            {
                "id": generateRandomId(),
                "content": text,
                "role": "user"
            }
        ],
        "id": generateRandomId(),
        "previewToken": null,
        "userId": userId,
        "codeModelMode": codeModelMode,
        "trendingAgentMode": {},
        "isMicMode": false,
        "userSystemPrompt": null,
        "maxTokens": maxTokens,
        "playgroundTopP": null,
        "playgroundTemperature": null,
        "isChromeExt": false,
        "githubToken": "",
        "clickedAnswer2": false,
        "clickedAnswer3": false,
        "clickedForceWebSearch": false,
        "visitFromDelta": false,
        "isMemoryEnabled": false,
        "mobileClient": false,
        "userSelectedModel": null,
        "validated": generateRandomId(),
        "imageGenerationMode": false,
        "webSearchModePrompt": webSearchMode,
        "deepSearchMode": false,
        "domains": null,
        "vscodeClient": false,
        "codeInterpreterMode": false,
        "customProfile": {
            "name": "",
            "occupation": "",
            "traits": [],
            "additionalInfo": "",
            "enableNewChats": false
        },
        "webSearchModeOption": {
            "autoMode": true,
            "webMode": webSearchMode,
            "offlineMode": false
        },
        "session": null,
        "isPremium": isPremium,
        "subscriptionCache": null,
        "beastMode": beastMode,
        "reasoningMode": false,
        "designerMode": false,
        "workspaceId": "",
        "asyncMode": false,
        "isTaskPersistent": false
    };

    try {
        const headers = getDynamicHeaders();
        const response = await axios.post(url, requestData, { 
            headers,
            timeout: 30000
        });
        
        return {
            success: true,
            data: response.data,
            metadata: {
                requestId: requestData.id,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error("Error:", error.message);
        return {
            success: false,
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        };
    }
}

// Rate limiter to avoid hitting API limits
const rateLimiter = {
    lastRequest: 0,
    minInterval: 2000, // 2 seconds between requests
    async wait() {
        const now = Date.now();
        const waitTime = this.lastRequest + this.minInterval - now;
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequest = Date.now();
    }
};

// Enhanced version with rate limiting
async function enhancedBlackbox(text, options = {}) {
    await rateLimiter.wait();
    return await blackbox(text, options);
}

// Test the function
(async () => {
    try {
        const test = await enhancedBlackbox('Aku mau kamu', {
            maxTokens: 4096,
            beastMode: true,
            webSearchMode: true
        });
        console.log("Response:", test);
    } catch (error) {
        console.error("Test failed:", error);
    }
})();

module.exports = {
    blackbox: enhancedBlackbox,
    generateRandomId,
    getDynamicHeaders
};
