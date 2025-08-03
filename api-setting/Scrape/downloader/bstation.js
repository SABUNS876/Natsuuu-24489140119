const axios = require('axios');
const fs = require('fs');

async function BiliBiliDownloader(url) {
    try {
        // Validasi URL
        if (!url || !url.includes('bilibili')) {
            throw new Error('URL Bilibili tidak valid');
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        // Langsung dapatkan URL download
        const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${url.split('/').pop()}`;
        const response = await axios.get(apiUrl, { headers });
        
        if (!response.data.data) {
            throw new Error('Video tidak ditemukan');
        }

        const videoData = response.data.data;
        const downloadUrl = videoData.durl?.[0]?.url;

        if (!downloadUrl) {
            throw new Error('Tidak dapat mendapatkan URL download');
        }

        // Download video
        const videoResponse = await axios.get(downloadUrl, { 
            headers,
            responseType: 'stream' 
        });

        const fileName = `bilibili_${Date.now()}.mp4`;
        const writer = fs.createWriteStream(fileName);

        videoResponse.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve({
                status: 'success',
                filePath: fileName,
                videoInfo: {
                    title: videoData.title,
                    author: videoData.owner.name,
                    duration: videoData.duration
                }
            }));
            writer.on('error', reject);
        });

    } catch (error) {
        console.error('Error:', error.message);
        return {
            status: 'error',
            message: error.message
        };
    }
}

module.exports = BiliBiliDownloader;
