const axios = require('axios');
const fs = require('fs');

async function checkProgress(id) {
    const config = {
        method: 'GET',
        url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }

    while (true) {
        const response = await axios.request(config);
        if (response.data?.success && response.data.progress === 1000) {
            return response.data.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function ytdl(url) {
    const response = await axios.get(
        `https://p.oceansaver.in/ajax/download.php?format=mp3&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }
    );

    if (!response.data?.success) {
        throw new Error('Gagal memproses URL YouTube');
    }

    return await checkProgress(response.data.id);
}

// Hot reload
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Memperbarui ${__filename}`);
    delete require.cache[file];
    require(file);
});

module.exports = ytdl;
