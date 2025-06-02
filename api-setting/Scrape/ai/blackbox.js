const axios = require("axios");
const url = 'https://www.blackbox.ai/api/chat';
const headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Cookie': 'sessionId=429c3532-6a45-4dbc-83cb-2e906dbb87a7; render_app_version_affinity=dep-d0ufa5re5dus7396pq70; _gcl_au=1.1.842405073.1748857311; __Host-authjs.csrf-token=9970d6bf2f1aa6593be43c0413219592c454c12ae442844d482f0832d0082fd0%7C3d26219a2bdfc2d3d33535b7cedef80c79198aabb8dc03b866cd36c6d3339207; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; intercom-id-x55eda6t=cd93b365-ae6e-4e0b-a8fc-a95837187320; intercom-session-x55eda6t=; intercom-device-id-x55eda6t=e3dd8356-d39f-45b2-b0ef-ae85de5e87a8',
    'Origin': 'https://www.blackbox.ai',
    'Referer': 'https://www.blackbox.ai/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
};

async function blackbox(text) {
    const requestData = {
        "messages": [
            {
                "id": "mama232",
                "content": text,
                "role": "user"
            }
        ],
        "id": "mama232",
        "previewToken": null,
        "userId": null,
        "codeModelMode": true,
        "trendingAgentMode": {},
        "isMicMode": false,
        "userSystemPrompt": null,
        "maxTokens": 1024,
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
        "validated": "00f37b34-a166-4efb-bce4-1312d87f2f94",
        "imageGenerationMode": false,
        "webSearchModePrompt": false,
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
            "webMode": false,
            "offlineMode": false
        },
        "session": null,
        "isPremium": false,
        "subscriptionCache": null,
        "beastMode": false,
        "reasoningMode": false,
        "designerMode": false,
        "workspaceId": "",
        "asyncMode": false,
        "isTaskPersistent": false
    };

    try {
        const response = await axios.post(url, requestData, { headers: headers });
        return response.data;
    } catch (error) {
        console.error("Error:");
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
            console.error("Headers:", error.response.headers);
        } else if (error.request) {
            console.error("Request details:", error.request);
        } else {
            console.error("Error Message:", error.message);
        }
        console.error("Config used:", error.config);
        throw error;
    }
}

// Test the function (wrapped in async IIFE since top-level await isn't available in CJS)
(async () => {
    try {
        const test = await blackbox('Aku mau kamu');
        console.log("Response:", test);
    } catch (error) {
        console.error("Test failed:", error);
    }
})();

module.exports = blackbox;
