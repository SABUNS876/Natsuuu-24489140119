/**
 * Wm: Nopal ganteng
 * hapus wm boleh tapi doakan kesahatan yang bikin
 * Jangan lupa sholat
 * Base:https://www.blackbox.ai
 * Eror chat saja ma 
 */
const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = 'https://www.blackbox.ai';

function randomizeCookie() {
    return [
        `sessionId=${crypto.randomUUID()}`,
        `render_app_version_affinity=dep-${crypto.randomBytes(8).toString('hex')}`,
        `_gcl_au=1.1.${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now()/1000)}`,
        `__Host-authjs.csrf-token=${crypto.randomBytes(32).toString('hex')}%7C${crypto.randomBytes(32).toString('hex')}`,
        `intercom-id-${crypto.randomBytes(4).toString('hex')}=${crypto.randomUUID()}`,
        `intercom-device-id-${crypto.randomBytes(4).toString('hex')}=${crypto.randomUUID()}`
    ].join('; ');
}

async function blackbox(text) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Cookie': randomizeCookie(),
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    };

    const requestData = {
        messages: [{
            id: crypto.randomBytes(8).toString('hex'),
            content: text,
            role: "user"
        }],
        id: crypto.randomBytes(8).toString('hex'),
        previewToken: null,
        userId: crypto.randomBytes(8).toString('hex'),
        codeModelMode: true,
        maxTokens: 1024,
        validated: crypto.randomBytes(16).toString('hex')
    };

    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, requestData, { 
            headers,
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
        throw error;
    }
}

module.exports = blackbox;
