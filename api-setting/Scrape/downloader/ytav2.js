const axios = require('axios');
const fs = require('fs');

async function checkProgress(id) {
    const config = {
        method: 'GET',
        url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        },
        timeout: 30000 // timeout 30 detik
    }

    let retry = 0;
    const maxRetries = 10; // maksimal 10x percobaan
    
    while (retry < maxRetries) {
        try {
            const response = await axios.request(config);
            
            if (response.data?.success) {
                if (response.data.progress === 1000) {
                    return response.data.download_url;
                }
                console.log(`Progress: ${response.data.progress/10}%`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            retry++;
            
        } catch (error) {
            console.error(`Percobaan ke-${retry + 1} gagal:`, error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
            retry++;
        }
    }
    
    throw new Error('Gagal mendapatkan URL download setelah beberapa percobaan');
}

async function ytdl(url) {
    try {
        const config = {
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/download.php`,
            params: {
                format: 'mp3',
                url: encodeURIComponent(url),
                api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout: 30000
        };

        const response = await axios(config);
        
        if (!response.data?.success) {
            throw new Error(response.data?.message || 'Gagal memulai proses download');
        }

        return await checkProgress(response.data.id);
        
    } catch (error) {
        throw new Error(`Error: ${error.response?.data?.message || error.message}`);
    }
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
