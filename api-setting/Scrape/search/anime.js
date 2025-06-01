const cheerio = require('cheerio');
const axios = require('axios');

// Object berisi semua method scraper
const AnimeIndo = {
    latest: async () => {
        try {
            const response = await axios.get('https://anime-indo.lol/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const anime = [];
            
            $('.list-anime').each((index, element) => {
                const title = $(element).find('p').text().trim();
                const episode = $(element).find('.eps').text().trim();
                const image = $(element).find('img').attr('data-original') || $(element).find('img').attr('src');
                const link = 'https://anime-indo.lol' + $(element).parent().attr('href');
                
                anime.push({
                    title,
                    episode,
                    image,
                    link
                });
            });
            
            return anime;
        } catch (error) {
            throw new Error(`Gagal mengambil anime terbaru: ${error.message}`);
        }
    },
    
    search: async (query) => {
        try {
            const { data } = await axios.get(`https://anime-indo.lol/search/${encodeURIComponent(query)}/`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(data);
            const anime = [];
            
            $('.otable').each((i, e) => {
                const title = $(e).find('.videsc a').text().trim();
                const description = $(e).find('.des').text().trim();
                const status = $(e).find('.label').text().split(/ +/)[0];
                const thumbnail = 'https://anime-indo.lol' + $(e).find('img').attr('src');
                const url = 'https://anime-indo.lol' + $(e).find('a').attr('href');
                
                anime.push({
                    title,
                    description,
                    status,
                    thumbnail,
                    url
                });
            });
            
            return anime;
        } catch (error) {
            throw new Error(`Gagal mencari anime: ${error.message}`);
        }
    },
    
    getDetail: async (url) => {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(data);
            const detail = {
                title: $('.entry-title').text().trim(),
                synopsis: $('.entry-content p').text().trim(),
                episodes: []
            };
            
            $('.eplister ul li').each((i, el) => {
                const episode = $(el).find('.epl-num').text().trim();
                const episodeUrl = $(el).find('a').attr('href');
                const date = $(el).find('.epl-date').text().trim();
                
                detail.episodes.push({
                    episode,
                    url: episodeUrl,
                    date
                });
            });
            
            return detail;
        } catch (error) {
            throw new Error(`Gagal mengambil detail anime: ${error.message}`);
        }
    }
};

// Fungsi handler utama yang akan diekspor
async function handler(params, method = 'latest') {
    try {
        // Validasi method yang tersedia
        const availableMethods = ['latest', 'search', 'getDetail'];
        if (!availableMethods.includes(method)) {
            throw new Error(`Method '${method}' tidak tersedia. Gunakan: ${availableMethods.join(', ')}`);
        }

        // Validasi parameter berdasarkan method
        if (method === 'search' && (!params || !params[0])) {
            throw new Error('Query pencarian diperlukan');
        }

        if (method === 'getDetail' && (!params || !params[0])) {
            throw new Error('URL detail diperlukan');
        }

        // Panggil method yang sesuai
        let result;
        switch(method) {
            case 'latest':
                result = await AnimeIndo.latest();
                break;
            case 'search':
                result = await AnimeIndo.search(params[0]);
                break;
            case 'getDetail':
                result = await AnimeIndo.getDetail(params[0]);
                break;
        }

        return result;
    } catch (error) {
        console.error(`Error in handler (${method}):`, error);
        throw error; // Re-throw error untuk ditangkap oleh caller
    }
}

// Ekspor fungsi handler langsung
module.exports = handler;
