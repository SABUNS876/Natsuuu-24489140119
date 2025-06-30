const WebSocket = require('ws');
const axios = require('axios');

async function aiart(prompt, options = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                style = 'Anime',
                negativePrompt = '(worst quality, low quality:1.4), (greyscale, monochrome:1.1), cropped, lowres , username, blurry, trademark, watermark, title, multiple view, Reference sheet, curvy, plump, fat, strabismus, clothing cutout, side slit,worst hand, (ugly face:1.2), extra leg, extra arm, bad foot, text, name',
                scale = 7
            } = options;
            
            const _style = ['Anime', 'Realistic'];
            
            if (!prompt) return reject(new Error('Prompt is required'));
            if (!_style.includes(style)) return reject(new Error(`Available styles: ${_style.join(', ')}`));
            
            const session_hash = Math.random().toString(36).substring(2);
            const socket = new WebSocket('wss://app.yimeta.ai/ai-art-generator/queue/join');
            
            socket.on('open', () => {
                console.log('Connected to WebSocket server');
            });
            
            socket.on('message', async (data) => {
                try {
                    const d = JSON.parse(data.toString('utf8'));
                    switch (d.msg) {
                        case 'send_hash':
                            socket.send(JSON.stringify({
                                fn_index: 31,
                                session_hash,
                            }));
                            break;
                        
                        case 'send_data':
                            socket.send(JSON.stringify({
                                fn_index: 31,
                                session_hash,
                                data: [style, prompt, negativePrompt, scale, ''],
                            }));
                            break;
                        
                        case 'process_completed':
                            socket.close();
                            if (d.output && d.output.data && d.output.data[0] && d.output.data[0][0]) {
                                const imageUrl = d.output.data[0][0].name;
                                // Download the image as buffer
                                const response = await axios.get(imageUrl, {
                                    responseType: 'arraybuffer'
                                });
                                resolve(Buffer.from(response.data, 'binary'));
                            } else {
                                reject(new Error('Invalid response format from server'));
                            }
                            break;
                        
                        case 'error':
                            socket.close();
                            reject(new Error(d.error || 'Unknown error occurred'));
                            break;
                        
                        default:
                            // Ignore other message types
                            break;
                    }
                } catch (parseError) {
                    socket.close();
                    reject(new Error(`Error processing server response: ${parseError.message}`));
                }
            });
            
            socket.on('error', (error) => {
                socket.close();
                reject(new Error(`WebSocket error: ${error.message}`));
            });
            
            socket.on('close', () => {
                console.log('WebSocket connection closed');
            });
            
        } catch (error) {
            reject(new Error(error.message));
        }
    });
}

module.exports = aiart;

// Example usage:
// const fs = require('fs');
// aiart('beautiful anime girl').then(buffer => {
//     fs.writeFileSync('output.png', buffer);
//     console.log('Image saved as output.png');
// }).catch(console.error);
