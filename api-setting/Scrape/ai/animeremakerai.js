const axios = require('axios');
const FormData = require('form-data');

// Cookie dari file Netscape format
const COOKIES = {
    '_ga': 'GA1.1.608323039.1750914940',
    '_ga_9QXEF94NQ6': 'GS2.1.s1750914939$o1$g1$t1750915186$j46$l0$h795358565',
    'g_state': '{"i_l":0}'
};

async function remakerai(prompt) {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('style', 'anime');
    form.append('aspect_ratio', '16:9');
    
    // Format cookies untuk header
    const cookieString = Object.entries(COOKIES)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    
    const headers = {
        ...form.getHeaders(),
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'cookie': cookieString,
        'origin': 'https://remaker.ai',
        'priority': 'u=1, i',
        'product-code': '067003',
        'product-serial': 'c25cb430662409bdea35c95eceaffa1f',
        'referer': 'https://remaker.ai/',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    };
    
    try {
        // Buat instance axios dengan cookie jar
        const instance = axios.create({
            headers,
            withCredentials: true
        });

        // Create the job
        const createResponse = await instance.post(
            'https://api.remaker.ai/api/pai/v4/ai-anime/create-job',
            form
        );
        
        const job_id = createResponse.data.result.job_id;
        let imageUrl;
        
        // Check job status
        for (let i = 0; i < 20; i++) {
            const checkResponse = await instance.get(
                `https://api.remaker.ai/api/pai/v4/ai-anime/get-job/${job_id}`
            );
            
            const result = checkResponse.data.result?.output;
            if (result && result.length > 0) {
                imageUrl = result[0];
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!imageUrl) {
            throw new Error('Gagal mendapatkan URL gambar setelah beberapa percobaan');
        }
        
        // Download gambar
        const imageResponse = await instance.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        
        return Buffer.from(imageResponse.data, 'binary');
        
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

module.exports = remakerai;
