const axios = require('axios');

async function bluearchive() {
    try {
        const { data } = await axios.get(`https://raw.githubusercontent.com/rynxzyy/blue-archive-r-img/refs/heads/main/links.json`);
        const response = await axios.get(data[Math.floor(data.length * Math.random())], { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        throw error;
    }
}

module.exports = bluearchive;
