const WebSocket = require('ws');

function growagarden() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://ws.growagardenpro.com', [], {
            headers: {
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'cache-control': 'no-cache',
                connection: 'Upgrade',
                host: 'ws.growagardenpro.com',
                origin: 'https://growagardenpro.com',
                pragma: 'no-cache',
                'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
                'sec-websocket-key': 'TBIaQ04Blb4aAA2qgBCZdA==',
                'sec-websocket-version': '13',
                upgrade: 'websocket',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });
        
        ws.onopen = () => console.log('WebSocket Connected');
        
        ws.onmessage = (event) => {
            try {
                resolve(JSON.parse(event.data));
            } catch {
                resolve(event.data);
            }
            ws.close();
        };
        
        ws.onerror = reject;
        ws.onclose = () => console.log('WebSocket connection closed');
    });
}

// Example usage (wrapped in async function since top-level await isn't available in CJS)
async function test() {
    try {
        const resp = await growagarden();
        console.log(resp);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to test
// test();

module.exports = growagarden;
