/**
 * Wm: Nopal ganteng
 * hapus wm boleh tapi doakan kesahatan yang bikin
 * Jangan lupa sholat
 * Base:https://www.blackbox.ai
 * Eror chat saja ma 
 */
const axios = require("axios");
const crypto = require("crypto");

const url = 'https://www.blackbox.ai'; 

function randomizeCookie(originalCookie) {
    const parts = originalCookie.split('; ');
    const newCookieParts = [];

    for (const part of parts) {
        const [key, ...valueParts] = part.split('=');
        let value = valueParts.join('=');

        if (key === 'sessionId') {
            value = crypto.randomUUID();
        } else if (key === '__Host-authjs.csrf-token') {
            const csrfPart1 = crypto.randomBytes(32).toString('hex');
            const csrfPart2 = crypto.randomBytes(32).toString('hex');
            value = `${csrfPart1}%7C${csrfPart2}`;
        } else if (key === 'intercom-id-x55eda6t') {
            value = crypto.randomUUID();
        } else if (key === 'intercom-device-id-x55eda6t') {
            value = crypto.randomUUID();
        }
        
        newCookieParts.push(`${key}=${value}`);
    }
    return newCookieParts.join('; ');
}

const initialCookieString = 'sessionId=429c3532-6a45-4dbc-83cb-2e906dbb87a7; render_app_version_affinity=dep-d0ufa5re5dus7396pq70; _gcl_au=1.1.842405073.1748857311; __Host-authjs.csrf-token=9970d6bf2f1aa6593be43c0413219592c454c12ae442844d482f0832d0082fd0%7C3d26219a2bdfc2d3d33535b7cedef80c79198aabb8dc03b866cd36c6d3339207; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; intercom-id-x55eda6t=cd93b365-ae6e-4e0b-a8fc-a95837187320; intercom-session-x55eda6t=; intercom-device-id-x55eda6t=e3dd8356-d39f-45b2-b0ef-ae85de5e87a8';

// Rate limiting implementation
let lastRequestTime = 0;
const requestDelay = 2000; // 2 seconds between requests

async function blackbox(text) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < requestDelay) {
        await new Promise(resolve => setTimeout(resolve, requestDelay - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Cookie': randomizeCookie(initialCookieString),
        'Origin': 'https://www.blackbox.ai', 
        'Referer': 'https://www.blackbox.ai/', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + 
                     (100 + Math.floor(Math.random() * 50)) + '.0.0.0 Safari/537.36',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    };

    const requestData = {
        "messages": [{
            "id": crypto.randomBytes(8).toString('hex'),
            "content": text,
            "role": "user"
        }],
        "id": crypto.randomBytes(8).toString('hex'),
        "previewToken": null,
        "userId": crypto.randomBytes(8).toString('hex'),
        "codeModelMode": true,
        "trendingAgentMode": {},
        "isMicMode": false,
        "userSystemPrompt": null,
        "maxTokens": 2048, // Increased from 1024
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
        "validated": crypto.randomBytes(16).toString('hex'),
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
        console.log(`Sending request to Blackbox AI`);
        const response = await axios.post(url, requestData, { 
            headers,
            timeout: 30000 // 30 seconds timeout
        });
        return response.data;
    } catch (error) {
        console.error("Error occurred:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Request setup error:", error.message);
        }
        throw new Error(`Blackbox AI request failed: ${error.message}`);
    }
}

module.exports = blackbox;
