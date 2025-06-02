const axios = require("axios");
const crypto = require("crypto");

/**
 * BLACKBOX AI SCRAPER
 * Fitur Utama:
 * - Auto generate random cookies dan headers
 * - Rate limiting otomatis
 * - Error handling komprehensif
 * - Support berbagai parameter request
 * - Anti-ban system
 */

// ====================== KONFIGURASI UTAMA ======================
const BASE_URL = 'https://www.blackbox.ai/api/chat';
const DEFAULT_TIMEOUT = 30000; // 30 detik
const RATE_LIMIT_DELAY = 2000; // 2 detik antara request

// ====================== UTILITY FUNCTIONS ======================
function generateRandomId(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

function generateUserAgent() {
    const versions = [
        `Chrome/${100 + Math.floor(Math.random() * 50)}.0.0.0`,
        `Firefox/${100 + Math.floor(Math.random() * 30)}.0`,
        `Safari/${537 + Math.floor(Math.random() * 50)}.36`
    ];
    const platforms = [
        'Windows NT 10.0; Win64; x64',
        'Macintosh; Intel Mac OS X 10_15_7',
        'X11; Linux x86_64'
    ];
    return `Mozilla/5.0 (${platforms[Math.floor(Math.random() * platforms.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${versions[Math.floor(Math.random() * versions.length)]}`;
}

function generateDynamicCookies() {
    const cookies = {
        sessionId: crypto.randomUUID(),
        render_app_version_affinity: `dep-${generateRandomId(8)}`,
        _gcl_au: `1.1.${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now()/1000)}`,
        __Host_authjs_csrf_token: `${generateRandomId(32)}%7C${generateRandomId(32)}`,
        [`intercom-id-${generateRandomId(4)}`]: crypto.randomUUID(),
        [`intercom-device-id-${generateRandomId(4)}`]: crypto.randomUUID()
    };
    return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

// ====================== CORE FUNCTION ======================
let lastRequestTime = 0;

async function blackbox(query, options = {}) {
    // Validasi input
    if (!query || typeof query !== 'string') {
        throw new Error('Query harus berupa string yang valid');
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    // Konfigurasi request
    const requestConfig = {
        method: 'POST',
        url: BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Cookie': generateDynamicCookies(),
            'Origin': 'https://www.blackbox.ai',
            'Referer': 'https://www.blackbox.ai/',
            'User-Agent': generateUserAgent(),
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        },
        timeout: DEFAULT_TIMEOUT,
        data: {
            messages: [{
                id: generateRandomId(),
                content: query,
                role: "user"
            }],
            id: generateRandomId(),
            previewToken: null,
            userId: generateRandomId(),
            codeModelMode: options.codeMode !== false,
            maxTokens: Math.min(Math.max(options.maxTokens || 2048, 1024), 4096),
            webSearchModePrompt: !!options.webSearch,
            webSearchModeOption: {
                autoMode: true,
                webMode: !!options.webSearch,
                offlineMode: false
            },
            isPremium: false,
            beastMode: !!options.beastMode,
            validated: generateRandomId(32),
            // Parameter tambahan
            ...(options.extraParams || {})
        }
    };

    try {
        const response = await axios(requestConfig);
        return {
            success: true,
            data: response.data,
            metadata: {
                requestId: requestConfig.data.id,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        const errorInfo = {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            responseData: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method
            }
        };
        
        console.error('Blackbox API Error:', errorInfo);
        throw new Error(`Gagal memproses request: ${error.message}`);
    }
}

// ====================== EXPORT ======================
module.exports = blackbox;
