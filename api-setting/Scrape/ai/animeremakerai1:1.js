const axios = require('axios');
const FormData = require('form-data');

async function remakerai(prompt) {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('style', 'anime');
    form.append('aspect_ratio', '1:1');
    
    const headers = {
        ...form.getHeaders(),
        accept: '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        authorization: '',
        origin: 'https://remaker.ai',
        priority: 'u=1, i',
        'product-code': '067003',
        'product-serial': 'c25cb430662409bdea35c95eceaffa1f', // Updated product serial
        referer: 'https://remaker.ai/',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    };
    
    try {
        // Create the job
        const createResponse = await axios.post(
            'https://api.remaker.ai/api/pai/v4/ai-anime/create-job',
            form, { headers }
        );
        
        const job_id = createResponse.data.result.job_id;
        let imageUrl;
        
        // Check job status periodically
        for (let i = 0; i < 20; i++) {
            const checkResponse = await axios.get(
                `https://api.remaker.ai/api/pai/v4/ai-anime/get-job/${job_id}`, 
                { headers }
            );
            
            const result = checkResponse.data.result?.output;
            if (result && result.length > 0) {
                imageUrl = result[0];
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!imageUrl) {
            throw new Error('Failed to get image URL after multiple attempts');
        }
        
        // Download the image as Buffer
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        
        return Buffer.from(imageResponse.data, 'binary');
        
    } catch (error) {
        throw new Error(`Error in remakerai: ${error.message}`);
    }
}

module.exports = remakerai;
