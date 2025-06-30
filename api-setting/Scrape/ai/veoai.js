const axios = require('axios');
const cheerio = require('cheerio');

async function veoVideo(prompt, { quality = '720p', duration = '30s' } = {}) {
    try {
        // Validasi parameter
        const qualityList = ['360p', '480p', '720p', '1080p'];
        const durationList = ['15s', '30s', '60s'];
        
        if (!prompt) throw new Error('Prompt is required');
        if (!qualityList.includes(quality)) throw new Error(`Available qualities: ${qualityList.join(', ')}`);
        if (!durationList.includes(duration)) throw new Error(`Available durations: ${durationList.join(', ')}`);

        // 1. Request ke halaman utama untuk mendapatkan token CSRF
        const homePage = await axios.get('https://veo.ai', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(homePage.data);
        const csrfToken = $('meta[name="csrf-token"]').attr('content');

        // 2. Generate video berdasarkan prompt
        const generateResponse = await axios.post('https://veo.ai/api/v1/videos/generate', {
            prompt: prompt,
            quality: quality,
            duration: duration,
            style: 'realistic' // bisa disesuaikan
        }, {
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json',
                'Referer': 'https://veo.ai/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const videoId = generateResponse.data.video_id;
        
        // 3. Cek status render video
        let videoUrl;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 3000)); // Tunggu 3 detik
            
            const statusResponse = await axios.get(`https://veo.ai/api/v1/videos/status/${videoId}`, {
                headers: {
                    'Referer': 'https://veo.ai/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (statusResponse.data.status === 'completed') {
                videoUrl = statusResponse.data.video_url;
                break;
            } else if (statusResponse.data.status === 'failed') {
                throw new Error('Video generation failed');
            }
        }

        if (!videoUrl) throw new Error('Video generation timeout');

        // 4. Download video
        const videoResponse = await axios.get(videoUrl, {
            responseType: 'stream',
            headers: {
                'Referer': 'https://veo.ai/'
            }
        });

        return videoResponse.data;

    } catch (error) {
        console.error('Veo.ai Error:', error.message);
        throw new Error(`Failed to generate video: ${error.message}`);
    }
}

// Contoh penggunaan
async function test() {
    try {
        const videoStream = await veoVideo('sunset at beach with palm trees', {
            quality: '720p',
            duration: '30s'
        });

        // Simpan video ke file
        const fs = require('fs');
        const writer = fs.createWriteStream('output.mp4');
        videoStream.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Jalankan test jika file di-run langsung
if (require.main === module) {
    test().then(() => console.log('Video saved as output.mp4'));
}

module.exports = veoVideo;
